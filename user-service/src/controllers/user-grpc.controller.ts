import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { EventPublisherService } from '../events/event-publisher.service';
import {
  CheckEmailExistsRequestDto,
  CheckEmailExistsResponseDto,
  CreateUserRequestDto,
  CreateUserResponseDto,
  AssignRoleRequestDto,
  AssignRoleResponseDto,
  FindByEmailRequestDto,
  FindByEmailResponseDto,
  FindByIdRequestDto,
  FindByIdResponseDto,
  ActivateUserRequestDto,
  ActivateUserResponseDto,
  UpdatePasswordRequestDto,
  UpdatePasswordResponseDto,
  GetUserProfileRequestDto,
  GetUserProfileResponseDto,
  GetOwnerByTenantRequestDto,
  GetOwnerByTenantResponseDto,
  UpdateLanguagePreferenceRequestDto,
  UpdateLanguagePreferenceResponseDto,
  GetRolesRequestDto,
  GetRolesResponseDto,
  CreateUserByOwnerRequestDto,
  CreateUserByOwnerResponseDto,
  ListUsersRequestDto,
  ListUsersResponseDto,
  GetUserDetailsRequestDto,
  GetUserDetailsResponseDto,
  UpdateUserRoleRequestDto,
  UpdateUserRoleResponseDto,
  UpdateUserProfileRequestDto,
  UpdateUserProfileResponseDto,
  DeactivateUserRequestDto,
  DeactivateUserResponseDto,
  ReactivateUserRequestDto,
  ReactivateUserResponseDto,
  GetUserNamesRequestDto,
  GetUserNamesResponseDto,
} from '../dto/grpc.dto';

