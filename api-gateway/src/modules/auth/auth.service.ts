import { Injectable, BadRequestException, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterRequestDto } from './dto/register-request.dto';
import { generateCorrelationId } from '@/common/utils/request.util';

interface RegisterResponse {
  success: boolean;
  code?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  tenantId?: string;
}

interface IAuthServiceGrpc {
  register(data: any): any;
  resendVerification(data: any): any;
  verifyEmail(data: any): any;
  login(data: any): any;
  requestPasswordReset(data: any): any;
  validateResetToken(data: any): any;
  resetPassword(data: any): any;
  logout(data: any): any;
  changePasswordFirstLogin(data: any): any;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private authServiceGrpc: IAuthServiceGrpc;

  constructor(
    @Inject('AUTH_SERVICE') private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.authServiceGrpc = this.client.getService<IAuthServiceGrpc>('AuthService');
  }

  async register(
    registerDto: RegisterRequestDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Validate password confirmation
    if (registerDto.password !== registerDto.passwordConfirmation) {
      throw new BadRequestException({
        message: 'error.passwordMismatch',
        code: 'PASSWORD_MISMATCH',
      });
    }

    // Generate correlation ID for request tracing
    const correlationId = generateCorrelationId();

    this.logger.log(
      `Registration attempt - Email: ${registerDto.email}, IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      // Call auth-service via gRPC
      const response = (await firstValueFrom(
        this.authServiceGrpc.register({
          fullName: registerDto.fullName,
          companyName: registerDto.companyName,
          email: registerDto.email,
          password: registerDto.password,
          phoneNumber: registerDto.phoneNumber,
          languagePreference: registerDto.languagePreference,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as RegisterResponse;

      if (!response.success) {
        // Handle specific error codes from auth-service
        const errorCodeMap: Record<string, { message: string; code: string }> = {
          EMAIL_ALREADY_EXISTS: {
            message: 'error.emailExists',
            code: 'EMAIL_ALREADY_EXISTS',
          },
          VALIDATION_ERROR: {
            message: 'error.validationFailed',
            code: 'VALIDATION_ERROR',
          },
          TRANSACTION_FAILED: {
            message: 'error.registrationFailed',
            code: 'REGISTRATION_FAILED',
          },
          INTERNAL_ERROR: {
            message: 'error.registrationFailed',
            code: 'REGISTRATION_FAILED',
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.registrationFailed',
          code: 'REGISTRATION_FAILED',
        };

        this.logger.error(
          `Registration failed - Email: ${registerDto.email}, Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        throw new BadRequestException(errorInfo);
      }

      this.logger.log(
        `Registration successful - UserId: ${response.userId}, Email: ${response.email}, CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        message: 'register.success',
        data: {
          userId: response.userId,
          email: response.email,
          fullName: response.fullName,
          tenantId: response.tenantId,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Registration error - Email: ${registerDto.email}, CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.registrationFailed',
        code: 'REGISTRATION_FAILED',
      });
    }
  }

  async resendVerification(resendDto: any, ipAddress: string, userAgent: string): Promise<any> {
    const correlationId = generateCorrelationId();

    this.logger.log(
      `ResendVerification attempt - Email: ${resendDto.email}, IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.resendVerification({
          email: resendDto.email,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<string, { message: string; code: string }> = {
          VALIDATION_ERROR: {
            message: 'error.validationFailed',
            code: 'VALIDATION_ERROR',
          },
          RATE_LIMIT_EXCEEDED: {
            message: 'error.rateLimitExceeded',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          INTERNAL_ERROR: {
            message: 'error.resendVerificationFailed',
            code: 'RESEND_VERIFICATION_FAILED',
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.resendVerificationFailed',
          code: 'RESEND_VERIFICATION_FAILED',
        };

        this.logger.error(
          `ResendVerification failed - Email: ${resendDto.email}, Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        throw new BadRequestException(errorInfo);
      }

      // Check if account is already activated
      if (response.alreadyActivated) {
        this.logger.log(
          `ResendVerification - Account already activated - Email: ${resendDto.email}, CorrelationId: ${correlationId}`,
        );

        return {
          success: true,
          message: 'resendVerification.alreadyActivated',
        };
      }

      this.logger.log(
        `ResendVerification successful - Email: ${resendDto.email}, CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        message: 'resendVerification.success',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `ResendVerification error - Email: ${resendDto.email}, CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.resendVerificationFailed',
        code: 'RESEND_VERIFICATION_FAILED',
      });
    }
  }

  async verifyEmail(token: string, ipAddress: string, userAgent: string): Promise<any> {
    const correlationId = generateCorrelationId();

    this.logger.log(
      `VerifyEmail attempt - Token: ${token.substring(0, 8)}..., IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.verifyEmail({
          token,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<
          string,
          { message: string; code: string; status?: number; resendUrl?: string }
        > = {
          INVALID_TOKEN_FORMAT: {
            message: 'error.invalidVerificationLink',
            code: 'INVALID_TOKEN_FORMAT',
            status: 400,
            resendUrl: '/resend-verification',
          },
          TOKEN_NOT_FOUND: {
            message: 'error.tokenNotFound',
            code: 'TOKEN_NOT_FOUND',
            status: 404,
            resendUrl: '/resend-verification',
          },
          TOKEN_EXPIRED: {
            message: 'error.tokenExpired',
            code: 'TOKEN_EXPIRED',
            status: 410,
            resendUrl: '/resend-verification',
          },
          VERIFICATION_FAILED: {
            message: 'error.verificationFailed',
            code: 'VERIFICATION_FAILED',
            status: 500,
          },
          SERVICE_UNAVAILABLE: {
            message: 'error.serviceUnavailable',
            code: 'SERVICE_UNAVAILABLE',
            status: 503,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.verificationFailed',
          code: 'VERIFICATION_FAILED',
          status: 500,
        };

        this.logger.error(
          `VerifyEmail failed - Token: ${token.substring(0, 8)}..., Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        const error = new BadRequestException(errorInfo);
        (error as any).status = errorInfo.status;
        throw error;
      }

      // Check if account was already activated
      if (response.alreadyActivated) {
        this.logger.log(
          `VerifyEmail - Account already activated - UserId: ${response.userId}, CorrelationId: ${correlationId}`,
        );

        return {
          success: true,
          message: 'verifyEmail.alreadyActivated',
          redirectUrl: '/login',
          alreadyActivated: true,
        };
      }

      this.logger.log(
        `VerifyEmail successful - UserId: ${response.userId}, Email: ${response.email}, CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        message: 'verifyEmail.success',
        redirectUrl: '/login',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `VerifyEmail error - Token: ${token.substring(0, 8)}..., CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.verificationFailed',
        code: 'VERIFICATION_FAILED',
      });
    }
  }

  async login(
    loginDto: { email: string; password: string; rememberMe?: boolean },
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    const correlationId = generateCorrelationId();

    this.logger.log(
      `Login attempt - Email: ${loginDto.email}, RememberMe: ${loginDto.rememberMe || false}, IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.login({
          email: loginDto.email,
          password: loginDto.password,
          rememberMe: loginDto.rememberMe || false,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<string, { message: string; code: string; status?: number }> = {
          VALIDATION_ERROR: {
            message: 'error.validationFailed',
            code: 'VALIDATION_ERROR',
            status: 400,
          },
          INVALID_CREDENTIALS: {
            message: 'error.invalidCredentials',
            code: 'INVALID_CREDENTIALS',
            status: 401,
          },
          EMAIL_NOT_VERIFIED: {
            message: 'error.emailNotVerified',
            code: 'EMAIL_NOT_VERIFIED',
            status: 403,
          },
          ACCOUNT_INACTIVE: {
            message: 'error.accountInactive',
            code: 'ACCOUNT_INACTIVE',
            status: 403,
          },
          ACCOUNT_SUSPENDED: {
            message: 'error.accountSuspended',
            code: 'ACCOUNT_SUSPENDED',
            status: 403,
          },
          RATE_LIMIT_EXCEEDED: {
            message: 'error.rateLimitExceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            status: 429,
          },
          LOGIN_FAILED: {
            message: 'error.loginFailed',
            code: 'LOGIN_FAILED',
            status: 500,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.loginFailed',
          code: 'LOGIN_FAILED',
          status: 500,
        };

        this.logger.error(
          `Login failed - Email: ${loginDto.email}, Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        const error = new BadRequestException({
          ...errorInfo,
          attemptsRemaining: response.attemptsRemaining,
          retryAfter: response.retryAfter,
        });
        (error as any).status = errorInfo.status;
        throw error;
      }

      this.logger.log(
        `Login successful - UserId: ${response.userId}, Email: ${response.email}, CorrelationId: ${correlationId}`,
      );

      // Check if password change is required (first login)
      if (response.requirePasswordChange) {
        this.logger.log(
          `First login detected - UserId: ${response.userId}, RequirePasswordChange: true, CorrelationId: ${correlationId}`,
        );

        return {
          success: true,
          requirePasswordChange: true,
          sessionToken: response.sessionToken,
          sessionExpiry: response.sessionExpiry,
          user: {
            userId: response.userId,
            email: response.email,
            fullName: response.fullName,
            tenantId: response.tenantId,
            languagePreference: response.languagePreference,
          },
        };
      }

      return {
        success: true,
        sessionToken: response.sessionToken,
        sessionExpiry: response.sessionExpiry,
        user: {
          userId: response.userId,
          email: response.email,
          fullName: response.fullName,
          tenantId: response.tenantId,
          languagePreference: response.languagePreference,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Login error - Email: ${loginDto.email}, CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.loginFailed',
        code: 'LOGIN_FAILED',
      });
    }
  }

  async requestPasswordReset(email: string, ipAddress: string, userAgent: string): Promise<any> {
    const correlationId = generateCorrelationId();

    this.logger.log(
      `RequestPasswordReset attempt - Email: ${email}, IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.requestPasswordReset({
          email,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<string, { message: string; code: string; status?: number }> = {
          VALIDATION_ERROR: {
            message: 'error.validationFailed',
            code: 'VALIDATION_ERROR',
            status: 400,
          },
          RATE_LIMIT_EXCEEDED: {
            message: 'error.rateLimitExceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            status: 429,
          },
          INTERNAL_ERROR: {
            message: 'error.passwordResetRequestFailed',
            code: 'PASSWORD_RESET_REQUEST_FAILED',
            status: 500,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.passwordResetRequestFailed',
          code: 'PASSWORD_RESET_REQUEST_FAILED',
          status: 500,
        };

        this.logger.error(
          `RequestPasswordReset failed - Email: ${email}, Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        const error = new BadRequestException(errorInfo);
        (error as any).status = errorInfo.status;
        throw error;
      }

      this.logger.log(
        `RequestPasswordReset successful - Email: ${email}, CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        message: 'forgotPassword.success',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `RequestPasswordReset error - Email: ${email}, CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.passwordResetRequestFailed',
        code: 'PASSWORD_RESET_REQUEST_FAILED',
      });
    }
  }

  async validateResetToken(token: string): Promise<any> {
    const correlationId = generateCorrelationId();

    this.logger.log(
      `ValidateResetToken attempt - Token: ${token.substring(0, 8)}..., CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.validateResetToken({
          token,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<
          string,
          { message: string; code: string; status?: number; requestNewUrl?: string }
        > = {
          INVALID_TOKEN_FORMAT: {
            message: 'error.invalidResetLink',
            code: 'INVALID_TOKEN_FORMAT',
            status: 400,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_NOT_FOUND: {
            message: 'error.tokenNotFound',
            code: 'TOKEN_NOT_FOUND',
            status: 404,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_EXPIRED: {
            message: 'error.tokenExpired',
            code: 'TOKEN_EXPIRED',
            status: 410,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_ALREADY_USED: {
            message: 'error.tokenAlreadyUsed',
            code: 'TOKEN_ALREADY_USED',
            status: 410,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_INVALIDATED: {
            message: 'error.tokenInvalidated',
            code: 'TOKEN_INVALIDATED',
            status: 410,
            requestNewUrl: '/forgot-password',
          },
          USER_NOT_FOUND: {
            message: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
            status: 404,
            requestNewUrl: '/forgot-password',
          },
          ACCOUNT_INACTIVE: {
            message: 'error.accountInactive',
            code: 'ACCOUNT_INACTIVE',
            status: 403,
          },
          VALIDATION_FAILED: {
            message: 'error.validationFailed',
            code: 'VALIDATION_FAILED',
            status: 400,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.tokenValidationFailed',
          code: 'TOKEN_VALIDATION_FAILED',
          status: 500,
        };

        this.logger.error(
          `ValidateResetToken failed - Token: ${token.substring(0, 8)}..., Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        const error = new BadRequestException({
          ...errorInfo,
          requestNewUrl: errorInfo.requestNewUrl,
        });
        (error as any).status = errorInfo.status;
        throw error;
      }

      this.logger.log(
        `ValidateResetToken successful - Token: ${token.substring(0, 8)}..., CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        message: 'validateResetToken.success',
        data: { valid: true },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `ValidateResetToken error - Token: ${token.substring(0, 8)}..., CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.tokenValidationFailed',
        code: 'TOKEN_VALIDATION_FAILED',
      });
    }
  }

  async resetPassword(
    resetDto: { token: string; newPassword: string; confirmPassword: string },
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Validate password confirmation
    if (resetDto.newPassword !== resetDto.confirmPassword) {
      throw new BadRequestException({
        message: 'error.passwordMismatch',
        code: 'PASSWORD_MISMATCH',
      });
    }

    const correlationId = generateCorrelationId();

    this.logger.log(
      `ResetPassword attempt - Token: ${resetDto.token.substring(0, 8)}..., IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.resetPassword({
          token: resetDto.token,
          newPassword: resetDto.newPassword,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<
          string,
          { message: string; code: string; status?: number; requestNewUrl?: string }
        > = {
          VALIDATION_ERROR: {
            message: 'error.validationFailed',
            code: 'VALIDATION_ERROR',
            status: 400,
          },
          INVALID_TOKEN_FORMAT: {
            message: 'error.invalidResetLink',
            code: 'INVALID_TOKEN_FORMAT',
            status: 400,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_NOT_FOUND: {
            message: 'error.tokenNotFound',
            code: 'TOKEN_NOT_FOUND',
            status: 404,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_EXPIRED: {
            message: 'error.tokenExpired',
            code: 'TOKEN_EXPIRED',
            status: 410,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_ALREADY_USED: {
            message: 'error.tokenAlreadyUsed',
            code: 'TOKEN_ALREADY_USED',
            status: 410,
            requestNewUrl: '/forgot-password',
          },
          TOKEN_INVALIDATED: {
            message: 'error.tokenInvalidated',
            code: 'TOKEN_INVALIDATED',
            status: 410,
            requestNewUrl: '/forgot-password',
          },
          USER_NOT_FOUND: {
            message: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
            status: 404,
            requestNewUrl: '/forgot-password',
          },
          ACCOUNT_INACTIVE: {
            message: 'error.accountInactive',
            code: 'ACCOUNT_INACTIVE',
            status: 403,
          },
          WEAK_PASSWORD: {
            message: 'error.weakPassword',
            code: 'WEAK_PASSWORD',
            status: 400,
          },
          PASSWORD_UPDATE_FAILED: {
            message: 'error.resetPasswordFailed',
            code: 'PASSWORD_UPDATE_FAILED',
            status: 500,
          },
          SESSION_INVALIDATION_FAILED: {
            message: 'error.resetPasswordFailed',
            code: 'SESSION_INVALIDATION_FAILED',
            status: 500,
          },
          INTERNAL_ERROR: {
            message: 'error.resetPasswordFailed',
            code: 'RESET_PASSWORD_FAILED',
            status: 500,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.resetPasswordFailed',
          code: 'RESET_PASSWORD_FAILED',
          status: 500,
        };

        this.logger.error(
          `ResetPassword failed - Token: ${resetDto.token.substring(0, 8)}..., Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        const error = new BadRequestException({
          ...errorInfo,
          requestNewUrl: errorInfo.requestNewUrl,
        });
        (error as any).status = errorInfo.status;
        throw error;
      }

      this.logger.log(
        `ResetPassword successful - UserId: ${response.userId}, CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        message: 'resetPassword.success',
        data: {
          redirectUrl: '/login',
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `ResetPassword error - Token: ${resetDto.token.substring(0, 8)}..., CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.resetPasswordFailed',
        code: 'RESET_PASSWORD_FAILED',
      });
    }
  }

  async changePasswordFirstLogin(
    tempSessionToken: string,
    newPassword: string,
    confirmPassword: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw new BadRequestException({
        message: 'error.passwordsDoNotMatch',
        code: 'PASSWORDS_DO_NOT_MATCH',
      });
    }

    const correlationId = generateCorrelationId();

    this.logger.log(
      `ChangePasswordFirstLogin attempt - IP: ${ipAddress}, CorrelationId: ${correlationId}`,
    );

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.changePasswordFirstLogin({
          tempSessionToken,
          newPassword,
          confirmPassword,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorCodeMap: Record<string, { message: string; code: string; status?: number }> = {
          TEMP_SESSION_EXPIRED: {
            message: 'error.tempSessionExpired',
            code: 'TEMP_SESSION_EXPIRED',
            status: 401,
          },
          TEMP_SESSION_INVALID: {
            message: 'error.tempSessionInvalid',
            code: 'TEMP_SESSION_INVALID',
            status: 401,
          },
          PASSWORD_TOO_SHORT: {
            message: 'error.passwordTooShort',
            code: 'PASSWORD_TOO_SHORT',
            status: 400,
          },
          PASSWORD_MISSING_UPPERCASE: {
            message: 'error.passwordMissingUppercase',
            code: 'PASSWORD_MISSING_UPPERCASE',
            status: 400,
          },
          PASSWORD_MISSING_LOWERCASE: {
            message: 'error.passwordMissingLowercase',
            code: 'PASSWORD_MISSING_LOWERCASE',
            status: 400,
          },
          PASSWORD_MISSING_NUMBER: {
            message: 'error.passwordMissingNumber',
            code: 'PASSWORD_MISSING_NUMBER',
            status: 400,
          },
          PASSWORD_MISSING_SPECIAL_CHAR: {
            message: 'error.passwordMissingSpecialChar',
            code: 'PASSWORD_MISSING_SPECIAL_CHAR',
            status: 400,
          },
          PASSWORDS_DO_NOT_MATCH: {
            message: 'error.passwordsDoNotMatch',
            code: 'PASSWORDS_DO_NOT_MATCH',
            status: 400,
          },
          PASSWORD_REUSE_NOT_ALLOWED: {
            message: 'error.passwordReuseNotAllowed',
            code: 'PASSWORD_REUSE_NOT_ALLOWED',
            status: 400,
          },
          PASSWORD_IN_BLACKLIST: {
            message: 'error.passwordInBlacklist',
            code: 'PASSWORD_IN_BLACKLIST',
            status: 400,
          },
          ACCOUNT_DEACTIVATED: {
            message: 'error.accountDeactivated',
            code: 'ACCOUNT_DEACTIVATED',
            status: 403,
          },
          PASSWORD_ALREADY_CHANGED: {
            message: 'error.passwordAlreadyChanged',
            code: 'PASSWORD_ALREADY_CHANGED',
            status: 400,
          },
          INTERNAL_ERROR: {
            message: 'error.passwordChangeFailed',
            code: 'PASSWORD_CHANGE_FAILED',
            status: 500,
          },
          TOO_MANY_LOGIN_ATTEMPTS: {
            message: 'error.tooManyLoginAttempts',
            code: 'TOO_MANY_LOGIN_ATTEMPTS',
            status: 429,
          },
          ACCOUNT_SUSPENDED: {
            message: 'error.accountSuspended',
            code: 'ACCOUNT_SUSPENDED',
            status: 403,
          },
          COMPANY_NOT_FOUND: {
            message: 'error.companyNotFound',
            code: 'COMPANY_NOT_FOUND',
            status: 404,
          },
          COMPANY_INACTIVE: {
            message: 'error.companyInactive',
            code: 'COMPANY_INACTIVE',
            status: 403,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.passwordChangeFailed',
          code: 'PASSWORD_CHANGE_FAILED',
          status: 500,
        };

        this.logger.error(
          `ChangePasswordFirstLogin failed - Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );

        const error = new BadRequestException(errorInfo);
        (error as any).status = errorInfo.status;
        throw error;
      }

      this.logger.log(
        `ChangePasswordFirstLogin successful - UserId: ${response.userId}, CorrelationId: ${correlationId}`,
      );

      return {
        success: true,
        sessionToken: response.sessionToken,
        sessionExpiry: response.sessionExpiry,
        user: {
          userId: response.userId,
          email: response.email,
          fullName: response.fullName,
          tenantId: response.tenantId,
          languagePreference: response.languagePreference,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `ChangePasswordFirstLogin error - CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException({
        message: 'error.passwordChangeFailed',
        code: 'PASSWORD_CHANGE_FAILED',
      });
    }
  }

  async logout(
    sessionToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ success: boolean; error?: string; code?: string }> {
    const correlationId = generateCorrelationId();

    this.logger.log(`Logout attempt - IP: ${ipAddress}, CorrelationId: ${correlationId}`);

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.logout({
          sessionToken,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as { success: boolean; error?: string; code?: string };

      if (!response.success) {
        this.logger.warn(
          `Logout failed - Code: ${response.code || 'UNKNOWN'}, CorrelationId: ${correlationId}`,
        );
        return response;
      }

      this.logger.log(`Logout successful - CorrelationId: ${correlationId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Logout error - CorrelationId: ${correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return {
        success: false,
        error: 'Logout failed',
        code: 'LOGOUT_FAILED',
      };
    }
  }
}
