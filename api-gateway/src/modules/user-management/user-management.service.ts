import {
  Injectable,
  Inject,
  OnModuleInit,
  Logger,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import {
  IAuthServiceGrpc,
  IUserServiceGrpc,
  ValidateSessionResponse,
  GetRolesResponse,
  CreateUserByOwnerResponse,
  GetUserProfileResponse,
  ListUsersResponse,
  GetUserDetailsResponse,
  UpdateUserRoleResponse,
  DeactivateUserResponse,
  ReactivateUserResponse,
} from './interfaces/user-management.interface';

@Injectable()
export class UserManagementService implements OnModuleInit {
  private readonly logger = new Logger(UserManagementService.name);
  private authServiceGrpc: IAuthServiceGrpc;
  private userServiceGrpc: IUserServiceGrpc;

  private readonly errorCodeMap: Record<string, { message: string; code: string }> = {
    EMAIL_ALREADY_EXISTS: {
      message: 'error.emailExists',
      code: 'EMAIL_ALREADY_EXISTS',
    },
    INVALID_EMAIL_FORMAT: {
      message: 'error.invalidEmail',
      code: 'INVALID_EMAIL_FORMAT',
    },
    INVALID_PHONE_FORMAT: {
      message: 'error.invalidPhone',
      code: 'INVALID_PHONE_FORMAT',
    },
    REQUIRED_FIELD_MISSING: {
      message: 'error.requiredField',
      code: 'REQUIRED_FIELD_MISSING',
    },
    ROLE_NOT_FOUND: { message: 'error.roleNotFound', code: 'ROLE_NOT_FOUND' },
    USER_CREATION_FAILED: {
      message: 'error.userCreationFailed',
      code: 'USER_CREATION_FAILED',
    },
    INVALID_FULL_NAME: {
      message: 'error.invalidFullName',
      code: 'INVALID_FULL_NAME',
    },
    USER_NOT_FOUND: { message: 'error.userNotFound', code: 'USER_NOT_FOUND' },
    USER_INACTIVE: { message: 'error.accountInactive', code: 'USER_INACTIVE' },
    INVALID_PAGE_NUMBER: {
      message: 'error.invalidPage',
      code: 'INVALID_PAGE_NUMBER',
    },
    INVALID_LIMIT: { message: 'error.invalidLimit', code: 'INVALID_LIMIT' },
    INVALID_STATUS_FILTER: {
      message: 'error.invalidStatus',
      code: 'INVALID_STATUS_FILTER',
    },
    SEARCH_TOO_SHORT: {
      message: 'error.searchTooShort',
      code: 'SEARCH_TOO_SHORT',
    },
    USERS_RETRIEVAL_FAILED: {
      message: 'error.usersRetrievalFailed',
      code: 'USERS_RETRIEVAL_FAILED',
    },
    CROSS_TENANT_ACCESS: {
      message: 'error.crossTenantAccess',
      code: 'CROSS_TENANT_ACCESS',
    },
    INVALID_USER_ID: {
      message: 'error.invalidUserId',
      code: 'INVALID_USER_ID',
    },
    SELF_ROLE_MODIFICATION: {
      message: 'error.cannotModifyOwnRole',
      code: 'SELF_ROLE_MODIFICATION',
    },
    OWNER_ROLE_PROTECTED: {
      message: 'error.ownerRoleProtected',
      code: 'OWNER_ROLE_PROTECTED',
    },
    RATE_LIMIT_EXCEEDED: {
      message: 'error.rateLimitExceeded',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    NO_CHANGES_MADE: {
      message: 'error.noChanges',
      code: 'NO_CHANGES',
    },
    PROFILE_UPDATE_FAILED: {
      message: 'error.profileUpdateFailed',
      code: 'PROFILE_UPDATE_FAILED',
    },
    INVALID_ROLE_CODE: {
      message: 'error.invalidRoleCode',
      code: 'INVALID_ROLE_CODE',
    },
    SESSION_EXPIRED: {
      message: 'error.sessionExpired',
      code: 'SESSION_EXPIRED',
    },
    ROLE_UPDATE_FAILED: {
      message: 'error.roleUpdateFailed',
      code: 'ROLE_UPDATE_FAILED',
    },
    USER_ALREADY_DEACTIVATED: {
      message: 'error.userAlreadyDeactivated',
      code: 'USER_ALREADY_DEACTIVATED',
    },
    CANNOT_DEACTIVATE_SELF: {
      message: 'error.cannotDeactivateSelf',
      code: 'CANNOT_DEACTIVATE_SELF',
    },
    CANNOT_DEACTIVATE_LAST_OWNER: {
      message: 'error.cannotDeactivateLastOwner',
      code: 'CANNOT_DEACTIVATE_LAST_OWNER',
    },
    DEACTIVATION_FAILED: {
      message: 'error.deactivationFailed',
      code: 'DEACTIVATION_FAILED',
    },
    USER_ALREADY_ACTIVE: {
      message: 'error.userAlreadyActive',
      code: 'USER_ALREADY_ACTIVE',
    },
    REACTIVATION_FAILED: {
      message: 'error.reactivationFailed',
      code: 'REACTIVATION_FAILED',
    },
    COMPANY_NOT_FOUND: {
      message: 'error.companyNotFound',
      code: 'COMPANY_NOT_FOUND',
    },
    COMPANY_INACTIVE: {
      message: 'error.companyInactive',
      code: 'COMPANY_INACTIVE',
    },
    ACCOUNT_SUSPENDED: {
      message: 'error.accountSuspended',
      code: 'ACCOUNT_SUSPENDED',
    },
    DATABASE_ERROR: {
      message: 'error.databaseError',
      code: 'DATABASE_ERROR',
    },
    LOAD_FAILED: {
      message: 'error.loadFailed',
      code: 'LOAD_FAILED',
    },
  };

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
    @Inject('USER_SERVICE') private readonly userClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authServiceGrpc = this.authClient.getService<IAuthServiceGrpc>('AuthService');
    this.userServiceGrpc = this.userClient.getService<IUserServiceGrpc>('UserService');
  }

  async getRoles(sessionToken: string, correlationId: string) {
    // Validate session
    await this.validateSession(sessionToken, correlationId);

    // Fetch roles from user-service
    try {
      const response: GetRolesResponse = await firstValueFrom(
        this.userServiceGrpc.getRoles({
          correlationId,
        }),
      );

      if (!response.success) {
        this.logger.error(`Get roles failed: ${response.error}`);
        throw new InternalServerErrorException({
          success: false,
          error: 'error.rolesRetrievalFailed',
          code: 'ROLES_RETRIEVAL_FAILED',
        });
      }

      return {
        success: true,
        message: 'roles.retrieved',
        data: {
          roles: response.roles || [],
        },
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Get roles failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  async createUser(
    createUserDto: CreateUserRequestDto,
    sessionToken: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    // Validate session and get user info
    const session = await this.validateSession(sessionToken, correlationId);

    // Get user profile to check role and language preference
    const userProfile = await this.getUserProfile(session.userId, correlationId);

    // Check if user is company owner
    if (userProfile.role.code !== 'COMPANY_OWNER') {
      this.logger.warn(
        `Insufficient permissions for user ${session.userId} - Role: ${userProfile.role.code}`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Create user via user-service
    try {
      const response: CreateUserByOwnerResponse = await firstValueFrom(
        this.userServiceGrpc.createUserByOwner({
          fullName: createUserDto.fullName,
          email: createUserDto.email,
          phoneNumber: createUserDto.phoneNumber,
          roleCode: createUserDto.roleCode,
          tenantId: session.tenantId,
          createdBy: session.userId,
          createdByLanguage: userProfile.languagePreference,
          ipAddress,
          userAgent,
          correlationId,
        }),
      );

      if (!response.success) {
        const errorInfo =
          this.errorCodeMap[response.code!] || this.errorCodeMap['USER_CREATION_FAILED'];
        this.logger.error(`User creation failed: ${response.error} - Code: ${response.code}`);
        throw new BadRequestException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      return {
        success: true,
        message: 'user.created',
        data: {
          userId: response.userId!,
          email: response.email!,
          fullName: response.fullName!,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`User creation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  async listUsers(
    sessionToken: string,
    page: number,
    limit: number,
    search: string | undefined,
    status: string | undefined,
    roleCode: string | undefined,
    correlationId: string,
  ) {
    // Validate session and get user info
    const session = await this.validateSession(sessionToken, correlationId);

    // Get user profile to check role
    const userProfile = await this.getUserProfile(session.userId, correlationId);

    // Check if user is company owner
    if (userProfile.role.code !== 'COMPANY_OWNER') {
      this.logger.warn(
        `Insufficient permissions for user ${session.userId} - Role: ${userProfile.role.code}`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // List users via user-service
    try {
      const response: ListUsersResponse = await firstValueFrom(
        this.userServiceGrpc.listUsers({
          tenantId: session.tenantId,
          page,
          limit,
          search,
          status,
          roleCode,
          correlationId,
        }),
      );

      if (!response.success) {
        const errorInfo = this.errorCodeMap[response.code!] || this.errorCodeMap['DATABASE_ERROR'];
        this.logger.error(`List users failed: ${response.error} - Code: ${response.code}`);
        throw new InternalServerErrorException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      return {
        success: true,
        message: 'users.retrieved',
        data: {
          users: response.users || [],
          pagination: response.pagination || {
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`List users failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  async getUserDetails(sessionToken: string, userId: string, correlationId: string) {
    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      this.logger.warn(`Invalid user ID format: ${userId}`);
      throw new BadRequestException({
        success: false,
        error: 'error.invalidUserId',
        code: 'INVALID_USER_ID',
      });
    }

    // Validate session and get user info
    const session = await this.validateSession(sessionToken, correlationId);

    // Get user profile to check role
    const userProfile = await this.getUserProfile(session.userId, correlationId);

    // Check if user is company owner
    if (userProfile.role.code !== 'COMPANY_OWNER') {
      this.logger.warn(
        `Insufficient permissions for user ${session.userId} - Role: ${userProfile.role.code}`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Get user details via user-service
    try {
      const response: GetUserDetailsResponse = await firstValueFrom(
        this.userServiceGrpc.getUserDetails({
          userId,
          tenantId: session.tenantId,
          correlationId,
        }),
      );

      if (!response.success) {
        if (response.code === 'USER_NOT_FOUND') {
          throw new BadRequestException({
            success: false,
            error: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
          });
        }
        if (response.code === 'CROSS_TENANT_ACCESS') {
          throw new ForbiddenException({
            success: false,
            error: 'error.crossTenantAccess',
            code: 'CROSS_TENANT_ACCESS',
          });
        }
        const errorInfo = this.errorCodeMap[response.code!] || this.errorCodeMap['DATABASE_ERROR'];
        this.logger.error(`Get user details failed: ${response.error} - Code: ${response.code}`);
        throw new InternalServerErrorException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      return {
        success: true,
        message: 'user.details.retrieved',
        data: {
          user: response.user!,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Get user details failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  async updateUserRole(
    userId: string,
    newRoleCode: string,
    sessionToken: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      this.logger.warn(`Invalid user ID format: ${userId}`);
      throw new BadRequestException({
        success: false,
        error: 'error.invalidUserId',
        code: 'INVALID_USER_ID',
      });
    }

    // Validate session and get user info
    const session = await this.validateSession(sessionToken, correlationId);

    // Get user profile to check role
    const userProfile = await this.getUserProfile(session.userId, correlationId);

    // Check if user is company owner
    if (userProfile.role.code !== 'COMPANY_OWNER') {
      this.logger.warn(
        `Insufficient permissions for user ${session.userId} - Role: ${userProfile.role.code}`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Update user role via user-service
    try {
      const response: UpdateUserRoleResponse = await firstValueFrom(
        this.userServiceGrpc.updateUserRole({
          userId,
          newRoleCode,
          actorId: session.userId,
          tenantId: session.tenantId,
          ipAddress,
          userAgent,
          correlationId,
        }),
      );

      if (!response.success) {
        // Handle specific error codes
        if (response.code === 'SELF_ROLE_MODIFICATION') {
          throw new ForbiddenException({
            success: false,
            error: 'error.cannotModifyOwnRole',
            code: 'SELF_ROLE_MODIFICATION',
          });
        }
        if (response.code === 'OWNER_ROLE_PROTECTED') {
          throw new ForbiddenException({
            success: false,
            error: 'error.ownerRoleProtected',
            code: 'OWNER_ROLE_PROTECTED',
          });
        }
        if (response.code === 'CROSS_TENANT_ACCESS') {
          throw new ForbiddenException({
            success: false,
            error: 'error.crossTenantAccess',
            code: 'CROSS_TENANT_ACCESS',
          });
        }
        if (response.code === 'USER_NOT_FOUND') {
          throw new NotFoundException({
            success: false,
            error: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
          });
        }
        if (response.code === 'RATE_LIMIT_EXCEEDED') {
          throw new BadRequestException({
            success: false,
            error: 'error.rateLimitExceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: response.retryAfter,
          });
        }
        if (response.code === 'INVALID_ROLE_CODE') {
          throw new BadRequestException({
            success: false,
            error: 'error.invalidRoleCode',
            code: 'INVALID_ROLE_CODE',
          });
        }

        const errorInfo =
          this.errorCodeMap[response.code!] || this.errorCodeMap['ROLE_UPDATE_FAILED'];
        this.logger.error(`Role update failed: ${response.error} - Code: ${response.code}`);
        throw new InternalServerErrorException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      return {
        success: true,
        message: 'role.updated',
        data: {
          userId: response.userId!,
          fullName: response.fullName!,
          email: response.email!,
          oldRole: response.oldRole!,
          newRole: response.newRole!,
          updatedAt: response.updatedAt!,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Role update failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  /**
   * Update user profile (P4UC04)
   */
  async updateUserProfile(
    userId: string,
    updateProfileDto: { fullName: string; email: string; phoneNumber?: string },
    sessionToken: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ): Promise<any> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new BadRequestException({
          success: false,
          error: 'error.invalidUserId',
          code: 'INVALID_USER_ID',
        });
      }

      // Validate session
      const session = await this.validateSession(sessionToken, correlationId);

      // Get user profile for permission check
      const userProfile = await this.getUserProfile(session.userId, correlationId);

      // Check if user is company owner
      if (userProfile.role.code !== 'COMPANY_OWNER') {
        throw new ForbiddenException({
          success: false,
          error: 'error.insufficientPermissions',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      // Call user-service to update profile
      const response: any = await firstValueFrom(
        this.userServiceGrpc.updateUserProfile({
          userId,
          tenantId: session.tenantId,
          fullName: updateProfileDto.fullName,
          email: updateProfileDto.email,
          phoneNumber: updateProfileDto.phoneNumber,
          actorId: session.userId,
          ipAddress,
          userAgent,
          correlationId,
        }),
      );

      if (!response.success) {
        const mappedError = this.errorCodeMap[response.code];
        if (mappedError) {
          if (response.code === 'USER_NOT_FOUND') {
            throw new NotFoundException({
              success: false,
              error: mappedError.message,
              code: mappedError.code,
            });
          }
          if (
            response.code === 'CROSS_TENANT_ACCESS' ||
            response.code === 'INSUFFICIENT_PERMISSIONS'
          ) {
            throw new ForbiddenException({
              success: false,
              error: mappedError.message,
              code: mappedError.code,
            });
          }
          if (response.code === 'EMAIL_ALREADY_EXISTS' || response.code === 'NO_CHANGES') {
            throw new BadRequestException({
              success: false,
              error: mappedError.message,
              code: mappedError.code,
            });
          }
          throw new BadRequestException({
            success: false,
            error: mappedError.message,
            code: mappedError.code,
          });
        }
        throw new InternalServerErrorException({
          success: false,
          error: 'error.profileUpdateFailed',
          code: 'PROFILE_UPDATE_FAILED',
        });
      }

      return {
        success: true,
        message: 'user.profile.updated',
        data: {
          userId: response.userId,
          fullName: response.fullName,
          email: response.email,
          phoneNumber: response.phoneNumber,
          changedFields: response.changedFields,
          emailChanged: response.emailChanged,
          emailVerificationRequired: response.emailChanged ? true : undefined,
          updatedAt: response.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Profile update failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  private async validateSession(
    sessionToken: string,
    correlationId: string,
  ): Promise<{ userId: string; tenantId: string; sessionId: string }> {
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

  async deactivateUser(
    userId: string,
    reason: string | undefined,
    sessionToken: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    // Validate session and get user info
    const session = await this.validateSession(sessionToken, correlationId);

    // Get user profile to check role
    const userProfile = await this.getUserProfile(session.userId, correlationId);

    // Check if user is company owner
    if (userProfile.role.code !== 'COMPANY_OWNER') {
      this.logger.warn(
        `Insufficient permissions for user ${session.userId} - Role: ${userProfile.role.code}`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Deactivate user via user-service
    try {
      const response: DeactivateUserResponse = await firstValueFrom(
        this.userServiceGrpc.deactivateUser({
          userId,
          actorId: session.userId,
          tenantId: session.tenantId,
          reason,
          ipAddress,
          userAgent,
          correlationId,
        }),
      );

      if (!response.success) {
        const errorInfo =
          this.errorCodeMap[response.code!] || this.errorCodeMap['DEACTIVATION_FAILED'];
        this.logger.error(`User deactivation failed: ${response.error} - Code: ${response.code}`);

        // Special handling for different error types
        if (
          response.code === 'CANNOT_DEACTIVATE_SELF' ||
          response.code === 'CANNOT_DEACTIVATE_LAST_OWNER'
        ) {
          throw new ForbiddenException({
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          });
        }

        if (response.code === 'USER_ALREADY_DEACTIVATED') {
          throw new BadRequestException({
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          });
        }

        if (response.code === 'USER_NOT_FOUND') {
          throw new NotFoundException({
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          });
        }

        throw new BadRequestException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      // Invalidate all user sessions via auth-service
      try {
        await firstValueFrom(
          this.authServiceGrpc.invalidateUserSessions({
            userId,
            reason: 'USER_DEACTIVATED',
            invalidatedBy: session.userId,
            correlationId,
          }),
        );
        this.logger.log(`Sessions invalidated for user ${userId}`);
      } catch (sessionError) {
        // Log error but don't fail the deactivation
        this.logger.warn(
          `Failed to invalidate sessions for user ${userId}: ${sessionError.message}`,
        );
      }

      return {
        success: true,
        message: 'user.deactivate.success',
        data: {
          userId: response.userId!,
          fullName: response.fullName!,
          email: response.email!,
          isActive: response.isActive!,
          deactivatedAt: response.deactivatedAt!,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`User deactivation failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }

  async reactivateUser(
    userId: string,
    sessionToken: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ) {
    // Validate session and get user info
    const session = await this.validateSession(sessionToken, correlationId);

    // Get user profile to check role
    const userProfile = await this.getUserProfile(session.userId, correlationId);

    // Check if user is company owner
    if (userProfile.role.code !== 'COMPANY_OWNER') {
      this.logger.warn(
        `Insufficient permissions for user ${session.userId} - Role: ${userProfile.role.code}`,
      );
      throw new ForbiddenException({
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // Reactivate user via user-service
    try {
      const response: ReactivateUserResponse = await firstValueFrom(
        this.userServiceGrpc.reactivateUser({
          userId,
          actorId: session.userId,
          tenantId: session.tenantId,
          ipAddress,
          userAgent,
          correlationId,
        }),
      );

      if (!response.success) {
        const errorInfo =
          this.errorCodeMap[response.code!] || this.errorCodeMap['REACTIVATION_FAILED'];
        this.logger.error(`User reactivation failed: ${response.error} - Code: ${response.code}`);

        if (response.code === 'USER_ALREADY_ACTIVE') {
          throw new BadRequestException({
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          });
        }

        if (response.code === 'USER_NOT_FOUND') {
          throw new NotFoundException({
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          });
        }

        throw new BadRequestException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      return {
        success: true,
        message: 'user.reactivate.success',
        data: {
          userId: response.userId!,
          fullName: response.fullName!,
          email: response.email!,
          isActive: response.isActive!,
          reactivatedAt: response.reactivatedAt!,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`User reactivation failed: ${error.message}`, error.stack);
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
          throw new UnauthorizedException({
            success: false,
            error: 'error.userNotFound',
            code: 'USER_NOT_FOUND',
          });
        }
        if (response.code === 'USER_INACTIVE') {
          throw new ForbiddenException({
            success: false,
            error: 'error.accountInactive',
            code: 'USER_INACTIVE',
          });
        }
        throw new InternalServerErrorException({
          success: false,
          error: 'error.serviceUnavailable',
          code: 'SERVICE_UNAVAILABLE',
        });
      }

      return response.user!;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
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

  async getUserNames(
    userIds: string[],
    tenantId: string,
    correlationId: string,
  ): Promise<Array<{ id: string; fullName: string }>> {
    try {
      const response: {
        success: boolean;
        users?: Array<{ id: string; fullName: string }>;
        error?: string;
        code?: string;
      } = await firstValueFrom(
        this.userServiceGrpc.getUserNames({
          userIds,
          tenantId,
          correlationId,
        }),
      );

      if (!response.success) {
        const errorInfo = this.errorCodeMap[response.code!] || this.errorCodeMap['INTERNAL_ERROR'];
        this.logger.error(`Get user names failed: ${response.error} - Code: ${response.code}`);

        if (response.code === 'INVALID_USER_IDS') {
          throw new BadRequestException({
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
          });
        }

        throw new InternalServerErrorException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      return response.users!;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Get user names failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        success: false,
        error: 'error.serviceUnavailable',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
  }
}
