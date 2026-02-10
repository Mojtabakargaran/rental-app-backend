import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface ValidateSessionResponse {
  success: boolean;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  createdAt?: string;
  error?: string;
  code?: string;
}

interface UpdateLastLoginResponse {
  success: boolean;
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

interface GetCompanyInfoResponse {
  success: boolean;
  company?: {
    id: string;
    companyName: string;
    ownerFullName: string;
    ownerEmail: string;
    ownerPhoneNumber: string | null;
    registrationDate: string;
  };
  error?: string;
  code?: string;
}

interface IAuthServiceGrpc {
  validateSession(data: any): any;
  updateLastLogin(data: any): any;
}

interface IUserServiceGrpc {
  getUserProfile(data: any): any;
}

interface ITenantServiceGrpc {
  getCompanyInfo(data: any): any;
}

@Injectable()
export class DashboardService implements OnModuleInit {
  private readonly logger = new Logger(DashboardService.name);
  private authServiceGrpc: IAuthServiceGrpc;
  private userServiceGrpc: IUserServiceGrpc;
  private tenantServiceGrpc: ITenantServiceGrpc;

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
    @Inject('USER_SERVICE') private readonly userClient: ClientGrpc,
    @Inject('TENANT_SERVICE') private readonly tenantClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authServiceGrpc = this.authClient.getService<IAuthServiceGrpc>('AuthService');
    this.userServiceGrpc = this.userClient.getService<IUserServiceGrpc>('UserService');
    this.tenantServiceGrpc = this.tenantClient.getService<ITenantServiceGrpc>('TenantService');
  }

  async getDashboardData(sessionToken: string, correlationId: string) {
    // Step 1: Validate session
    const sessionValidation = await this.validateSession(sessionToken, correlationId);

    // Step 2: Fetch user profile
    const userProfile = await this.getUserProfile(sessionValidation.userId, correlationId);

    // Step 3: Check user is active
    if (!userProfile || !userProfile.isActive) {
      this.logger.warn(`Inactive user attempted dashboard access: ${userProfile?.id}`);
      throw new ForbiddenException({
        success: false,
        error: 'error.accountInactive',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Step 4: Fetch company info
    const companyInfo = await this.getCompanyInfo(sessionValidation.tenantId, correlationId);

    // Step 4.1: Validate company info exists
    if (!companyInfo) {
      this.logger.error(`Company info not found for tenant: ${sessionValidation.tenantId}`);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.companyNotFound',
        code: 'COMPANY_NOT_FOUND',
      });
    }

    // Step 5: Update last login
    await this.updateLastLogin(sessionValidation.sessionId, correlationId);

    // Step 6: Return dashboard data
    return {
      success: true,
      message: 'dashboard.loaded',
      data: {
        user: {
          id: userProfile.id,
          fullName: userProfile.fullName,
          email: userProfile.email,
          phoneNumber: userProfile.phoneNumber,
          languagePreference: userProfile.languagePreference,
          role: userProfile.role,
          lastLoginAt: sessionValidation.createdAt,
        },
        company: {
          id: companyInfo.id,
          companyName: companyInfo.companyName,
          ownerFullName: companyInfo.ownerFullName,
          ownerEmail: companyInfo.ownerEmail,
          ownerPhoneNumber: companyInfo.ownerPhoneNumber,
          registrationDate: companyInfo.registrationDate,
        },
      },
    };
  }

  private async validateSession(
    sessionToken: string,
    correlationId: string,
  ): Promise<{ userId: string; tenantId: string; sessionId: string; createdAt: string }> {
    try {
      const response: ValidateSessionResponse = await firstValueFrom(
        this.authServiceGrpc.validateSession({
          token: sessionToken,
          correlationId,
        }),
      );

      if (!response.success) {
        if (response.code === 'SESSION_EXPIRED') {
          throw new UnauthorizedException({
            success: false,
            error: 'error.sessionExpired',
            code: 'SESSION_EXPIRED',
          });
        }
        throw new UnauthorizedException({
          success: false,
          error: 'error.unauthorized',
          code: 'UNAUTHORIZED',
        });
      }

      return {
        userId: response.userId!,
        tenantId: response.tenantId!,
        sessionId: response.sessionId!,
        createdAt: response.createdAt!,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Session validation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  private async getUserProfile(userId: string, correlationId: string) {
    try {
      const response: GetUserProfileResponse = await firstValueFrom(
        this.userServiceGrpc.getUserProfile({
          userId,
          correlationId,
        }),
      );

      if (!response.success) {
        if (response.code === 'USER_NOT_FOUND') {
          throw new NotFoundException({
            success: false,
            error: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
          });
        }
        throw new InternalServerErrorException({
          success: false,
          error: 'error.loadFailed',
          code: 'DASHBOARD_LOAD_FAILED',
        });
      }

      return response.user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`User profile fetch failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  private async getCompanyInfo(tenantId: string, correlationId: string) {
    try {
      const response: GetCompanyInfoResponse = await firstValueFrom(
        this.tenantServiceGrpc.getCompanyInfo({
          tenantId,
          correlationId,
        }),
      );

      if (!response.success) {
        // Handle specific error codes
        if (response.code === 'COMPANY_INACTIVE') {
          throw new ForbiddenException({
            success: false,
            error: 'error.companyInactive',
            code: 'COMPANY_INACTIVE',
          });
        }
        throw new NotFoundException({
          success: false,
          error: 'error.companyNotFound',
          code: 'COMPANY_NOT_FOUND',
        });
      }

      return response.company;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Company info fetch failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  private async updateLastLogin(sessionId: string, correlationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.authServiceGrpc.updateLastLogin({
          sessionId,
          correlationId,
        }),
      );
    } catch (error) {
      // Non-critical operation - log but don't fail request
      this.logger.warn(`Last login update failed: ${error.message}`);
    }
  }
}
