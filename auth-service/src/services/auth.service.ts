import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { VerificationToken } from '../entities/verification-token.entity';
import { Session } from '../entities/session.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { UserGrpcClientService } from './user-grpc-client.service';
import { TenantGrpcClientService } from './tenant-grpc-client.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { RedisService } from './redis.service';
import {
  RegisterRequestDto,
  RegisterSuccessResponseDto,
  RegisterErrorResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailSuccessResponseDto,
  VerifyEmailErrorResponseDto,
  LoginRequestDto,
  LoginSuccessResponseDto,
  LoginErrorResponseDto,
  RequestPasswordResetRequestDto,
  RequestPasswordResetSuccessResponseDto,
  RequestPasswordResetErrorResponseDto,
  ValidateResetTokenRequestDto,
  ValidateResetTokenSuccessResponseDto,
  ValidateResetTokenErrorResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordSuccessResponseDto,
  ResetPasswordErrorResponseDto,
  LogoutRequestDto,
  LogoutSuccessResponseDto,
  LogoutErrorResponseDto,
  InvalidateUserSessionsRequestDto,
  InvalidateUserSessionsSuccessResponseDto,
  InvalidateUserSessionsErrorResponseDto,
  ChangePasswordFirstLoginRequestDto,
  ChangePasswordFirstLoginSuccessResponseDto,
  ChangePasswordFirstLoginErrorResponseDto,
} from '../dto/grpc.dto';

// Main authentication service implementing registration, login, and verification
@Injectable()
export class AuthService {
  private bcryptRounds: number;
  private verificationTokenExpirationHours: number;
  private sessionShortTtlHours: number;
  private sessionLongTtlDays: number;
  private sessionTempTtlMinutes: number;
  private maxFailedAttempts: number;
  private rateLimitWindowMinutes: number;
  private resetTokenExpirationHours: number;
  private maxResetRequestsPerEmail: number;
  private maxResetRequestsPerIp: number;

  constructor(
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly userGrpcClient: UserGrpcClientService,
    private readonly tenantGrpcClient: TenantGrpcClientService,
    private readonly eventPublisher: EventPublisherService,
    private readonly redisService: RedisService,
  ) {
    this.bcryptRounds = this.configService.get<number>('bcrypt.rounds') || 12;
    this.verificationTokenExpirationHours = this.configService.get<number>('verificationToken.expirationHours') || 24;
    this.sessionShortTtlHours = this.configService.get<number>('session.shortTtlHours') || 24;
    this.sessionLongTtlDays = this.configService.get<number>('session.longTtlDays') || 30;
    this.sessionTempTtlMinutes = this.configService.get<number>('session.tempTtlMinutes') || 15;
    this.maxFailedAttempts = this.configService.get<number>('session.maxFailedAttempts') || 5;
    this.rateLimitWindowMinutes = this.configService.get<number>('session.rateLimitWindowMinutes') || 15;
    this.resetTokenExpirationHours = this.configService.get<number>('resetToken.expirationHours') || 1;
    this.maxResetRequestsPerEmail = this.configService.get<number>('resetToken.maxRequestsPerEmail') || 3;
    this.maxResetRequestsPerIp = this.configService.get<number>('resetToken.maxRequestsPerIp') || 10;
  }

  // P1UC01: Register new account with atomic transaction
  async register(
    request: RegisterRequestDto,
  ): Promise<RegisterSuccessResponseDto | RegisterErrorResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Check if email already exists
      const emailCheckResponse = await this.userGrpcClient.checkEmailExists({
        email: request.email,
        correlationId: request.correlationId,
      });

      if (!emailCheckResponse.success) {
        throw new Error(emailCheckResponse.error || 'Failed to check email existence');
      }

      if ('exists' in emailCheckResponse && emailCheckResponse.exists) {
        await this.eventPublisher.publishUserRegistrationFailed({
          email: request.email,
          companyName: request.companyName,
          errorCode: 'EMAIL_ALREADY_EXISTS',
          errorMessage: 'This email address is already registered',
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });

        return {
          success: false,
          error: 'This email address is already registered. Please use a different email or log in to your existing account.',
          code: 'EMAIL_ALREADY_EXISTS',
        };
      }

      // Step 2: Hash password with bcrypt
      const passwordHash = await bcrypt.hash(request.password, this.bcryptRounds);

      // Step 3: Create tenant (company)
      const tenantResponse = await this.tenantGrpcClient.createTenant({
        companyName: request.companyName,
        correlationId: request.correlationId,
      });

      if (!tenantResponse.success) {
        throw new Error(tenantResponse.error || 'Failed to create tenant');
      }

      if (!('tenantId' in tenantResponse)) {
        throw new Error('Tenant creation did not return tenantId');
      }

      const tenantId = tenantResponse.tenantId;

