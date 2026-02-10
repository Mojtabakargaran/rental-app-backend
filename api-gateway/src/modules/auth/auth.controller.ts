import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { ResendVerificationRequestDto } from './dto/resend-verification-request.dto';
import { ResendVerificationResponseDto } from './dto/resend-verification-response.dto';
import { VerifyEmailResponseDto } from './dto/verify-email-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto';
import { ValidateResetTokenRequestDto } from './dto/validate-reset-token-request.dto';
import { ValidateResetTokenResponseDto } from './dto/validate-reset-token-response.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { ChangePasswordFirstLoginRequestDto } from './dto/change-password-first-login-request.dto';
import { ChangePasswordFirstLoginResponseDto } from './dto/change-password-first-login-response.dto';
import { ErrorResponseDto } from './dto/error-response.dto';
import { extractIpAddress, extractUserAgent } from '@/common/utils/request.util';
import { generateCorrelationId } from '@/common/utils/request.util';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get CSRF token',
    description: 'Generates and returns a CSRF token for form submission security',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated successfully',
    schema: {
      type: 'object',
      properties: {
        csrfToken: {
          type: 'string',
          description: 'The CSRF token to include in subsequent requests',
        },
      },
    },
  })
  async getCsrfToken(@Req() request: Request): Promise<{ csrfToken: string }> {
    const ipAddress = extractIpAddress(request);
    this.logger.log(`CSRF token requested - IP: ${ipAddress}`);

    // Generate a cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // In a production environment, you would store this token in session or Redis
    // For now, we'll return it directly
    return { csrfToken: token };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user account with company',
    description:
      'User navigates to the registration page, selects their preferred language (English or Persian), fills out the registration form with personal and company information, and submits the form. The system creates both the user account and company (tenant) in an atomic transaction, stores the language preference, and sends a verification email.',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token for security',
    required: true,
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: RegisterResponseDto,
    example: {
      success: true,
      message: 'register.success',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        tenantId: '987e6543-e21b-98d7-a654-426614174111',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.emailExists',
      code: 'EMAIL_ALREADY_EXISTS',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'CSRF token invalid',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.csrfInvalid',
      code: 'CSRF_TOKEN_INVALID',
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.rateLimitExceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 3600,
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.registrationFailed',
      code: 'REGISTRATION_FAILED',
    },
  })
  async register(
    @Body() registerDto: RegisterRequestDto,
    @Req() request: Request,
  ): Promise<RegisterResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    this.logger.log(`Register endpoint called - Email: ${registerDto.email}, IP: ${ipAddress}`);

    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'User requests a new verification email when the original verification token has expired or was not received. The system generates a new time-limited token and sends a fresh verification email.',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token for security',
    required: true,
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully',
    type: ResendVerificationResponseDto,
    example: {
      success: true,
      message: 'resendVerification.success',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.invalidEmail',
      code: 'VALIDATION_ERROR',
      details: [
        {
          field: 'email',
          message: 'error.invalidEmail',
          code: 'INVALID_EMAIL_FORMAT',
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'CSRF token invalid',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.csrfInvalid',
      code: 'CSRF_TOKEN_INVALID',
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.rateLimitExceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 600,
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.resendVerificationFailed',
      code: 'RESEND_VERIFICATION_FAILED',
    },
  })
  async resendVerification(
    @Body() resendDto: ResendVerificationRequestDto,
    @Req() request: Request,
  ): Promise<ResendVerificationResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    this.logger.log(
      `ResendVerification endpoint called - Email: ${resendDto.email}, IP: ${ipAddress}`,
    );

    return this.authService.resendVerification(resendDto, ipAddress, userAgent);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email address',
    description:
      'User clicks the verification link in their email. The system validates the token, activates the account, and redirects the user to the login page.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
    example: {
      success: true,
      message: 'auth.verifyEmail.success',
      redirectUrl: '/login',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token missing or invalid format',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.invalidVerificationLink',
      code: 'INVALID_TOKEN_FORMAT',
      resendUrl: '/resend-verification',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token does not exist',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tokenNotFound',
      code: 'TOKEN_NOT_FOUND',
      resendUrl: '/resend-verification',
    },
  })
  @ApiResponse({
    status: 410,
    description: 'Token expired',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tokenExpired',
      code: 'TOKEN_EXPIRED',
      resendUrl: '/resend-verification',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Verification failed',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.verificationFailed',
      code: 'VERIFICATION_FAILED',
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.serviceUnavailable',
      code: 'SERVICE_UNAVAILABLE',
    },
  })
  async verifyEmail(
    @Query('token') token: string,
    @Req() request: Request,
  ): Promise<VerifyEmailResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    this.logger.log(
      `VerifyEmail endpoint called - Token: ${token?.substring(0, 8)}..., IP: ${ipAddress}`,
    );

    if (!token) {
      throw new ErrorResponseDto();
    }

    return this.authService.verifyEmail(token, ipAddress, userAgent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user with email and password, creates session, and returns user data. For first-time login, returns requirePasswordChange flag.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
    example: {
      success: true,
      message: 'auth.loginSuccess',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'owner@company.com',
        fullName: 'John Doe',
        tenantId: '987e6543-e21b-98d7-a654-426614174111',
        languagePreference: 'en',
        requirePasswordChange: false,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.validationFailed',
      code: 'VALIDATION_ERROR',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.invalidCredentials',
      code: 'INVALID_CREDENTIALS',
      attemptsRemaining: 4,
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified or account inactive',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.emailNotVerified',
      code: 'EMAIL_NOT_VERIFIED',
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.rateLimitExceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900,
    },
  })
  async login(
    @Body() loginDto: LoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    this.logger.log(`Login endpoint called - Email: ${loginDto.email}, IP: ${ipAddress}`);

    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    // Set HTTP-only secure cookie with session token
    const nodeEnv = this.configService.get<string>('nodeEnv');
    response.cookie('session_token', result.sessionToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(result.sessionExpiry * 1000),
      path: '/',
    });

    return {
      success: true,
      message: 'login.success',
      data: {
        ...result.user,
        requirePasswordChange: result.requirePasswordChange,
      },
    };
  }

  @Post('change-password-first-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change temporary password on first login',
    description:
      'User changes temporary password to permanent password after first login. Requires valid temporary session token obtained from login.',
  })
  @ApiHeader({
    name: 'Content-Type',
    description: 'Must be application/json',
    required: true,
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token for security',
    required: true,
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ChangePasswordFirstLoginResponseDto,
    example: {
      success: true,
      message: 'auth.passwordChangedSuccess',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'staff@company.com',
        fullName: 'Jane Doe',
        tenantId: '987e6543-e21b-98d7-a654-426614174111',
        languagePreference: 'en',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.validationFailed',
      code: 'VALIDATION_ERROR',
      details: [
        {
          field: 'newPassword',
          message: 'error.passwordTooShort',
          code: 'PASSWORD_TOO_SHORT',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired temporary session',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tempSessionExpired',
      code: 'TEMP_SESSION_EXPIRED',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Account deactivated',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.accountDeactivated',
      code: 'ACCOUNT_DEACTIVATED',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.passwordChangeFailed',
      code: 'PASSWORD_CHANGE_FAILED',
    },
  })
  async changePasswordFirstLogin(
    @Body() changePasswordDto: ChangePasswordFirstLoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ChangePasswordFirstLoginResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);
    const tempSessionToken = request.cookies?.session_token;

    this.logger.log(`ChangePasswordFirstLogin endpoint called - IP: ${ipAddress}`);

    if (!tempSessionToken) {
      throw new ErrorResponseDto();
    }

    const result = await this.authService.changePasswordFirstLogin(
      tempSessionToken,
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
      ipAddress,
      userAgent,
    );

    // Set new full session cookie
    const nodeEnv = this.configService.get<string>('nodeEnv');
    response.cookie('session_token', result.sessionToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'strict',
      expires: new Date(result.sessionExpiry * 1000),
      path: '/',
    });

    return {
      success: true,
      message: 'passwordChange.firstLogin.success',
      data: result.user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'User requests a password reset link to be sent to their email. The system validates the email, generates a secure token, and sends a reset link. Returns a generic success message to prevent email enumeration.',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token for security',
    required: true,
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Generic success response (prevents email enumeration)',
    type: ForgotPasswordResponseDto,
    example: {
      success: true,
      message: 'forgotPassword.success',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.validationFailed',
      code: 'VALIDATION_ERROR',
      details: [
        {
          field: 'email',
          message: 'error.invalidEmailFormat',
          code: 'INVALID_EMAIL_FORMAT',
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'CSRF token invalid',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.csrfInvalid',
      code: 'CSRF_TOKEN_INVALID',
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.rateLimitExceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 3600,
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordRequestDto,
    @Req() request: Request,
  ): Promise<ForgotPasswordResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    this.logger.log(
      `ForgotPassword endpoint called - Email: ${forgotPasswordDto.email}, IP: ${ipAddress}`,
    );

    return this.authService.requestPasswordReset(forgotPasswordDto.email, ipAddress, userAgent);
  }

  @Get('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate password reset token',
    description:
      'Validates the password reset token from the URL query parameter. Called when user clicks the reset link in their email to verify the token is valid before displaying the password reset form.',
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    type: ValidateResetTokenResponseDto,
    example: {
      success: true,
      message: 'validateResetToken.success',
      data: { valid: true },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token format',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.invalidResetLink',
      code: 'INVALID_TOKEN_FORMAT',
      requestNewUrl: '/forgot-password',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tokenNotFound',
      code: 'TOKEN_NOT_FOUND',
      requestNewUrl: '/forgot-password',
    },
  })
  @ApiResponse({
    status: 410,
    description: 'Token expired or already used',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tokenExpired',
      code: 'TOKEN_EXPIRED',
      requestNewUrl: '/forgot-password',
    },
  })
  async validateResetToken(@Query('token') token: string): Promise<ValidateResetTokenResponseDto> {
    this.logger.log(`ValidateResetToken endpoint called - Token: ${token?.substring(0, 8)}...`);

    if (!token) {
      throw new ErrorResponseDto();
    }

    return this.authService.validateResetToken(token);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with new password',
    description:
      'User submits the password reset form with new password. The system validates the token, updates the password with bcrypt hash, invalidates all existing sessions, and sends a confirmation email.',
  })
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF token for security',
    required: true,
  })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Preferred language (en or fa)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    type: ResetPasswordResponseDto,
    example: {
      success: true,
      message: 'resetPassword.success',
      data: {
        redirectUrl: '/login',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or weak password',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.weakPassword',
      code: 'WEAK_PASSWORD',
      details: [
        {
          field: 'newPassword',
          message: 'error.weakPassword',
          code: 'WEAK_PASSWORD',
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'CSRF token invalid',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.csrfInvalid',
      code: 'CSRF_TOKEN_INVALID',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token not found',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tokenNotFound',
      code: 'TOKEN_NOT_FOUND',
      requestNewUrl: '/forgot-password',
    },
  })
  @ApiResponse({
    status: 410,
    description: 'Token expired, used, or invalidated',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.tokenExpired',
      code: 'TOKEN_EXPIRED',
      requestNewUrl: '/forgot-password',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Password reset failed',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.resetPasswordFailed',
      code: 'RESET_PASSWORD_FAILED',
    },
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordRequestDto,
    @Req() request: Request,
  ): Promise<ResetPasswordResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    this.logger.log(
      `ResetPassword endpoint called - Token: ${resetPasswordDto.token?.substring(0, 8)}..., IP: ${ipAddress}`,
    );

    return this.authService.resetPassword(
      {
        token: resetPasswordDto.token,
        newPassword: resetPasswordDto.newPassword,
        confirmPassword: resetPasswordDto.confirmPassword,
      },
      ipAddress,
      userAgent,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Terminates user session, invalidates token, and clears authentication cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
    example: {
      success: true,
      message: 'logout.success',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No valid session found',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: 'error.sessionNotFound',
      code: 'SESSION_NOT_FOUND',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Logout failed (user still logged out client-side)',
    type: LogoutResponseDto,
    example: {
      success: true,
      message: 'logout.success',
      warning: 'logout.cleanupFailed',
      code: 'LOGOUT_CLEANUP_FAILED',
    },
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponseDto> {
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);
    const sessionToken = request.cookies?.session_token;

    this.logger.log(`Logout endpoint called - IP: ${ipAddress}`);

    // Always clear cookie regardless of backend response
    response.clearCookie('session_token', {
      httpOnly: true,
      secure: this.configService.get<string>('nodeEnv') === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // If no session token, treat as successful logout
    if (!sessionToken) {
      this.logger.log('Logout called with no session token - treating as success');
      return {
        success: true,
        message: 'logout.success',
      };
    }

    try {
      const result = await this.authService.logout(sessionToken, ipAddress, userAgent);

      if (result.success) {
        return {
          success: true,
          message: 'logout.success',
        };
      } else {
        // Backend failed but cookie is cleared - return success with warning
        this.logger.warn(`Logout backend failure: ${result.error}`);
        return {
          success: true,
          message: 'logout.success',
          warning: 'logout.cleanupFailed',
          code: 'LOGOUT_CLEANUP_FAILED',
        };
      }
    } catch (error) {
      // Catch any exceptions, still return success since cookie is cleared
      this.logger.error('Logout exception:', error);
      return {
        success: true,
        message: 'logout.success',
        warning: 'logout.cleanupFailed',
        code: 'LOGOUT_CLEANUP_FAILED',
      };
    }
  }
}
