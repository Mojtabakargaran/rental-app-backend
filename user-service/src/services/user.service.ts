import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { RoleService } from './role.service';
import { RedisService } from './redis.service';
import {
  CreateUserRequestDto,
  AssignRoleRequestDto,
} from '../dto/grpc.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly roleService: RoleService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Check if an email exists in the system
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const count = await this.userRepository.count({
        where: { email: normalizedEmail },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(
        `Error checking email existence: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(dto: CreateUserRequestDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const normalizedEmail = dto.email.toLowerCase().trim();

      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Create user entity
      const user = this.userRepository.create({
        fullName: dto.fullName,
        email: normalizedEmail,
        passwordHash: dto.passwordHash,
        phoneNumber: dto.phoneNumber || null,
        tenantId: dto.tenantId,
        languagePreference: dto.languagePreference,
        isActive: false, // User is inactive until email verification
        emailVerifiedAt: null,
        passwordChangedAt: new Date(), // Owner set their own password during registration
      });

      // Save user
      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      this.logger.log(`User created successfully: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error creating user: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRole(dto: AssignRoleRequestDto): Promise<UserRole> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }

      // Verify tenant match
      if (user.tenantId !== dto.tenantId) {
        throw new BadRequestException('User does not belong to the specified tenant');
      }

      // Get role by code
      const role = await this.roleService.getByCodeOrFail(dto.roleCode);

      // Check if role already assigned
      const existingUserRole = await this.userRoleRepository.findOne({
        where: {
          userId: dto.userId,
          roleId: role.id,
          tenantId: dto.tenantId,
        },
      });

      if (existingUserRole) {
        // Role already assigned, return existing
        await queryRunner.commitTransaction();
        return existingUserRole;
      }

      // Create user role
      const userRole = this.userRoleRepository.create({
        userId: dto.userId,
        roleId: role.id,
        tenantId: dto.tenantId,
        assignedBy: null, // System assignment
      });

      const savedUserRole = await queryRunner.manager.save(userRole);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Role ${dto.roleCode} assigned to user ${dto.userId} in tenant ${dto.tenantId}`,
      );
      return savedUserRole;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error assigning role: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Error finding user by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      return await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Activate user account (P1UC03, P4UC06)
   */
  async activateUser(userId: string, emailVerifiedAt?: Date): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.isActive) {
        // User is already active, return without changes
        await queryRunner.commitTransaction();
        return user;
      }

      // Activate user and set email verification timestamp
      user.isActive = true;
      user.emailVerifiedAt = emailVerifiedAt || new Date();

      const updatedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      this.logger.log(`User activated successfully: ${userId}`);
      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error activating user: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update user password (P2UC02)
   */
  async updatePassword(
    userId: string,
    newPasswordHash: string,
    passwordChangedAt: Date,
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      user.passwordHash = newPasswordHash;
      user.passwordChangedAt = passwordChangedAt;

      const updatedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      this.logger.log(`Password updated successfully for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error updating password: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get user profile with role information (P3UC01)
   */
  async getUserProfile(userId: string): Promise<{
    user: User;
    role: { code: string; name: string };
  }> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (!user.isActive) {
        throw new BadRequestException('USER_INACTIVE');
      }

      // Get user's role via UserRole relation
      const userRole = await this.userRoleRepository.findOne({
        where: { userId: user.id },
        relations: ['role'],
      });

      if (!userRole) {
        throw new NotFoundException('User role not found');
      }

      return {
        user,
        role: {
          code: userRole.role.code,
          name: userRole.role.name,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching user profile: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get owner (COMPANY_OWNER) by tenant ID (P3UC01)
   */
  async getOwnerByTenant(tenantId: string): Promise<{
    user: User;
    role: { code: string; name: string };
  }> {
    try {
      // Find COMPANY_OWNER role
      const ownerRole = await this.roleService.findByCode('COMPANY_OWNER');
      
      if (!ownerRole) {
        throw new NotFoundException('COMPANY_OWNER role not found');
      }

      // Find user role assignment for this tenant with COMPANY_OWNER role
      const userRole = await this.userRoleRepository.findOne({
        where: {
          tenantId,
          roleId: ownerRole.id,
        },
        relations: ['user', 'role'],
      });

      if (!userRole || !userRole.user) {
        throw new NotFoundException('Company owner not found for tenant');
      }

      if (!userRole.user.isActive) {
        throw new BadRequestException('USER_INACTIVE');
      }

      return {
        user: userRole.user,
        role: {
          code: userRole.role.code,
          name: userRole.role.name,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error fetching owner by tenant: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update user language preference (P3UC02)
   */
  async updateLanguagePreference(
    userId: string,
    tenantId: string,
    languagePreference: 'en' | 'fa',
  ): Promise<{ userId: string; languagePreference: 'en' | 'fa'; updatedAt: Date }> {
    try {
      // Validate language code
      if (!['en', 'fa'].includes(languagePreference)) {
        throw new BadRequestException('INVALID_LANGUAGE');
      }

      // Find user with tenant isolation
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId },
      });

      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }

      // Update language preference
      user.languagePreference = languagePreference;
      user.updatedAt = new Date();

      const savedUser = await this.userRepository.save(user);

      this.logger.log(
        `Language preference updated for user ${userId} to ${languagePreference}`,
      );

      return {
        userId: savedUser.id,
        languagePreference: savedUser.languagePreference as 'en' | 'fa',
        updatedAt: savedUser.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Error updating language preference: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create user with role by company owner (P4UC01)
   */
  async createUserByOwner(
    fullName: string,
    email: string,
    phoneNumber: string | undefined,
    roleCode: string,
    tenantId: string,
    createdBy: string,
    passwordHash: string,
    languagePreference: 'en' | 'fa',
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('EMAIL_ALREADY_EXISTS');
      }

      // Validate role
      const role = await this.roleService.getByCodeOrFail(roleCode);

      // Create user entity
      const user = this.userRepository.create({
        fullName,
        email: normalizedEmail,
        passwordHash,
        phoneNumber: phoneNumber || null,
        tenantId,
        languagePreference, // Inherited from creator (owner)
        isActive: true, // Active immediately (P4UC01)
        emailVerifiedAt: new Date(), // Verified automatically when created by owner (BR5)
        passwordChangedAt: null, // Force password change on first login (P4UC06)
      });

      // Save user
      const savedUser = await queryRunner.manager.save(user);

      // Assign role
      const userRole = this.userRoleRepository.create({
        userId: savedUser.id,
        roleId: role.id,
        tenantId,
        assignedBy: createdBy,
      });

      await queryRunner.manager.save(userRole);

      await queryRunner.commitTransaction();

      this.logger.log(
        `User created by owner: ${savedUser.id} with role ${roleCode}`,
      );

      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error creating user by owner: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * List users with pagination and filters (P4UC02)
   */
  async listUsers(
    tenantId: string,
    page: number,
    limit: number,
    search?: string,
    status?: string,
    roleCode?: string,
  ): Promise<{
    users: Array<{
      id: string;
      fullName: string;
      email: string;
      phoneNumber: string | null;
      role: { code: string; name: string };
      isActive: boolean;
      emailVerifiedAt: Date | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    try {
      // Validate inputs
      if (page < 1) {
        throw new BadRequestException('INVALID_PAGE_NUMBER');
      }
      if (limit < 1 || limit > 100) {
        throw new BadRequestException('INVALID_LIMIT');
      }
      if (search && search.trim().length > 0 && search.trim().length < 2) {
        throw new BadRequestException('SEARCH_TOO_SHORT');
      }
      if (status && !['all', 'active', 'inactive'].includes(status)) {
        throw new BadRequestException('INVALID_STATUS_FILTER');
      }

      // Build query
      const queryBuilder = this.userRepository
        .createQueryBuilder('u')
        .innerJoin('u.userRoles', 'ur')
        .innerJoin('ur.role', 'r')
        .where('u.tenantId = :tenantId', { tenantId })
        .andWhere('u.deletedAt IS NULL');

      // Apply search filter
      if (search && search.trim().length >= 2) {
        const searchTerm = `%${search.trim()}%`;
        queryBuilder.andWhere(
          '(u.fullName ILIKE :search OR u.email ILIKE :search)',
          { search: searchTerm },
        );
      }

      // Apply status filter
      if (status && status !== 'all') {
        if (status === 'active') {
          queryBuilder.andWhere('u.isActive = :isActive', { isActive: true });
        } else if (status === 'inactive') {
          queryBuilder.andWhere('u.isActive = :isActive', { isActive: false });
        }
      }

      // Apply role filter
      if (roleCode) {
        queryBuilder.andWhere('r.code = :roleCode', { roleCode });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and ordering
      const offset = (page - 1) * limit;
      queryBuilder
        .orderBy('u.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .select([
          'u.id',
          'u.fullName',
          'u.email',
          'u.phoneNumber',
          'u.isActive',
          'u.emailVerifiedAt',
          'u.createdAt',
          'r.code',
          'r.name',
        ]);

      const rawResults = await queryBuilder.getRawMany();

      // Map results
      const mappedUsers = rawResults.map((row) => {
        return {
          id: row.u_id,
          fullName: row.u_full_name,
          email: row.u_email,
          phoneNumber: row.u_phone_number,
          role: {
            code: row.r_code,
            name: row.r_name,
          },
          isActive: row.u_is_active,
          emailVerifiedAt: row.u_email_verified_at,
          createdAt: row.u_created_at,
        };
      });

      this.logger.log(
        `Listed ${mappedUsers.length} users for tenant ${tenantId} (page ${page}, total ${total})`,
      );

      return {
        users: mappedUsers,
        total,
      };
    } catch (error) {
      this.logger.error(
        `Error listing users: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get user details with full information (P4UC02)
   */
  async getUserDetails(
    userId: string,
    tenantId: string,
  ): Promise<{
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    languagePreference: string;
    role: { code: string; name: string; description: string | null };
    isActive: boolean;
    emailVerifiedAt: Date | null;
    passwordChangedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      // Find user with tenant isolation
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId, deletedAt: IsNull() },
      });

      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }

      // Get user's role
      const userRole = await this.userRoleRepository.findOne({
        where: { userId: user.id, tenantId },
        relations: ['role'],
      });

      if (!userRole) {
        throw new NotFoundException('User role not found');
      }

      this.logger.log(`Retrieved details for user ${userId}`);

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        languagePreference: user.languagePreference,
        role: {
          code: userRole.role.code,
          name: userRole.role.name,
          description: userRole.role.description,
        },
        isActive: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt,
        passwordChangedAt: user.passwordChangedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Error getting user details: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update user role (P4UC03)
   */
  async updateUserRole(
    userId: string,
    newRoleCode: string,
    actorId: string,
    tenantId: string,
  ): Promise<{
    userId: string;
    fullName: string;
    email: string;
    oldRole: { code: string; name: string };
    newRole: { code: string; name: string };
    updatedAt: Date;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // BR2: Self-modification prevention
      if (actorId === userId) {
        throw new ForbiddenException('SELF_ROLE_MODIFICATION');
      }

      // Check rate limit (BR11)
      const rateLimitCheck = await this.redisService.checkRoleModificationRateLimit(tenantId);
      if (!rateLimitCheck.allowed) {
        const error = new BadRequestException('RATE_LIMIT_EXCEEDED');
        (error as any).retryAfter = rateLimitCheck.retryAfter;
        throw error;
      }

      // BR1: Verify actor is company owner
      const actorRole = await this.userRoleRepository.findOne({
        where: { userId: actorId, tenantId },
        relations: ['role'],
      });

      if (!actorRole || actorRole.role.code !== 'COMPANY_OWNER') {
        throw new ForbiddenException('INSUFFICIENT_PERMISSIONS');
      }

      // BR7: Verify target user exists and belongs to same tenant
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }

      if (user.tenantId !== tenantId) {
        throw new ForbiddenException('CROSS_TENANT_ACCESS');
      }

      // Get current user role
      const currentUserRole = await this.userRoleRepository.findOne({
        where: { userId, tenantId },
        relations: ['role'],
      });

      if (!currentUserRole) {
        throw new NotFoundException('USER_ROLE_NOT_FOUND');
      }

      // BR3: Company owner role protection
      if (currentUserRole.role.code === 'COMPANY_OWNER') {
        throw new ForbiddenException('OWNER_ROLE_PROTECTED');
      }

      // BR8: Validate new role code
      const validRoles = ['MANAGER', 'STAFF', 'MAINTENANCE', 'READ_ONLY'];
      if (!validRoles.includes(newRoleCode)) {
        throw new BadRequestException('INVALID_ROLE_CODE');
      }

      // Get new role
      const newRole = await this.roleService.findByCode(newRoleCode);
      if (!newRole) {
        throw new NotFoundException('ROLE_NOT_FOUND');
      }

      // Store old role info for response
      const oldRole = {
        code: currentUserRole.role.code,
        name: currentUserRole.role.name,
      };

      // BR10: Update role (atomic operation)
      currentUserRole.roleId = newRole.id;
      currentUserRole.role = newRole; // Update the relation object to reflect the change
      currentUserRole.updatedAt = new Date();
      await queryRunner.manager.save(currentUserRole);

      await queryRunner.commitTransaction();

      // BR5: Invalidate permission cache
      try {
        await this.redisService.invalidateUserPermissionCache(userId);
      } catch (cacheError) {
        this.logger.warn(
          `Failed to invalidate cache for user ${userId}: ${cacheError.message}`,
        );
        // Non-blocking: continue even if cache invalidation fails
      }

      this.logger.log(
        `Role updated for user ${userId} from ${oldRole.code} to ${newRoleCode}`,
      );

      return {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        oldRole,
        newRole: {
          code: newRole.code,
          name: newRole.name,
        },
        updatedAt: currentUserRole.updatedAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error updating user role: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update user profile (P4UC04)
   */
  async updateUserProfile(
    userId: string,
    tenantId: string,
    fullName: string,
    email: string,
    phoneNumber: string | undefined,
    actorId: string,
  ): Promise<{
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    languagePreference: string;
    changedFields: string[];
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    emailChanged: boolean;
    updatedAt: Date;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate user exists and belongs to tenant
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId, deletedAt: IsNull() },
      });

      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Track changes
      const changedFields: string[] = [];
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};
      let emailChanged = false;

      // Check full name change
      if (fullName.trim() !== user.fullName) {
        changedFields.push('fullName');
        oldValues.fullName = user.fullName;
        newValues.fullName = fullName.trim();
        user.fullName = fullName.trim();
      }

      // Check email change
      if (normalizedEmail !== user.email) {
        // Check email uniqueness (exclude current user)
        const existingUser = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });

        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('EMAIL_ALREADY_EXISTS');
        }

        changedFields.push('email');
        oldValues.email = user.email;
        newValues.email = normalizedEmail;
        user.email = normalizedEmail;
        user.emailVerifiedAt = null; // Reset verification
        emailChanged = true;
      }

      // Check phone number change
      const newPhoneNumber = phoneNumber?.trim() || null;
      if (newPhoneNumber !== user.phoneNumber) {
        changedFields.push('phoneNumber');
        oldValues.phoneNumber = user.phoneNumber;
        newValues.phoneNumber = newPhoneNumber;
        user.phoneNumber = newPhoneNumber;
      }

      // If no changes, return success without updating
      if (changedFields.length === 0) {
        await queryRunner.commitTransaction();
        
        this.logger.log(
          `Profile update requested for user ${userId} but no changes detected`,
        );

        return {
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          languagePreference: user.languagePreference,
          changedFields: [],
          oldValues: {},
          newValues: {},
          emailChanged: false,
          updatedAt: user.updatedAt,
        };
      }

      // Update timestamp
      user.updatedAt = new Date();

      // Save changes
      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Profile updated for user ${userId}: ${changedFields.join(', ')}`,
      );

      return {
        userId: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        phoneNumber: savedUser.phoneNumber,
        languagePreference: savedUser.languagePreference,
        changedFields,
        oldValues,
        newValues,
        emailChanged,
        updatedAt: savedUser.updatedAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error updating user profile: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deactivate a user account
   */
  async deactivateUser(
    userId: string,
    actorId: string,
    tenantId: string,
    reason: string | undefined,
  ): Promise<{
    userId: string;
    fullName: string;
    email: string;
    languagePreference: string;
    isActive: boolean;
    deactivatedAt: Date;
    deactivatedBy: string;
    reason?: string;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch target user
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId, deletedAt: IsNull() },
      });

      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }

      // Verify tenant match
      if (user.tenantId !== tenantId) {
        throw new ForbiddenException('CROSS_TENANT_ACCESS');
      }

      // Cannot deactivate self
      if (userId === actorId) {
        throw new ForbiddenException('CANNOT_DEACTIVATE_SELF');
      }

      // Check if user is already deactivated
      if (!user.isActive) {
        throw new BadRequestException('USER_ALREADY_DEACTIVATED');
      }

      // Check if user is company owner
      const userRoles = await this.userRoleRepository.find({
        where: { userId: user.id, tenantId },
        relations: ['role'],
      });

      const isCompanyOwner = userRoles.some(
        (ur) => ur.role.code === 'COMPANY_OWNER',
      );

      // If deactivating a company owner, ensure at least one other active owner remains
      if (isCompanyOwner) {
        const activeOwnerCount = await this.userRepository
          .createQueryBuilder('u')
          .innerJoin('u.userRoles', 'ur')
          .innerJoin('ur.role', 'r')
          .where('r.code = :roleCode', { roleCode: 'COMPANY_OWNER' })
          .andWhere('u.tenant_id = :tenantId', { tenantId })
          .andWhere('u.is_active = :isActive', { isActive: true })
          .andWhere('u.deleted_at IS NULL')
          .getCount();

        if (activeOwnerCount <= 1) {
          throw new ForbiddenException('CANNOT_DEACTIVATE_LAST_OWNER');
        }
      }

      // Deactivate user
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivatedBy = actorId;
      user.updatedAt = new Date();

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      this.logger.log(
        `User ${userId} deactivated by ${actorId}${reason ? ` - Reason: ${reason}` : ''}`,
      );

      return {
        userId: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        languagePreference: savedUser.languagePreference,
        isActive: savedUser.isActive,
        deactivatedAt: savedUser.deactivatedAt!,
        deactivatedBy: savedUser.deactivatedBy!,
        reason,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error deactivating user: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reactivate a user account
   */
  async reactivateUser(
    userId: string,
    actorId: string,
    tenantId: string,
  ): Promise<{
    userId: string;
    fullName: string;
    email: string;
    languagePreference: string;
    isActive: boolean;
    reactivatedAt: Date;
    reactivatedBy: string;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch target user
      const user = await this.userRepository.findOne({
        where: { id: userId, tenantId, deletedAt: IsNull() },
      });

      if (!user) {
        throw new NotFoundException('USER_NOT_FOUND');
      }

      // Verify tenant match
      if (user.tenantId !== tenantId) {
        throw new ForbiddenException('CROSS_TENANT_ACCESS');
      }

      // Check if user is already active
      if (user.isActive) {
        throw new BadRequestException('USER_ALREADY_ACTIVE');
      }

      // Reactivate user
      user.isActive = true;
      user.reactivatedAt = new Date();
      user.reactivatedBy = actorId;
      user.updatedAt = new Date();

      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      this.logger.log(`User ${userId} reactivated by ${actorId}`);

      return {
        userId: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        languagePreference: savedUser.languagePreference,
        isActive: savedUser.isActive,
        reactivatedAt: savedUser.reactivatedAt!,
        reactivatedBy: savedUser.reactivatedBy!,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error reactivating user: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserNames(
    userIds: string[],
    tenantId: string,
  ): Promise<Array<{ id: string; fullName: string }>> {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      const users = await this.userRepository.find({
        where: userIds.map(id => ({ id, tenantId })),
        select: ['id', 'fullName'],
      });

      return users.map(user => ({
        id: user.id,
        fullName: user.fullName,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting user names: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