@Controller()
export class UserGrpcController {
  private readonly logger = new Logger(UserGrpcController.name);

  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  /**
   * Check if email exists in the system
   */
  @GrpcMethod('UserService', 'CheckEmailExists')
  async checkEmailExists(
    data: CheckEmailExistsRequestDto,
  ): Promise<CheckEmailExistsResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Checking email existence: ${data.email}`,
      );

      const exists = await this.userService.checkEmailExists(data.email);

      return {
        success: true,
        exists,
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error checking email existence: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Failed to check email existence',
        code: 'EMAIL_CHECK_FAILED',
      };
    }
  }

  /**
   * Create a new user
   */
  @GrpcMethod('UserService', 'CreateUser')
  async createUser(
    data: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Creating user with email: ${data.email}`,
      );

      const user = await this.userService.createUser(data);

      return {
        success: true,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error creating user: ${error.message}`,
        error.stack,
      );

      let errorCode = 'USER_CREATION_FAILED';
      if (error.message?.includes('already exists')) {
        errorCode = 'EMAIL_ALREADY_EXISTS';
      }

      return {
        success: false,
        error: error.message || 'Failed to create user',
        code: errorCode,
      };
    }
  }

  /**
   * Assign a role to a user
   */
  @GrpcMethod('UserService', 'AssignRole')
  async assignRole(
    data: AssignRoleRequestDto,
  ): Promise<AssignRoleResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Assigning role ${data.roleCode} to user ${data.userId}`,
      );

      await this.userService.assignRole(data);

      return {
        success: true,
        userId: data.userId,
        roleCode: data.roleCode,
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error assigning role: ${error.message}`,
        error.stack,
      );

      let errorCode = 'ROLE_ASSIGNMENT_FAILED';
      if (error.message?.includes('not found')) {
        errorCode = error.message.includes('User')
          ? 'USER_NOT_FOUND'
          : 'ROLE_NOT_FOUND';
      }

      return {
        success: false,
        error: error.message || 'Failed to assign role',
        code: errorCode,
      };
    }
  }

  /**
   * Find user by email with activation status (supports both P1UC02 and P2UC01)
   */
  @GrpcMethod('UserService', 'FindByEmail')
  async findByEmail(
    data: FindByEmailRequestDto,
  ): Promise<FindByEmailResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Finding user by email: ${data.email}`,
      );

      const user = await this.userService.findByEmail(data.email);

      if (!user) {
        return {
          success: true,
          user: null,
        };
      }

      return {
        success: true,
        user: {
          userId: user.id,
          email: user.email,
          isActive: user.isActive,
          languagePreference: user.languagePreference,
          fullName: user.fullName,
          tenantId: user.tenantId,
          passwordHash: user.passwordHash,
          emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null,
          passwordChangedAt: user.passwordChangedAt?.toISOString() || null,
          deactivatedAt: user.deactivatedAt?.toISOString() || null,
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error finding user by email: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Failed to find user',
        code: 'USER_LOOKUP_FAILED',
      };
    }
  }

  /**
   * Find user by ID (P1UC03)
   */
  @GrpcMethod('UserService', 'FindById')
  async findById(
    data: FindByIdRequestDto,
  ): Promise<FindByIdResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Finding user by ID: ${data.userId}`,
      );

      const user = await this.userService.findById(data.userId);

      if (!user) {
        return {
          success: true,
          user: null,
        };
      }

      return {
        success: true,
        user: {
          userId: user.id,
          email: user.email,
          isActive: user.isActive,
          languagePreference: user.languagePreference,
          fullName: user.fullName,
          tenantId: user.tenantId,
          passwordChangedAt: user.passwordChangedAt?.toISOString() || null,
          deactivatedAt: user.deactivatedAt?.toISOString() || null,
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error finding user by ID: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Failed to find user',
        code: 'USER_LOOKUP_FAILED',
      };
    }
  }

  /**
   * Activate user account (P1UC03)
   */
  @GrpcMethod('UserService', 'ActivateUser')
  async activateUser(
    data: ActivateUserRequestDto,
  ): Promise<ActivateUserResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Activating user: ${data.userId}`,
      );

      // Safely parse emailVerifiedAt - only use if it's a valid date string
      let emailVerifiedAt: Date | undefined = undefined;
      if (data.emailVerifiedAt && data.emailVerifiedAt.trim()) {
        const parsedDate = new Date(data.emailVerifiedAt);
        if (!isNaN(parsedDate.getTime())) {
          emailVerifiedAt = parsedDate;
        }
      }
      
      const user = await this.userService.activateUser(data.userId, emailVerifiedAt);

      return {
        success: true,
        userId: user.id,
        email: user.email,
        isActive: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() || new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error activating user: ${error.message}`,
        error.stack,
      );

      let errorCode = 'USER_ACTIVATION_FAILED';
      if (error.message?.includes('not found')) {
        errorCode = 'USER_NOT_FOUND';
      }

      return {
        success: false,
        error: error.message || 'Failed to activate user',
        code: errorCode,
      };
    }
  }

  /**
   * Update user password (P2UC02)
   */
  @GrpcMethod('UserService', 'UpdatePassword')
  async updatePassword(
    data: UpdatePasswordRequestDto,
  ): Promise<UpdatePasswordResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Updating password for user: ${data.userId}`,
      );

      const passwordChangedAt = new Date(data.passwordChangedAt);
      const user = await this.userService.updatePassword(
        data.userId,
        data.newPasswordHash,
        passwordChangedAt,
      );

      return {
        success: true,
        userId: user.id,
        passwordChangedAt: user.passwordChangedAt?.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error updating password: ${error.message}`,
        error.stack,
      );

      let errorCode = 'PASSWORD_UPDATE_FAILED';
      if (error.message?.includes('not found')) {
        errorCode = 'USER_NOT_FOUND';
      }

      return {
        success: false,
        error: error.message || 'Failed to update password',
        code: errorCode,
      };
    }
  }

  /**
   * Get user profile with role information (P3UC01)
   */
  @GrpcMethod('UserService', 'GetUserProfile')
  async getUserProfile(
    data: GetUserProfileRequestDto,
  ): Promise<GetUserProfileResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Fetching user profile for: ${data.userId}`,
      );

      const { user, role } = await this.userService.getUserProfile(data.userId);

      return {
        success: true,
        user: {
          id: user.id,
          tenantId: user.tenantId,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          languagePreference: user.languagePreference,
          isActive: user.isActive,
          role: {
            code: role.code,
            name: role.name,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error fetching user profile: ${error.message}`,
        error.stack,
      );

      let errorCode = 'USER_PROFILE_FETCH_FAILED';
      if (error.message?.includes('not found')) {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message === 'USER_INACTIVE') {
        errorCode = 'USER_INACTIVE';
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch user profile',
        code: errorCode,
      };
    }
  }

  /**
   * Get company owner by tenant ID (P3UC01)
   */
  @GrpcMethod('UserService', 'GetOwnerByTenant')
  async getOwnerByTenant(
    data: GetOwnerByTenantRequestDto,
  ): Promise<GetOwnerByTenantResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Fetching owner for tenant: ${data.tenantId}`,
      );

      const { user, role } = await this.userService.getOwnerByTenant(data.tenantId);

      return {
        success: true,
        user: {
          id: user.id,
          tenantId: user.tenantId,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          languagePreference: user.languagePreference,
          isActive: user.isActive,
          role: {
            code: role.code,
            name: role.name,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error fetching owner by tenant: ${error.message}`,
        error.stack,
      );

      let errorCode = 'OWNER_FETCH_FAILED';
      if (error.message?.includes('not found')) {
        errorCode = 'OWNER_NOT_FOUND';
      } else if (error.message === 'USER_INACTIVE') {
        errorCode = 'USER_INACTIVE';
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch owner',
        code: errorCode,
      };
    }
  }

  /**
   * Update user language preference (P3UC02)
   */
  @GrpcMethod('UserService', 'UpdateLanguagePreference')
  async updateLanguagePreference(
    data: UpdateLanguagePreferenceRequestDto,
  ): Promise<UpdateLanguagePreferenceResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Updating language preference for user ${data.userId} to ${data.languagePreference}`,
      );

      // Get old language preference before update
      const userBefore = await this.userService.findById(data.userId);
      const oldLanguage = userBefore?.languagePreference || 'en';

      // Update language preference
      const result = await this.userService.updateLanguagePreference(
        data.userId,
        data.tenantId,
        data.languagePreference,
      );

      // Publish user.languageChanged event
      await this.eventPublisher.publishEvent(
        'user.language.changed',
        {
          eventType: 'user.languageChanged',
          eventId: require('crypto').randomUUID(),
          version: 'v1.0.0',
          timestamp: new Date().toISOString(),
          correlationId: data.correlationId,
          data: {
            userId: result.userId,
            tenantId: data.tenantId,
            email: userBefore?.email || '',
            oldLanguage: oldLanguage as 'en' | 'fa',
            newLanguage: result.languagePreference,
            updatedAt: result.updatedAt.toISOString(),
          },
        },
        data.correlationId,
      );

      return {
        success: true,
        user: {
          userId: result.userId,
          languagePreference: result.languagePreference,
          updatedAt: result.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error updating language preference: ${error.message}`,
        error.stack,
      );

      let errorCode = 'LANGUAGE_UPDATE_FAILED';
      if (error.message === 'INVALID_LANGUAGE') {
        errorCode = 'INVALID_LANGUAGE';
      } else if (error.message === 'USER_NOT_FOUND') {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message?.includes('Database')) {
        errorCode = 'DATABASE_ERROR';
      }

      return {
        success: false,
        error: error.message || 'Failed to update language preference',
        code: errorCode,
      };
    }
  }

  /**
   * Get all roles (P4UC01)
   */
  @GrpcMethod('UserService', 'GetRoles')
  async getRoles(
    data: GetRolesRequestDto,
  ): Promise<GetRolesResponseDto> {
    try {
      this.logger.log(`[${data.correlationId}] Fetching all roles`);

      const roles = await this.roleService.getAllRoles();

      return {
        success: true,
        roles: roles.map((role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
        })),
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error fetching roles: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Failed to fetch roles',
        code: 'ROLES_FETCH_FAILED',
      };
    }
  }

  /**
   * Create user by company owner (P4UC01)
   */
  @GrpcMethod('UserService', 'CreateUserByOwner')
  async createUserByOwner(
    data: CreateUserByOwnerRequestDto,
  ): Promise<CreateUserByOwnerResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Creating user by owner: ${data.email}`,
      );

      // Generate temporary password and hash
      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');
      const temporaryPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      // Create user with role
      const user = await this.userService.createUserByOwner(
        data.fullName,
        data.email,
        data.phoneNumber,
        data.roleCode,
        data.tenantId,
        data.createdBy,
        passwordHash,
        data.createdByLanguage as 'en' | 'fa',
      );

      // Publish user.created event
      await this.eventPublisher.publishUserCreated({
        eventType: 'user.created',
        eventId: crypto.randomUUID(),
        version: 'v1.0.0',
        timestamp: new Date().toISOString(),
        correlationId: data.correlationId,
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          tenantId: user.tenantId,
          roleCode: data.roleCode,
          temporaryPassword,
          phoneNumber: user.phoneNumber || undefined,
          createdBy: data.createdBy,
          createdByLanguage: data.createdByLanguage,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      return {
        success: true,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error creating user by owner: ${error.message}`,
        error.stack,
      );

      let errorCode = 'USER_CREATION_FAILED';
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        errorCode = 'EMAIL_ALREADY_EXISTS';
      } else if (error.message?.includes('Role') && error.message?.includes('not found')) {
        errorCode = 'ROLE_NOT_FOUND';
      } else if (error.message?.includes('not found')) {
        errorCode = 'USER_NOT_FOUND';
      }

      return {
        success: false,
        error: error.message || 'Failed to create user by owner',
        code: errorCode,
      };
    }
  }

  /**
   * List users with pagination and filters (P4UC02)
   */
  @GrpcMethod('UserService', 'ListUsers')
  async listUsers(
    data: ListUsersRequestDto,
  ): Promise<ListUsersResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Listing users for tenant: ${data.tenantId} (page ${data.page}, limit ${data.limit})`,
      );

      const result = await this.userService.listUsers(
        data.tenantId,
        data.page,
        data.limit,
        data.search,
        data.status,
        data.roleCode,
      );

      // Calculate pagination
      const totalPages = Math.ceil(result.total / data.limit);
      const hasNext = data.page < totalPages;
      const hasPrev = data.page > 1;

      return {
        success: true,
        users: result.users.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: {
            code: user.role.code,
            name: user.role.name,
          },
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
        })),
        pagination: {
          total: result.total,
          page: data.page,
          limit: data.limit,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error listing users: ${error.message}`,
        error.stack,
      );

      let errorCode = 'USERS_RETRIEVAL_FAILED';
      if (error.message === 'INVALID_PAGE_NUMBER') {
        errorCode = 'INVALID_PAGE_NUMBER';
      } else if (error.message === 'INVALID_LIMIT') {
        errorCode = 'INVALID_LIMIT';
      } else if (error.message === 'SEARCH_TOO_SHORT') {
        errorCode = 'SEARCH_TOO_SHORT';
      } else if (error.message === 'INVALID_STATUS_FILTER') {
        errorCode = 'INVALID_STATUS_FILTER';
      } else if (error.message?.includes('database')) {
        errorCode = 'DATABASE_ERROR';
      }

      return {
        success: false,
        error: error.message || 'Failed to list users',
        code: errorCode,
      };
    }
  }

  /**
   * Get user details (P4UC02)
   */
  @GrpcMethod('UserService', 'GetUserDetails')
  async getUserDetails(
    data: GetUserDetailsRequestDto,
  ): Promise<GetUserDetailsResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Getting details for user: ${data.userId}`,
      );

      const user = await this.userService.getUserDetails(
        data.userId,
        data.tenantId,
      );

      return {
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          languagePreference: user.languagePreference,
          role: {
            code: user.role.code,
            name: user.role.name,
            description: user.role.description,
          },
          isActive: user.isActive,
          emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
          passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error getting user details: ${error.message}`,
        error.stack,
      );

      let errorCode = 'USER_DETAILS_RETRIEVAL_FAILED';
      if (error.message === 'USER_NOT_FOUND') {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message?.includes('cross-tenant') || error.message?.includes('CROSS_TENANT')) {
        errorCode = 'CROSS_TENANT_ACCESS';
      } else if (error.message?.includes('database')) {
        errorCode = 'DATABASE_ERROR';
      }

      return {
        success: false,
        error: error.message || 'Failed to get user details',
        code: errorCode,
      };
    }
  }

  /**
   * Update user role (P4UC03)
   */
  @GrpcMethod('UserService', 'UpdateUserRole')
  async updateUserRole(
    data: UpdateUserRoleRequestDto,
  ): Promise<UpdateUserRoleResponseDto> {
    this.logger.log(
      `[${data.correlationId}] UpdateUserRole request: userId=${data.userId}, newRoleCode=${data.newRoleCode}, actorId=${data.actorId}`,
    );

    try {
      const result = await this.userService.updateUserRole(
        data.userId,
        data.newRoleCode,
        data.actorId,
        data.tenantId,
      );

      // Publish user.roleModified event
      await this.eventPublisher.publishUserRoleModified({
        eventType: 'user.roleModified',
        eventId: crypto.randomUUID(),
        version: 'v1.0.0',
        timestamp: new Date().toISOString(),
        correlationId: data.correlationId,
        data: {
          userId: result.userId,
          email: result.email,
          fullName: result.fullName,
          tenantId: data.tenantId,
          oldRoleCode: result.oldRole.code,
          oldRoleName: result.oldRole.name,
          newRoleCode: result.newRole.code,
          newRoleName: result.newRole.name,
          modifiedBy: data.actorId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          updatedAt: result.updatedAt.toISOString(),
        },
      });

      return {
        success: true,
        userId: result.userId,
        fullName: result.fullName,
        email: result.email,
        oldRole: result.oldRole,
        newRole: result.newRole,
        updatedAt: result.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error updating user role: ${error.message}`,
        error.stack,
      );

      let errorCode = 'ROLE_UPDATE_FAILED';
      if (error.message === 'SELF_ROLE_MODIFICATION') {
        errorCode = 'SELF_ROLE_MODIFICATION';
      } else if (error.message === 'OWNER_ROLE_PROTECTED') {
        errorCode = 'OWNER_ROLE_PROTECTED';
      } else if (error.message === 'CROSS_TENANT_ACCESS') {
        errorCode = 'CROSS_TENANT_ACCESS';
      } else if (error.message === 'USER_NOT_FOUND') {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message === 'INVALID_ROLE_CODE') {
        errorCode = 'INVALID_ROLE_CODE';
      } else if (error.message === 'INSUFFICIENT_PERMISSIONS') {
        errorCode = 'INSUFFICIENT_PERMISSIONS';
      } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
        errorCode = 'RATE_LIMIT_EXCEEDED';
      } else if (error.message?.includes('database')) {
        errorCode = 'ROLE_UPDATE_FAILED';
      }

      const response: UpdateUserRoleResponseDto = {
        success: false,
        error: error.message || 'Failed to update user role',
        code: errorCode,
      };

      // Add retryAfter for rate limit errors
      if (errorCode === 'RATE_LIMIT_EXCEEDED' && (error as any).retryAfter) {
        (response as any).retryAfter = (error as any).retryAfter;
      }

      return response;
    }
  }

  /**
   * Update user profile (P4UC04)
   */
  @GrpcMethod('UserService', 'UpdateUserProfile')
  async updateUserProfile(
    data: UpdateUserProfileRequestDto,
  ): Promise<UpdateUserProfileResponseDto> {
    this.logger.log(
      `[${data.correlationId}] UpdateUserProfile request: userId=${data.userId}, actorId=${data.actorId}`,
    );

    try {
      const result = await this.userService.updateUserProfile(
        data.userId,
        data.tenantId,
        data.fullName,
        data.email,
        data.phoneNumber,
        data.actorId,
      );

      // Publish user.profileUpdated event
      const eventPayload: any = {
        eventType: 'user.profileUpdated',
        eventId: crypto.randomUUID(),
        version: 'v1.0.0',
        timestamp: new Date().toISOString(),
        correlationId: data.correlationId,
        data: {
          userId: result.userId,
          tenantId: data.tenantId,
          email: result.email,
          fullName: result.fullName,
          phoneNumber: result.phoneNumber,
          languagePreference: result.languagePreference,
          changedFields: result.changedFields,
          oldValues: result.oldValues,
          newValues: result.newValues,
          emailChanged: result.emailChanged,
          modifiedBy: data.actorId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          updatedAt: result.updatedAt.toISOString(),
        },
      };

      // If email changed, generate verification token
      if (result.emailChanged) {
        const verificationToken = crypto.randomUUID();
        const verificationTokenExpiresAt = new Date();
        verificationTokenExpiresAt.setHours(verificationTokenExpiresAt.getHours() + 24);
        
        eventPayload.data.verificationToken = verificationToken;
        eventPayload.data.verificationTokenExpiresAt = verificationTokenExpiresAt.toISOString();
      }

      await this.eventPublisher.publishEvent(
        'user.profile.updated',
        eventPayload,
        data.correlationId,
      );

      return {
        success: true,
        userId: result.userId,
        fullName: result.fullName,
        email: result.email,
        phoneNumber: result.phoneNumber,
        languagePreference: result.languagePreference,
        changedFields: result.changedFields,
        oldValues: result.oldValues,
        newValues: result.newValues,
        emailChanged: result.emailChanged,
        updatedAt: result.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error updating user profile: ${error.message}`,
        error.stack,
      );

      let errorCode = 'PROFILE_UPDATE_FAILED';
      if (error.message === 'USER_NOT_FOUND') {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message === 'CROSS_TENANT_ACCESS') {
        errorCode = 'CROSS_TENANT_ACCESS';
      } else if (error.message === 'NO_CHANGES') {
        errorCode = 'NO_CHANGES';
      } else if (error.message === 'EMAIL_ALREADY_EXISTS') {
        errorCode = 'EMAIL_ALREADY_EXISTS';
      } else if (error.message?.includes('fullName') || error.message?.includes('FULL_NAME')) {
        errorCode = 'INVALID_FULL_NAME';
      } else if (error.message?.includes('email') || error.message?.includes('EMAIL')) {
        errorCode = 'INVALID_EMAIL_FORMAT';
      } else if (error.message?.includes('phone') || error.message?.includes('PHONE')) {
        errorCode = 'INVALID_PHONE_FORMAT';
      } else if (error.message?.includes('database')) {
        errorCode = 'DATABASE_ERROR';
      }

      return {
        success: false,
        error: error.message || 'Failed to update user profile',
        code: errorCode,
      };
    }
  }

  /**
   * Deactivate user account
   */
  @GrpcMethod('UserService', 'DeactivateUser')
  async deactivateUser(
    data: DeactivateUserRequestDto,
  ): Promise<DeactivateUserResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Deactivating user ${data.userId} by ${data.actorId}`,
      );

      const result = await this.userService.deactivateUser(
        data.userId,
        data.actorId,
        data.tenantId,
        data.reason,
      );

      // Publish user.deactivated event
      await this.eventPublisher.publishEvent(
        'user.deactivated',
        {
          eventType: 'user.deactivated',
          eventId: crypto.randomUUID(),
          version: 'v1.0.0',
          timestamp: new Date().toISOString(),
          correlationId: data.correlationId,
          data: {
            userId: result.userId,
            email: result.email,
            fullName: result.fullName,
            tenantId: data.tenantId,
            languagePreference: result.languagePreference,
            deactivatedBy: result.deactivatedBy,
            deactivatedAt: result.deactivatedAt.toISOString(),
            reason: data.reason,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          },
        },
        data.correlationId,
      );

      return {
        success: true,
        userId: result.userId,
        fullName: result.fullName,
        email: result.email,
        languagePreference: result.languagePreference,
        isActive: result.isActive,
        deactivatedAt: result.deactivatedAt.toISOString(),
        deactivatedBy: result.deactivatedBy,
        reason: data.reason,
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error deactivating user: ${error.message}`,
        error.stack,
      );

      let errorCode = 'DEACTIVATION_FAILED';
      if (error.message === 'USER_NOT_FOUND') {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message === 'CROSS_TENANT_ACCESS') {
        errorCode = 'CROSS_TENANT_ACCESS';
      } else if (error.message === 'CANNOT_DEACTIVATE_SELF') {
        errorCode = 'CANNOT_DEACTIVATE_SELF';
      } else if (error.message === 'CANNOT_DEACTIVATE_LAST_OWNER') {
        errorCode = 'CANNOT_DEACTIVATE_LAST_OWNER';
      } else if (error.message === 'USER_ALREADY_DEACTIVATED') {
        errorCode = 'USER_ALREADY_DEACTIVATED';
      } else if (error.message?.includes('database')) {
        errorCode = 'DATABASE_ERROR';
      }

      return {
        success: false,
        error: error.message || 'Failed to deactivate user',
        code: errorCode,
      };
    }
  }

  /**
   * Reactivate user account
   */
  @GrpcMethod('UserService', 'ReactivateUser')
  async reactivateUser(
    data: ReactivateUserRequestDto,
  ): Promise<ReactivateUserResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Reactivating user ${data.userId} by ${data.actorId}`,
      );

      const result = await this.userService.reactivateUser(
        data.userId,
        data.actorId,
        data.tenantId,
      );

      // Publish user.reactivated event
      await this.eventPublisher.publishEvent(
        'user.reactivated',
        {
          eventType: 'user.reactivated',
          eventId: crypto.randomUUID(),
          version: 'v1.0.0',
          timestamp: new Date().toISOString(),
          correlationId: data.correlationId,
          data: {
            userId: result.userId,
            email: result.email,
            fullName: result.fullName,
            tenantId: data.tenantId,
            languagePreference: result.languagePreference,
            reactivatedBy: result.reactivatedBy,
            reactivatedAt: result.reactivatedAt.toISOString(),
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          },
        },
        data.correlationId,
      );

      return {
        success: true,
        userId: result.userId,
        fullName: result.fullName,
        email: result.email,
        languagePreference: result.languagePreference,
        isActive: result.isActive,
        reactivatedAt: result.reactivatedAt.toISOString(),
        reactivatedBy: result.reactivatedBy,
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error reactivating user: ${error.message}`,
        error.stack,
      );

      let errorCode = 'REACTIVATION_FAILED';
      if (error.message === 'USER_NOT_FOUND') {
        errorCode = 'USER_NOT_FOUND';
      } else if (error.message === 'CROSS_TENANT_ACCESS') {
        errorCode = 'CROSS_TENANT_ACCESS';
      } else if (error.message === 'USER_ALREADY_ACTIVE') {
        errorCode = 'USER_ALREADY_ACTIVE';
      } else if (error.message?.includes('database')) {
        errorCode = 'DATABASE_ERROR';
      }

      return {
        success: false,
        error: error.message || 'Failed to reactivate user',
        code: errorCode,
      };
    }
  }

  /**
   * Get user names by IDs (P6UC03)
   */
  @GrpcMethod('UserService', 'GetUserNames')
  async getUserNames(
    data: GetUserNamesRequestDto,
  ): Promise<GetUserNamesResponseDto> {
    try {
      this.logger.log(
        `[${data.correlationId}] Getting names for ${data.userIds.length} users`,
      );

      const users = await this.userService.getUserNames(
        data.userIds,
        data.tenantId,
      );

      return {
        success: true,
        users: users.map(user => ({
          id: user.id,
          fullName: user.fullName,
        })),
      };
    } catch (error) {
      this.logger.error(
        `[${data.correlationId}] Error getting user names: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        error: error.message || 'Failed to get user names',
        code: 'DATABASE_ERROR',
      };
    }
  }
}