      // Step 4: Create user
      const userResponse = await this.userGrpcClient.createUser({
        fullName: request.fullName,
        email: request.email,
        passwordHash,
        phoneNumber: request.phoneNumber,
        tenantId,
        languagePreference: request.languagePreference,
        correlationId: request.correlationId,
      });

      if (!userResponse.success) {
        throw new Error(userResponse.error || 'Failed to create user');
      }

      if (!('userId' in userResponse)) {
        throw new Error('User creation did not return userId');
      }

      const userId = userResponse.userId;

      // Step 5: Assign Company Owner role
      const roleResponse = await this.userGrpcClient.assignRole({
        userId,
        roleCode: 'COMPANY_OWNER',
        tenantId,
        correlationId: request.correlationId,
      });

      if (!roleResponse.success) {
        throw new Error(roleResponse.error || 'Failed to assign role');
      }

      // Step 6: Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(verificationToken, this.bcryptRounds);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.verificationTokenExpirationHours);

      // Step 7: Save verification token
      const tokenEntity = this.verificationTokenRepository.create({
        userId,
        tokenHash,
        expiresAt,
        isUsed: false,
      });

      await queryRunner.manager.save(tokenEntity);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Step 8: Publish user.registered event
      await this.eventPublisher.publishUserRegistered({
        userId,
        email: request.email,
        fullName: request.fullName,
        tenantId,
        companyName: request.companyName,
        languagePreference: request.languagePreference,
        verificationToken,
        verificationTokenExpiresAt: expiresAt.toISOString(),
        phoneNumber: request.phoneNumber,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        userId,
        email: request.email,
        fullName: request.fullName,
        tenantId,
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();

      console.error('[AuthService] Registration failed:', error);

      await this.eventPublisher.publishUserRegistrationFailed({
        email: request.email,
        companyName: request.companyName,
        errorCode: 'TRANSACTION_FAILED',
        errorMessage: error.message || 'Registration could not be completed',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      return {
        success: false,
        error: 'Registration could not be completed. Please try again.',
        code: 'TRANSACTION_FAILED',
        details: { message: error.message },
      };
    } finally {
      await queryRunner.release();
    }
  }

  // P1UC02: Resend verification email
  async resendVerification(
    request: any,
  ): Promise<any> {
    try {
      // Step 1: Find user by email via user-service
      const userResponse = await this.userGrpcClient.findByEmail({
        email: request.email,
        correlationId: request.correlationId,
      });

      if (!userResponse.success) {
        return {
          success: false,
          error: 'Unable to process request',
          code: 'INTERNAL_ERROR',
        };
      }

      // Step 2: If user doesn't exist, return success (prevent email enumeration)
      if (!userResponse.user) {
        return { success: true };
      }

      // Step 3: If account is already activated, return informational response
      if (userResponse.user.isActive) {
        return {
          success: true,
          alreadyActivated: true,
        };
      }

      // Step 4: Invalidate existing tokens
      await this.verificationTokenRepository.update(
        { userId: userResponse.user.userId, isUsed: false },
        { isUsed: true },
      );

      // Step 5: Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(verificationToken, this.bcryptRounds);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.verificationTokenExpirationHours);

      // Step 6: Store new token
      const newToken = this.verificationTokenRepository.create({
        userId: userResponse.user.userId,
        tokenHash,
        expiresAt,
        isUsed: false,
      });
      await this.verificationTokenRepository.save(newToken);

      // Step 7: Publish verification.email.resent event
      await this.eventPublisher.publishVerificationEmailResent({
        userId: userResponse.user.userId,
        email: userResponse.user.email,
        fullName: userResponse.user.fullName || '',
        languagePreference: userResponse.user.languagePreference,
        verificationToken,
        verificationTokenExpiresAt: expiresAt.toISOString(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      return { success: true };
    } catch (error) {
      console.error('[AuthService] Resend verification failed:', error);
      return {
        success: false,
        error: 'Unable to process request',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  // P1UC03: Verify email address
  async verifyEmail(
    request: VerifyEmailRequestDto,
  ): Promise<VerifyEmailSuccessResponseDto | VerifyEmailErrorResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Validate token format
      if (!request.token || request.token.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid verification link',
          code: 'INVALID_TOKEN_FORMAT',
        };
      }

      // Step 2: Find all non-used verification tokens
      const tokens = await this.verificationTokenRepository.find({
        where: { isUsed: false },
      });

      if (tokens.length === 0) {
        return {
          success: false,
          error: 'Verification token not found',
          code: 'TOKEN_NOT_FOUND',
        };
      }

      // Step 3: Compare token hash with all tokens to find a match
      let matchedToken: VerificationToken | null = null;
      for (const token of tokens) {
        const isMatch = await bcrypt.compare(request.token, token.tokenHash);
        if (isMatch) {
          matchedToken = token;
          break;
        }
      }

      if (!matchedToken) {
        return {
          success: false,
          error: 'Verification token not found',
          code: 'TOKEN_NOT_FOUND',
        };
      }

      // Step 4: Check if token is expired
      if (new Date() > matchedToken.expiresAt) {
        return {
          success: false,
          error: 'Verification token has expired',
          code: 'TOKEN_EXPIRED',
        };
      }

      // Step 5: Get user information from user-service
      const userResponse = await this.userGrpcClient.findById({
        userId: matchedToken.userId,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        return {
          success: false,
          error: 'Verification failed',
          code: 'VERIFICATION_FAILED',
        };
      }

      const user = userResponse.user;

      // Step 6: Check if user is already activated
      if (user.isActive) {
        // Delete the verification token as it's no longer needed
        await queryRunner.manager.delete(VerificationToken, { id: matchedToken.id });
        await queryRunner.commitTransaction();

        return {
          success: true,
          userId: user.userId,
          email: user.email,
          languagePreference: user.languagePreference,
          alreadyActivated: true,
        };
      }

      // Step 7: Activate user account via user-service
      const activateResponse = await this.userGrpcClient.activateUser({
        userId: user.userId,
        correlationId: request.correlationId,
      });

      if (!activateResponse.success) {
        throw new Error('Failed to activate user account');
      }

      // Step 8: Delete the verification token
      await queryRunner.manager.delete(VerificationToken, { id: matchedToken.id });

      // Commit transaction
      await queryRunner.commitTransaction();

      // Step 9: Publish email.verified event
      await this.eventPublisher.publishEmailVerified({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        languagePreference: user.languagePreference,
        emailVerifiedAt: activateResponse.emailVerifiedAt,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        userId: user.userId,
        email: user.email,
        languagePreference: user.languagePreference,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('[AuthService] Email verification failed:', error);

      return {
        success: false,
        error: 'Verification failed',
        code: 'VERIFICATION_FAILED',
      };
    } finally {
      await queryRunner.release();
    }
  }

  // P2UC01: User login with rate limiting and session management
  async login(
    request: LoginRequestDto,
  ): Promise<LoginSuccessResponseDto | LoginErrorResponseDto> {
    try {
      const normalizedEmail = request.email.toLowerCase().trim();

      // Step 1: Check rate limiting
      const rateLimitWindowSeconds = this.rateLimitWindowMinutes * 60;
      const failedAttempts = await this.redisService.getFailedAttempts(normalizedEmail);

      if (failedAttempts >= this.maxFailedAttempts) {
        const retryAfter = await this.redisService.getRateLimitTtl(normalizedEmail);
        return {
          success: false,
          error: 'Too many failed login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter > 0 ? retryAfter : rateLimitWindowSeconds,
        };
      }

      // Step 2: Find user by email via user-service
      const userResponse = await this.userGrpcClient.findByEmail({
        email: normalizedEmail,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        await this.redisService.incrementFailedAttempts(normalizedEmail, rateLimitWindowSeconds);
        const attemptsRemaining = this.maxFailedAttempts - failedAttempts - 1;

        await this.eventPublisher.publishUserLoginFailed({
          email: normalizedEmail,
          failureReason: 'INVALID_CREDENTIALS',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });

        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
        };
      }

      const user = userResponse.user;

      // Step 3: Verify email is verified
      if (!user.emailVerifiedAt) {
        await this.redisService.incrementFailedAttempts(normalizedEmail, rateLimitWindowSeconds);
        const attemptsRemaining = this.maxFailedAttempts - failedAttempts - 1;

        await this.eventPublisher.publishUserLoginFailed({
          email: normalizedEmail,
          userId: user.userId,
          tenantId: user.tenantId,
          failureReason: 'EMAIL_NOT_VERIFIED',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });

        return {
          success: false,
          error: 'Email address not verified. Please check your email for verification link.',
          code: 'EMAIL_NOT_VERIFIED',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
        };
      }

      // Step 4: Verify account is active
      if (!user.isActive) {
        await this.redisService.incrementFailedAttempts(normalizedEmail, rateLimitWindowSeconds);
        const attemptsRemaining = this.maxFailedAttempts - failedAttempts - 1;

        await this.eventPublisher.publishUserLoginFailed({
          email: normalizedEmail,
          userId: user.userId,
          tenantId: user.tenantId,
          failureReason: 'ACCOUNT_INACTIVE',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });

        return {
          success: false,
          error: 'Account is inactive. Please contact support.',
          code: 'ACCOUNT_INACTIVE',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
        };
      }

      // Step 5: Verify password hash exists
      if (!user.passwordHash) {
        return {
          success: false,
          error: 'Login failed',
          code: 'LOGIN_FAILED',
        };
      }

      // Step 6: Compare password
      const passwordMatch = await bcrypt.compare(request.password, user.passwordHash);
      if (!passwordMatch) {
        await this.redisService.incrementFailedAttempts(normalizedEmail, rateLimitWindowSeconds);
        const attemptsRemaining = this.maxFailedAttempts - failedAttempts - 1;

        await this.eventPublisher.publishUserLoginFailed({
          email: normalizedEmail,
          userId: user.userId,
          tenantId: user.tenantId,
          failureReason: 'INVALID_CREDENTIALS',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });

        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : 0,
        };
      }

      // Step 7: Reset failed login attempts
      await this.redisService.resetFailedAttempts(normalizedEmail);

      // P4UC06: Step 7.5: Check if first login (password not yet changed)
      const isFirstLogin = !user.passwordChangedAt;

      if (isFirstLogin) {
        // Create temporary session (15 min expiry) for password change
        const sessionToken = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(sessionToken).digest('hex');
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMinutes(expiresAt.getMinutes() + this.sessionTempTtlMinutes);
        const ttlSeconds = this.sessionTempTtlMinutes * 60;

        const session = this.sessionRepository.create({
          userId: user.userId,
          tokenHash,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          expiresAt,
          lastActivityAt: now,
          isActive: true,
          isTemporary: true,
        });

        await this.sessionRepository.save(session);
        await this.redisService.setSession(
          tokenHash,
          JSON.stringify({
            sessionId: session.id,
            userId: user.userId,
            email: user.email,
            tenantId: user.tenantId,
            isTemporary: true,
          }),
          ttlSeconds,
        );

        // Return with requirePasswordChange flag
        return {
          success: true,
          userId: user.userId,
          email: user.email,
          fullName: user.fullName,
          tenantId: user.tenantId,
          languagePreference: user.languagePreference,
          sessionToken,
          sessionExpiry: Math.floor(expiresAt.getTime() / 1000),
          requirePasswordChange: true,
        };
      }

      // Step 8: Generate session token
      const sessionToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

      // Step 9: Calculate session expiry
      const now = new Date();
      const expiresAt = new Date(now);
      const ttlSeconds = request.rememberMe
        ? this.sessionLongTtlDays * 24 * 60 * 60
        : this.sessionShortTtlHours * 60 * 60;

      if (request.rememberMe) {
        expiresAt.setDate(expiresAt.getDate() + this.sessionLongTtlDays);
      } else {
        expiresAt.setHours(expiresAt.getHours() + this.sessionShortTtlHours);
      }

      // Step 10: Create session record
      const session = this.sessionRepository.create({
        userId: user.userId,
        tokenHash,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        expiresAt,
        lastActivityAt: now,
        isActive: true,
      });

      // Step 11: Save session to database and Redis
      await this.sessionRepository.save(session);
      await this.redisService.setSession(
        tokenHash,
        JSON.stringify({
          sessionId: session.id,
          userId: user.userId,
          email: user.email,
          tenantId: user.tenantId,
        }),
        ttlSeconds,
      );

      // Step 12: Publish user.login.success event
      await this.eventPublisher.publishUserLoginSuccess({
        userId: user.userId,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: session.id,
        rememberMe: request.rememberMe,
        sessionExpiresAt: expiresAt.toISOString(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      // Step 13: Return success response
      return {
        success: true,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        languagePreference: user.languagePreference,
        sessionToken,
        sessionExpiry: Math.floor(expiresAt.getTime() / 1000),
      };
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      return {
        success: false,
        error: 'Login failed',
        code: 'LOGIN_FAILED',
      };
    }
  }

  // P2UC02: Request password reset
  async requestPasswordReset(
    request: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetSuccessResponseDto | RequestPasswordResetErrorResponseDto> {
    try {
      const email = request.email.trim().toLowerCase();

      // Rate limiting check
      const emailResetKey = `password_reset:email:${email}`;
      const ipResetKey = `password_reset:ip:${request.ipAddress}`;
      const emailResetCount = await this.redisService.get(emailResetKey);
      const ipResetCount = await this.redisService.get(ipResetKey);

      if (emailResetCount && parseInt(emailResetCount) >= this.maxResetRequestsPerEmail) {
        return {
          success: false,
          error: 'Too many password reset requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        };
      }

      if (ipResetCount && parseInt(ipResetCount) >= this.maxResetRequestsPerIp) {
        return {
          success: false,
          error: 'Too many password reset requests from this IP. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        };
      }

      // Find user by email
      const userResponse = await this.userGrpcClient.findByEmail({
        email,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        // Generic response for security
        await this.eventPublisher.publishPasswordResetFailed({
          email,
          failureReason: 'User not found',
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });
        return { success: true };
      }

      const user = userResponse.user;

      // Verify email is verified and account is active
      if (!user.emailVerifiedAt || !user.isActive) {
        await this.eventPublisher.publishPasswordResetFailed({
          email,
          userId: user.userId,
          tenantId: user.tenantId,
          failureReason: 'Account not active or email not verified',
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });
        return { success: true };
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(resetToken).digest('hex');

      // Invalidate existing unused tokens
      await this.passwordResetTokenRepository.update(
        {
          userId: user.userId,
          isUsed: false,
          isInvalidated: false,
        },
        {
          isInvalidated: true,
        },
      );

      // Create new reset token
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.resetTokenExpirationHours);

      const resetTokenEntity = this.passwordResetTokenRepository.create({
        userId: user.userId,
        tokenHash,
        expiresAt,
        isUsed: false,
        isInvalidated: false,
      });

      await this.passwordResetTokenRepository.save(resetTokenEntity);

      // Increment rate limit counters
      await this.redisService.set(emailResetKey, (parseInt(emailResetCount || '0') + 1).toString(), 3600);
      await this.redisService.set(ipResetKey, (parseInt(ipResetCount || '0') + 1).toString(), 3600);

      // Publish event with unhashed token
      await this.eventPublisher.publishPasswordResetRequested({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        languagePreference: user.languagePreference,
        resetToken,
        resetTokenExpiresAt: expiresAt.toISOString(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      return { success: true };
    } catch (error) {
      console.error('[AuthService] Request password reset failed:', error);
      return {
        success: false,
        error: 'Failed to process password reset request',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  // P2UC02: Validate reset token
  async validateResetToken(
    request: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenSuccessResponseDto | ValidateResetTokenErrorResponseDto> {
    try {
      // Validate token format
      if (!request.token || request.token.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid token format',
          code: 'INVALID_TOKEN_FORMAT',
        };
      }

      const tokenHash = createHash('sha256').update(request.token).digest('hex');

      // Find token
      const resetToken = await this.passwordResetTokenRepository.findOne({
        where: { tokenHash },
      });

      if (!resetToken) {
        return {
          success: false,
          error: 'Token not found',
          code: 'TOKEN_NOT_FOUND',
        };
      }

      // Check expiration
      if (new Date() > resetToken.expiresAt) {
        return {
          success: false,
          error: 'Reset token has expired',
          code: 'TOKEN_EXPIRED',
        };
      }

      // Check if used
      if (resetToken.isUsed) {
        return {
          success: false,
          error: 'Reset token has already been used',
          code: 'TOKEN_ALREADY_USED',
        };
      }

      // Check if invalidated
      if (resetToken.isInvalidated) {
        return {
          success: false,
          error: 'Reset token has been invalidated',
          code: 'TOKEN_INVALIDATED',
        };
      }

      // Get user info
      const userResponse = await this.userGrpcClient.findById({
        userId: resetToken.userId,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      const user = userResponse.user;

      // Verify account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is not active',
          code: 'ACCOUNT_INACTIVE',
        };
      }

      // Publish validation event
      await this.eventPublisher.publishPasswordResetTokenValidated({
        userId: user.userId,
        email: user.email,
        tenantId: user.tenantId,
        tokenId: tokenHash,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        valid: true,
      };
    } catch (error) {
      console.error('[AuthService] Validate reset token failed:', error);
      return {
        success: false,
        error: 'Failed to validate reset token',
        code: 'VALIDATION_FAILED',
      };
    }
  }

  // P2UC02: Reset password
  async resetPassword(
    request: ResetPasswordRequestDto,
  ): Promise<ResetPasswordSuccessResponseDto | ResetPasswordErrorResponseDto> {
    try {
      // Validate token format
      if (!request.token || request.token.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid token format',
          code: 'INVALID_TOKEN_FORMAT',
        };
      }

      const tokenHash = createHash('sha256').update(request.token).digest('hex');

      // Find token
      const resetToken = await this.passwordResetTokenRepository.findOne({
        where: { tokenHash },
      });

      if (!resetToken) {
        return {
          success: false,
          error: 'Token not found',
          code: 'TOKEN_NOT_FOUND',
        };
      }

      // Check expiration
      if (new Date() > resetToken.expiresAt) {
        return {
          success: false,
          error: 'Reset token has expired',
          code: 'TOKEN_EXPIRED',
        };
      }

      // Check if used
      if (resetToken.isUsed) {
        return {
          success: false,
          error: 'Reset token has already been used',
          code: 'TOKEN_ALREADY_USED',
        };
      }

      // Check if invalidated
      if (resetToken.isInvalidated) {
        return {
          success: false,
          error: 'Reset token has been invalidated',
          code: 'TOKEN_INVALIDATED',
        };
      }

      // Get user info
      const userResponse = await this.userGrpcClient.findById({
        userId: resetToken.userId,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      const user = userResponse.user;

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is not active',
          code: 'ACCOUNT_INACTIVE',
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(request.newPassword, this.bcryptRounds);
      const passwordChangedAt = new Date().toISOString();

      // Update password in user-service
      const updatePasswordResponse = await this.userGrpcClient.updatePassword({
        userId: user.userId,
        newPasswordHash,
        passwordChangedAt,
        correlationId: request.correlationId,
      });

      if (!updatePasswordResponse.success) {
        return {
          success: false,
          error: 'Failed to update password',
          code: 'PASSWORD_UPDATE_FAILED',
        };
      }

      // Mark token as used
      resetToken.isUsed = true;
      resetToken.usedAt = new Date();
      await this.passwordResetTokenRepository.save(resetToken);

      // Invalidate all active sessions for this user
      const result = await this.sessionRepository.update(
        { userId: user.userId, isActive: true },
        {
          isActive: false,
          invalidatedAt: new Date(),
          invalidationReason: 'password_reset',
        },
      );

      const sessionsInvalidated = result.affected || 0;

      // Delete Redis sessions
      const activeSessions = await this.sessionRepository.find({
        where: { userId: user.userId },
      });

      for (const session of activeSessions) {
        await this.redisService.deleteSession(session.tokenHash);
      }

      // Reset failed login attempts
      await this.redisService.resetFailedAttempts(user.email);

      // Publish success event
      await this.eventPublisher.publishPasswordResetCompleted({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        languagePreference: user.languagePreference,
        passwordChangedAt,
        sessionsInvalidated,
        ipAddress: '',
        userAgent: '',
        correlationId: request.correlationId,
      });

      return { success: true };
    } catch (error) {
      console.error('[AuthService] Reset password failed:', error);
      return {
        success: false,
        error: 'Failed to reset password',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  // P3UC01: Validate session token
  async validateSession(
    token: string,
    correlationId: string,
  ): Promise<{ success: true; userId: string; tenantId: string; sessionId: string; createdAt: string } | { success: false; error: string; code: string }> {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const session = await this.sessionRepository.findOne({
        where: { tokenHash, isActive: true },
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        };
      }

      if (new Date() > session.expiresAt) {
        session.isActive = false;
        session.invalidatedAt = new Date();
        session.invalidationReason = 'EXPIRED';
        await this.sessionRepository.save(session);

        // Fetch user details for audit event
        const userResponse = await this.userGrpcClient.findById({
          userId: session.userId,
          correlationId,
        });

        if (userResponse.success && userResponse.user) {
          const sessionDuration = Math.floor((new Date().getTime() - session.createdAt.getTime()) / 1000);

          // Publish session.expired event for audit logging
          try {
            await this.eventPublisher.publishSessionExpired({
              userId: session.userId,
              email: userResponse.user.email,
              tenantId: userResponse.user.tenantId,
              sessionId: session.id,
              expirationReason: 'TOKEN_EXPIRED',
              sessionDuration,
              lastActivityAt: session.lastActivityAt.toISOString(),
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
              correlationId,
            });
          } catch (error) {
            // Non-critical - log but don't fail request
            console.error('[AuthService] Failed to publish session.expired event:', error);
          }
        }

        return {
          success: false,
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        };
      }

      // Fetch user to get tenantId and other details
      const userResponse = await this.userGrpcClient.findById({
        userId: session.userId,
        correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      // Publish dashboard.accessed event for audit logging
      try {
        await this.eventPublisher.publishDashboardAccessed({
          userId: session.userId,
          tenantId: userResponse.user.tenantId,
          sessionId: session.id,
          email: userResponse.user.email,
          fullName: userResponse.user.fullName,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          correlationId,
        });
      } catch (error) {
        // Non-critical - log but don't fail request
        console.error('[AuthService] Failed to publish dashboard.accessed event:', error);
      }

      return {
        success: true,
        userId: session.userId,
        tenantId: userResponse.user.tenantId,
        sessionId: session.id,
        createdAt: session.createdAt.toISOString(),
      };
    } catch (error) {
      console.error('[AuthService] Session validation failed:', error);
      return {
        success: false,
        error: 'Session validation failed',
        code: 'SESSION_VALIDATION_FAILED',
      };
    }
  }

  // P3UC01: Update last login timestamp
  async updateLastLogin(
    sessionId: string,
    correlationId: string,
  ): Promise<{ success: true } | { success: false; error: string; code?: string }> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        };
      }

      session.lastActivityAt = new Date();
      await this.sessionRepository.save(session);

      return { success: true };
    } catch (error) {
      console.error('[AuthService] Update last login failed:', error);
      return {
        success: false,
        error: 'Failed to update last login',
        code: 'UPDATE_LAST_LOGIN_FAILED',
      };
    }
  }

  // P3UC04: Logout user and invalidate session
  async logout(
    request: LogoutRequestDto,
  ): Promise<LogoutSuccessResponseDto | LogoutErrorResponseDto> {
    try {
      // Hash the session token to find the session
      const tokenHash = createHash('sha256').update(request.sessionToken).digest('hex');

      const session = await this.sessionRepository.findOne({
        where: { tokenHash, isActive: true },
      });

      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        };
      }

      // Calculate session duration (seconds from creation to logout)
      const sessionDuration = Math.floor((new Date().getTime() - session.createdAt.getTime()) / 1000);

      // Fetch user details for audit event
      const userResponse = await this.userGrpcClient.findById({
        userId: session.userId,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      // Invalidate the session
      session.isActive = false;
      session.invalidatedAt = new Date();
      session.invalidationReason = 'LOGOUT';
      await this.sessionRepository.save(session);

      // Publish user.logout.success event for audit logging
      try {
        await this.eventPublisher.publishUserLogoutSuccess({
          userId: session.userId,
          email: userResponse.user.email,
          tenantId: userResponse.user.tenantId,
          sessionId: session.id,
          invalidationReason: 'LOGOUT',
          sessionDuration,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          correlationId: request.correlationId,
        });
      } catch (error) {
        // Non-critical - log but don't fail logout
        console.error('[AuthService] Failed to publish user.logout.success event:', error);
      }

      return {
        success: true,
        userId: session.userId,
        email: userResponse.user.email,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      return {
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_FAILED',
      };
    }
  }

  // P4UC05: Invalidate all user sessions (for user deactivation)
  async invalidateUserSessions(
    request: InvalidateUserSessionsRequestDto,
  ): Promise<InvalidateUserSessionsSuccessResponseDto | InvalidateUserSessionsErrorResponseDto> {
    try {
      // Find all active sessions for the user
      const activeSessions = await this.sessionRepository.find({
        where: {
          userId: request.userId,
          isActive: true,
        },
      });

      if (activeSessions.length === 0) {
        return {
          success: true,
          userId: request.userId,
          sessionsInvalidated: 0,
          cacheCleared: true,
        };
      }

      // Mark all sessions as inactive in database
      const now = new Date();
      await this.sessionRepository
        .createQueryBuilder()
        .update(Session)
        .set({
          isActive: false,
          invalidatedAt: now,
          invalidationReason: request.reason,
        })
        .where('user_id = :userId', { userId: request.userId })
        .andWhere('is_active = :isActive', { isActive: true })
        .execute();

      // Clear sessions from Redis cache
      let cacheCleared = true;
      try {
        for (const session of activeSessions) {
          await this.redisService.deleteSession(session.tokenHash);
        }
      } catch (cacheError) {
        console.error('[AuthService] Failed to clear Redis cache for sessions:', cacheError);
        cacheCleared = false;
      }

      return {
        success: true,
        userId: request.userId,
        sessionsInvalidated: activeSessions.length,
        cacheCleared,
      };
    } catch (error) {
      console.error('[AuthService] Failed to invalidate user sessions:', error);
      return {
        success: false,
        error: 'Failed to invalidate user sessions',
        code: 'INVALIDATION_FAILED',
      };
    }
  }

  // P4UC06: Change password on first login
  async changePasswordFirstLogin(
    request: ChangePasswordFirstLoginRequestDto,
  ): Promise<ChangePasswordFirstLoginSuccessResponseDto | ChangePasswordFirstLoginErrorResponseDto> {
    try {
      const tokenHash = createHash('sha256').update(request.tempSessionToken).digest('hex');

      // Step 1: Validate temporary session token
      const session = await this.sessionRepository.findOne({
        where: {
          tokenHash,
          isActive: true,
          isTemporary: true,
        },
      });

      if (!session) {
        return {
          success: false,
          error: 'Invalid or expired temporary session',
          code: 'TEMP_SESSION_INVALID',
        };
      }

      // Step 2: Check session expiration
      if (new Date() > session.expiresAt) {
        return {
          success: false,
          error: 'Temporary session has expired. Please log in again.',
          code: 'TEMP_SESSION_EXPIRED',
        };
      }

      // Step 3: Get user details
      const userResponse = await this.userGrpcClient.findById({
        userId: session.userId,
        correlationId: request.correlationId,
      });

      if (!userResponse.success || !userResponse.user) {
        return {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        };
      }

      const user = userResponse.user;

      // Step 4: Check if account is active
      if (!user.isActive || user.deactivatedAt) {
        return {
          success: false,
          error: 'Your account has been deactivated. Please contact your administrator.',
          code: 'ACCOUNT_DEACTIVATED',
        };
      }

      // Step 5: Check if password was already changed
      if (user.passwordChangedAt) {
        return {
          success: false,
          error: 'Password has already been changed. Please log in normally.',
          code: 'PASSWORD_ALREADY_CHANGED',
        };
      }

      // Step 6: Validate password fields match
      if (request.newPassword !== request.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
          code: 'PASSWORDS_DO_NOT_MATCH',
          details: [
            {
              field: 'confirmPassword',
              message: 'Passwords do not match',
              code: 'PASSWORDS_DO_NOT_MATCH',
            },
          ],
        };
      }

      // Step 7: Validate password policy
      const passwordValidation = this.validatePasswordPolicy(request.newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: 'Password does not meet requirements',
          code: 'PASSWORD_POLICY_VIOLATION',
          details: passwordValidation.errors,
        };
      }

      // Step 8: Check password is different from current (temporary) password
      const userWithPasswordResponse = await this.userGrpcClient.findByEmail({
        email: user.email,
        correlationId: request.correlationId,
      });

      if (userWithPasswordResponse.success && userWithPasswordResponse.user?.passwordHash) {
        const isSamePassword = await bcrypt.compare(request.newPassword, userWithPasswordResponse.user.passwordHash);
        if (isSamePassword) {
          return {
            success: false,
            error: 'New password must be different from your temporary password',
            code: 'PASSWORD_REUSE_NOT_ALLOWED',
            details: [
              {
                field: 'newPassword',
                message: 'New password must be different from your temporary password',
                code: 'PASSWORD_REUSE_NOT_ALLOWED',
              },
            ],
          };
        }
      }

      // Step 9: Hash new password
      const newPasswordHash = await bcrypt.hash(request.newPassword, this.bcryptRounds);
      const passwordChangedAt = new Date().toISOString();

      // Step 10: Update password in user-service
      const updatePasswordResponse = await this.userGrpcClient.updatePassword({
        userId: user.userId,
        newPasswordHash,
        passwordChangedAt,
        correlationId: request.correlationId,
      });

      if (!updatePasswordResponse.success) {
        return {
          success: false,
          error: 'Failed to update password',
          code: 'PASSWORD_UPDATE_FAILED',
        };
      }

      // Step 11: Invalidate temporary session
      session.isActive = false;
      session.invalidatedAt = new Date();
      session.invalidationReason = 'TEMP_SESSION_COMPLETED';
      await this.sessionRepository.save(session);

      // Clear from Redis
      await this.redisService.deleteSession(tokenHash);

      // Step 12: Create new full session
      const newSessionToken = randomBytes(32).toString('hex');
      const newTokenHash = createHash('sha256').update(newSessionToken).digest('hex');
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setHours(expiresAt.getHours() + this.sessionShortTtlHours);
      const ttlSeconds = this.sessionShortTtlHours * 60 * 60;

      const newSession = this.sessionRepository.create({
        userId: user.userId,
        tokenHash: newTokenHash,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        expiresAt,
        lastActivityAt: now,
        isActive: true,
        isTemporary: false,
      });

      await this.sessionRepository.save(newSession);
      await this.redisService.setSession(
        newTokenHash,
        JSON.stringify({
          sessionId: newSession.id,
          userId: user.userId,
          email: user.email,
          tenantId: user.tenantId,
        }),
        ttlSeconds,
      );

      // Step 13: Publish password.changed.first.login event
      await this.eventPublisher.publishPasswordChangedFirstLogin({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        passwordChangedAt,
        sessionId: newSession.id,
        sessionExpiresAt: expiresAt.toISOString(),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      // Step 14: Return success response
      return {
        success: true,
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        tenantId: user.tenantId,
        languagePreference: user.languagePreference,
        sessionToken: newSessionToken,
        sessionExpiry: Math.floor(expiresAt.getTime() / 1000),
      };
    } catch (error) {
      console.error('[AuthService] Change password first login failed:', error);
      return {
        success: false,
        error: 'Failed to change password',
        code: 'INTERNAL_ERROR',
      };
    }
  }

  // Password policy validation helper
  private validatePasswordPolicy(password: string): {
    valid: boolean;
    errors: Array<{ field: string; message: string; code: string }>;
  } {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (password.length < 8) {
      errors.push({
        field: 'newPassword',
        message: 'Password must be at least 8 characters long',
        code: 'PASSWORD_TOO_SHORT',
      });
    }

    if (!/[A-Z]/.test(password)) {
      errors.push({
        field: 'newPassword',
        message: 'Password must include at least one uppercase letter',
        code: 'PASSWORD_MISSING_UPPERCASE',
      });
    }

    if (!/[a-z]/.test(password)) {
      errors.push({
        field: 'newPassword',
        message: 'Password must include at least one lowercase letter',
        code: 'PASSWORD_MISSING_LOWERCASE',
      });
    }

    if (!/[0-9]/.test(password)) {
      errors.push({
        field: 'newPassword',
        message: 'Password must include at least one number',
        code: 'PASSWORD_MISSING_NUMBER',
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({
        field: 'newPassword',
        message: 'Password must include at least one special character',
        code: 'PASSWORD_MISSING_SPECIAL_CHAR',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
