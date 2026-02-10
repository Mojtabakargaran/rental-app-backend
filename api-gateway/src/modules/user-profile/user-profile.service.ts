import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { generateCorrelationId } from '@/common/utils/request.util';

interface ValidateSessionResponse {
  success: boolean;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  createdAt?: string;
  error?: string;
  code?: string;
}

interface GetUserProfileResponse {
  success: boolean;
  user?: {
    id: string;
    tenantId: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    languagePreference: string;
    isActive: boolean;
    role: {
      code: string;
      name: string;
    };
  };
  error?: string;
  code?: string;
}

interface UpdateLanguagePreferenceRequest {
  userId: string;
  tenantId: string;
  languagePreference: 'en' | 'fa';
  correlationId: string;
}

interface UpdateLanguagePreferenceResponse {
  success: boolean;
  user?: {
    userId: string;
    languagePreference: 'en' | 'fa';
    updatedAt: string;
  };
  error?: string;
  code?: string;
}

interface IAuthServiceGrpc {
  validateSession(data: any): any;
}

interface IUserServiceGrpc {
  updateLanguagePreference(data: UpdateLanguagePreferenceRequest): any;
  getUserProfile(data: any): any;
}

@Injectable()
export class UserProfileService implements OnModuleInit {
  private readonly logger = new Logger(UserProfileService.name);
  private authServiceGrpc: IAuthServiceGrpc;
  private userServiceGrpc: IUserServiceGrpc;

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
    @Inject('USER_SERVICE') private readonly userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authServiceGrpc = this.authClient.getService<IAuthServiceGrpc>('AuthService');
    this.userServiceGrpc = this.userClient.getService<IUserServiceGrpc>('UserService');
  }

  /**
   * Validate session token and get user profile
   */
  private async validateSession(
    sessionToken: string,
    correlationId: string,
  ): Promise<{
    userId: string;
    tenantId: string;
    email: string;
    isActive: boolean;
  }> {
    try {
      // Step 1: Validate session with auth service
      const sessionResponse = (await firstValueFrom(
        this.authServiceGrpc.validateSession({
          token: sessionToken,
          correlationId,
        }),
      )) as ValidateSessionResponse;

      if (!sessionResponse.success) {
        const errorCodeMap: Record<string, { message: string; code: string }> = {
          SESSION_EXPIRED: {
            message: 'error.sessionExpired',
            code: 'SESSION_EXPIRED',
          },
          SESSION_NOT_FOUND: {
            message: 'error.unauthorized',
            code: 'UNAUTHORIZED',
          },
          INVALID_SESSION: {
            message: 'error.sessionExpired',
            code: 'SESSION_EXPIRED',
          },
        };

        const errorInfo = errorCodeMap[sessionResponse.code || ''] || {
          message: 'error.unauthorized',
          code: 'UNAUTHORIZED',
        };

        throw new UnauthorizedException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      // Step 2: Get user profile from user service
      const userResponse = (await firstValueFrom(
        this.userServiceGrpc.getUserProfile({
          userId: sessionResponse.userId,
          correlationId,
        }),
      )) as GetUserProfileResponse;

      if (!userResponse.success || !userResponse.user) {
        this.logger.error(
          `User profile not found for userId: ${sessionResponse.userId} [${correlationId}]`,
        );
        throw new UnauthorizedException({
          success: false,
          error: 'error.userNotFound',
          code: 'USER_NOT_FOUND',
        });
      }

      return {
        userId: sessionResponse.userId!,
        tenantId: sessionResponse.tenantId!,
        email: userResponse.user.email,
        isActive: userResponse.user.isActive,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Session validation failed: ${error.message}`, error.stack);

      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }
  }

  async updateLanguagePreference(
    sessionToken: string,
    languagePreference: 'en' | 'fa',
  ): Promise<{ languagePreference: 'en' | 'fa' }> {
    const correlationId = generateCorrelationId();

    // Validate session
    const session = await this.validateSession(sessionToken, correlationId);

    // Check if user is active
    if (!session.isActive) {
      this.logger.warn(
        `Language update attempted by inactive user ${session.userId} [${correlationId}]`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.accountInactive',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    this.logger.log(
      `Updating language preference for user ${session.userId} to ${languagePreference} [${correlationId}]`,
    );

    try {
      const response = (await firstValueFrom(
        this.userServiceGrpc.updateLanguagePreference({
          userId: session.userId,
          tenantId: session.tenantId,
          languagePreference,
          correlationId,
        }),
      )) as UpdateLanguagePreferenceResponse;

      if (!response.success) {
        // Map gRPC error codes to HTTP exceptions
        const errorCodeMap: Record<string, { message: string; code: string; status: number }> = {
          INVALID_LANGUAGE: {
            message: 'error.invalidLanguage',
            code: 'INVALID_LANGUAGE',
            status: HttpStatus.BAD_REQUEST,
          },
          USER_NOT_FOUND: {
            message: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
            status: HttpStatus.NOT_FOUND,
          },
          DATABASE_ERROR: {
            message: 'error.languageUpdateFailed',
            code: 'LANGUAGE_UPDATE_FAILED',
            status: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.languageUpdateFailed',
          code: 'LANGUAGE_UPDATE_FAILED',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        };

        throw new HttpException(
          {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          },
          errorInfo.status,
        );
      }

      return {
        languagePreference: response.user!.languagePreference,
      };
    } catch (error) {
      // Handle gRPC communication errors
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to update language preference: ${error.message}`, error.stack);

      throw new HttpException(
        {
          success: false,
          error: 'error.serviceUnavailable',
          code: 'SERVICE_UNAVAILABLE',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
