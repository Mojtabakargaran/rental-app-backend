import { Controller, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from '../services/auth.service';
import {
  RegisterRequestDto,
  RegisterSuccessResponseDto,
  RegisterErrorResponseDto,
  ResendVerificationRequestDto,
  ResendVerificationSuccessResponseDto,
  ResendVerificationErrorResponseDto,
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
  ValidateSessionRequestDto,
  ValidateSessionSuccessResponseDto,
  ValidateSessionErrorResponseDto,
  UpdateLastLoginRequestDto,
  UpdateLastLoginSuccessResponseDto,
  UpdateLastLoginErrorResponseDto,
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
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { ValidationExceptionFilter } from '../common/filters/validation-exception.filter';

// gRPC controller for auth service
@Controller()
@UseFilters(new ValidationExceptionFilter(), new AllExceptionsFilter())
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // P1UC01: Handle auth.register gRPC call from api-gateway
  @GrpcMethod('AuthService', 'Register')
  async register(
    request: RegisterRequestDto,
  ): Promise<RegisterSuccessResponseDto | RegisterErrorResponseDto> {
    console.log('[AuthController] Register request received:', {
      email: request.email,
      correlationId: request.correlationId,
    });

    return await this.authService.register(request);
  }

  // P1UC02: Handle auth.resendVerification gRPC call from api-gateway
  @GrpcMethod('AuthService', 'ResendVerification')
  async resendVerification(
    request: ResendVerificationRequestDto,
  ): Promise<ResendVerificationSuccessResponseDto | ResendVerificationErrorResponseDto> {
    console.log('[AuthController] ResendVerification request received:', {
      email: request.email,
      correlationId: request.correlationId,
    });

    return await this.authService.resendVerification(request);
  }

  // P1UC03: Handle auth.verifyEmail gRPC call from api-gateway
  @GrpcMethod('AuthService', 'VerifyEmail')
  async verifyEmail(
    request: VerifyEmailRequestDto,
  ): Promise<VerifyEmailSuccessResponseDto | VerifyEmailErrorResponseDto> {
    console.log('[AuthController] VerifyEmail request received:', {
      token: request.token.substring(0, 8) + '...',
      correlationId: request.correlationId,
    });

    return await this.authService.verifyEmail(request);
  }

  // P2UC01: Handle auth.login gRPC call from api-gateway
  @GrpcMethod('AuthService', 'Login')
  async login(
    request: LoginRequestDto,
  ): Promise<LoginSuccessResponseDto | LoginErrorResponseDto> {
    console.log('[AuthController] Login request received:', {
      email: request.email,
      rememberMe: request.rememberMe,
      correlationId: request.correlationId,
    });

    return await this.authService.login(request);
  }

  // P2UC02: Handle auth.requestPasswordReset gRPC call from api-gateway
  @GrpcMethod('AuthService', 'RequestPasswordReset')
  async requestPasswordReset(
    request: RequestPasswordResetRequestDto,
  ): Promise<RequestPasswordResetSuccessResponseDto | RequestPasswordResetErrorResponseDto> {
    console.log('[AuthController] RequestPasswordReset request received:', {
      email: request.email,
      correlationId: request.correlationId,
    });

    return await this.authService.requestPasswordReset(request);
  }

  // P2UC02: Handle auth.validateResetToken gRPC call from api-gateway
  @GrpcMethod('AuthService', 'ValidateResetToken')
  async validateResetToken(
    request: ValidateResetTokenRequestDto,
  ): Promise<ValidateResetTokenSuccessResponseDto | ValidateResetTokenErrorResponseDto> {
    console.log('[AuthController] ValidateResetToken request received:', {
      token: request.token.substring(0, 8) + '...',
      correlationId: request.correlationId,
    });

    return await this.authService.validateResetToken(request);
  }

  // P2UC02: Handle auth.resetPassword gRPC call from api-gateway
  @GrpcMethod('AuthService', 'ResetPassword')
  async resetPassword(
    request: ResetPasswordRequestDto,
  ): Promise<ResetPasswordSuccessResponseDto | ResetPasswordErrorResponseDto> {
    console.log('[AuthController] ResetPassword request received:', {
      token: request.token.substring(0, 8) + '...',
      correlationId: request.correlationId,
    });

    return await this.authService.resetPassword(request);
  }

  // P3UC01: Handle auth.validateSession gRPC call from api-gateway
  @GrpcMethod('AuthService', 'ValidateSession')
  async validateSession(
    request: ValidateSessionRequestDto,
  ): Promise<ValidateSessionSuccessResponseDto | ValidateSessionErrorResponseDto> {
    console.log('[AuthController] ValidateSession request received:', {
      correlationId: request.correlationId,
    });

    return await this.authService.validateSession(request.token, request.correlationId);
  }

  // P3UC01: Handle auth.updateLastLogin gRPC call from api-gateway
  @GrpcMethod('AuthService', 'UpdateLastLogin')
  async updateLastLogin(
    request: UpdateLastLoginRequestDto,
  ): Promise<UpdateLastLoginSuccessResponseDto | UpdateLastLoginErrorResponseDto> {
    console.log('[AuthController] UpdateLastLogin request received:', {
      sessionId: request.sessionId,
      correlationId: request.correlationId,
    });

    return await this.authService.updateLastLogin(request.sessionId, request.correlationId);
  }

  // P3UC04: Handle auth.logout gRPC call from api-gateway
  @GrpcMethod('AuthService', 'Logout')
  async logout(
    request: LogoutRequestDto,
  ): Promise<LogoutSuccessResponseDto | LogoutErrorResponseDto> {
    console.log('[AuthController] Logout request received:', {
      correlationId: request.correlationId,
    });

    return await this.authService.logout(request);
  }

  // P4UC05: Handle auth.invalidateUserSessions gRPC call from api-gateway
  @GrpcMethod('AuthService', 'InvalidateUserSessions')
  async invalidateUserSessions(
    request: InvalidateUserSessionsRequestDto,
  ): Promise<InvalidateUserSessionsSuccessResponseDto | InvalidateUserSessionsErrorResponseDto> {
    console.log('[AuthController] InvalidateUserSessions request received:', {
      userId: request.userId,
      reason: request.reason,
      correlationId: request.correlationId,
    });

    return await this.authService.invalidateUserSessions(request);
  }

  // P4UC06: Handle auth.changePasswordFirstLogin gRPC call from api-gateway
  @GrpcMethod('AuthService', 'ChangePasswordFirstLogin')
  async changePasswordFirstLogin(
    request: ChangePasswordFirstLoginRequestDto,
  ): Promise<ChangePasswordFirstLoginSuccessResponseDto | ChangePasswordFirstLoginErrorResponseDto> {
    console.log('[AuthController] ChangePasswordFirstLogin request received:', {
      correlationId: request.correlationId,
    });

    return await this.authService.changePasswordFirstLogin(request);
  }
}
