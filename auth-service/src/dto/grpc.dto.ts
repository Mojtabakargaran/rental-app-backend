import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// ============================================================================
// INCOMING GRPC CALLS - auth.register
// ============================================================================

export class RegisterRequestDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  languagePreference: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class RegisterSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
}

export class RegisterErrorResponseDto {
  success: false;
  error: string;
  code: string;
  details?: object;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.checkEmailExists
// ============================================================================

export class CheckEmailExistsRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class CheckEmailExistsSuccessResponseDto {
  success: true;
  exists: boolean;
}

export class CheckEmailExistsErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - tenant.create
// ============================================================================

export class CreateTenantRequestDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class CreateTenantSuccessResponseDto {
  success: true;
  tenantId: string;
  companyName: string;
}

export class CreateTenantErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.create
// ============================================================================

export class CreateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  passwordHash: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  languagePreference: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class CreateUserSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  fullName: string;
}

export class CreateUserErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.assignRole
// ============================================================================

export class AssignRoleRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class AssignRoleSuccessResponseDto {
  success: true;
  userId: string;
  roleCode: string;
}

export class AssignRoleErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.resendVerification
// ============================================================================

export class ResendVerificationRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ResendVerificationSuccessResponseDto {
  success: true;
  alreadyActivated?: boolean;
}

export class ResendVerificationErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.findByEmail
// ============================================================================

export class FindUserByEmailRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class FindUserByEmailSuccessResponseDto {
  success: true;
  user: {
    userId: string;
    email: string;
    isActive: boolean;
    languagePreference: string;
    fullName: string;
    tenantId: string;
    passwordHash?: string;
    emailVerifiedAt?: string | null;
    passwordChangedAt?: string | null;
    deactivatedAt?: string | null;
  } | null;
}

export class FindUserByEmailErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.verifyEmail
// ============================================================================

export class VerifyEmailRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class VerifyEmailSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  languagePreference: string;
  alreadyActivated?: boolean;
}

export class VerifyEmailErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.findById
// ============================================================================

export class FindUserByIdRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class FindUserByIdSuccessResponseDto {
  success: true;
  user: {
    userId: string;
    email: string;
    isActive: boolean;
    languagePreference: string;
    fullName: string;
    tenantId: string;
    emailVerifiedAt: string | null;
    passwordChangedAt: string | null;
    deactivatedAt: string | null;
  } | null;
}

export class FindUserByIdErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.activateUser
// ============================================================================

export class ActivateUserRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ActivateUserSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  emailVerifiedAt: string;
}

export class ActivateUserErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.login
// ============================================================================

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  rememberMe: boolean;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class LoginSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  languagePreference: string;
  sessionToken: string;
  sessionExpiry: number;
  requirePasswordChange?: boolean;
}

export class LoginErrorResponseDto {
  success: false;
  error: string;
  code: string;
  attemptsRemaining?: number;
  retryAfter?: number;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.findByEmail (for login)
// ============================================================================

export class FindUserByEmailForLoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class FindUserByEmailForLoginSuccessResponseDto {
  success: true;
  user: {
    userId: string;
    email: string;
    fullName: string;
    passwordHash: string;
    tenantId: string;
    isActive: boolean;
    emailVerifiedAt: string | null;
    passwordChangedAt: string | null;
    languagePreference: string;
    deactivatedAt: string | null;
  } | null;
}

export class FindUserByEmailForLoginErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.requestPasswordReset
// ============================================================================

export class RequestPasswordResetRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class RequestPasswordResetSuccessResponseDto {
  success: true;
}

export class RequestPasswordResetErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.validateResetToken
// ============================================================================

export class ValidateResetTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ValidateResetTokenSuccessResponseDto {
  success: true;
  valid: boolean;
}

export class ValidateResetTokenErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.resetPassword
// ============================================================================

export class ResetPasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ResetPasswordSuccessResponseDto {
  success: true;
}

export class ResetPasswordErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// OUTGOING GRPC CALLS - user.updatePassword
// ============================================================================

export class UpdatePasswordRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  newPasswordHash: string;

  @IsString()
  @IsNotEmpty()
  passwordChangedAt: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class UpdatePasswordSuccessResponseDto {
  success: true;
  userId: string;
  passwordChangedAt: string;
}

export class UpdatePasswordErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.validateSession
// ============================================================================

export class ValidateSessionRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ValidateSessionSuccessResponseDto {
  success: true;
  userId: string;
  tenantId: string;
  sessionId: string;
  createdAt: string;
}

export class ValidateSessionErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.updateLastLogin
// ============================================================================

export class UpdateLastLoginRequestDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class UpdateLastLoginSuccessResponseDto {
  success: true;
}

export class UpdateLastLoginErrorResponseDto {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.logout (P3UC04)
// ============================================================================

export class LogoutRequestDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class LogoutSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  sessionId: string;
}

export class LogoutErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.invalidateUserSessions (P4UC05)
// ============================================================================

export class InvalidateUserSessionsRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsNotEmpty()
  invalidatedBy: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class InvalidateUserSessionsSuccessResponseDto {
  success: true;
  userId: string;
  sessionsInvalidated: number;
  cacheCleared: boolean;
}

export class InvalidateUserSessionsErrorResponseDto {
  success: false;
  error: string;
  code: string;
}

// ============================================================================
// INCOMING GRPC CALLS - auth.changePasswordFirstLogin (P4UC06)
// ============================================================================

export class ChangePasswordFirstLoginRequestDto {
  @IsString()
  @IsNotEmpty()
  tempSessionToken: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ChangePasswordFirstLoginSuccessResponseDto {
  success: true;
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  languagePreference: string;
  sessionToken: string;
  sessionExpiry: number;
}

export class ChangePasswordFirstLoginErrorResponseDto {
  success: false;
  error: string;
  code: string;
  details?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}
