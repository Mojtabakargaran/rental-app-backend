import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  Logger,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiHeader,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserManagementService } from './user-management.service';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { GetRolesResponseDto } from './dto/get-roles-response.dto';
import { ListUsersRequestDto } from './dto/list-users-request.dto';
import { ListUsersResponseDto } from './dto/list-users-response.dto';
import { GetUserDetailsResponseDto } from './dto/get-user-details-response.dto';
import { UpdateUserRoleRequestDto } from './dto/update-user-role-request.dto';
import { UpdateUserRoleResponseDto } from './dto/update-user-role-response.dto';
import { UpdateUserProfileRequestDto } from './dto/update-user-profile-request.dto';
import { UpdateUserProfileResponseDto } from './dto/update-user-profile-response.dto';
import { DeactivateUserRequestDto } from './dto/deactivate-user-request.dto';
import { DeactivateUserResponseDto } from './dto/deactivate-user-response.dto';
import { ReactivateUserResponseDto } from './dto/reactivate-user-response.dto';
import { ErrorResponseDto } from './dto/error-response.dto';
import {
  generateCorrelationId,
  extractIpAddress,
  extractUserAgent,
} from '@/common/utils/request.util';

@ApiTags('User Management')
@Controller('users')
export class UserManagementController {
  private readonly logger = new Logger(UserManagementController.name);

  constructor(private readonly userManagementService: UserManagementService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Retrieve available roles for user assignment' })
  @ApiCookieAuth('session')
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: GetRolesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  async getRoles(@Req() request: Request): Promise<GetRolesResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      this.logger.warn(
        `Get roles request without session token - IP: ${extractIpAddress(request)}`,
      );
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(`Get roles request - correlationId: ${correlationId}`);

    return this.userManagementService.getRoles(sessionToken, correlationId);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user account within organization' })
  @ApiCookieAuth('session')
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF protection token',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: CreateUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - CSRF token invalid or insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async createUser(
    @Body() createUserDto: CreateUserRequestDto,
    @Req() request: Request,
  ): Promise<CreateUserResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    if (!sessionToken) {
      this.logger.warn(`Create user request without session token - IP: ${ipAddress}`);
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(
      `Create user request - Email: ${createUserDto.email}, correlationId: ${correlationId}`,
    );

    return this.userManagementService.createUser(
      createUserDto,
      sessionToken,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve paginated list of users with filters' })
  @ApiCookieAuth('session')
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
    example: 50,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query for full name or email (min 2 chars)',
    example: 'john',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive', 'all'],
    description: 'Filter by account status (default: all)',
    example: 'all',
  })
  @ApiQuery({
    name: 'roleCode',
    required: false,
    type: String,
    description: 'Filter by role code',
    example: 'MANAGER',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: ListUsersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async listUsers(
    @Query() query: ListUsersRequestDto,
    @Req() request: Request,
  ): Promise<ListUsersResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      this.logger.warn(
        `List users request without session token - IP: ${extractIpAddress(request)}`,
      );
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(
      `List users request - Page: ${query.page}, Limit: ${query.limit}, correlationId: ${correlationId}`,
    );

    return this.userManagementService.listUsers(
      sessionToken,
      query.page || 1,
      query.limit || 50,
      query.search,
      query.status,
      query.roleCode,
      correlationId,
    );
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Retrieve detailed information about a specific user' })
  @ApiCookieAuth('session')
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    type: GetUserDetailsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid user ID format',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or cross-tenant access',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async getUserDetails(
    @Param('userId') userId: string,
    @Req() request: Request,
  ): Promise<GetUserDetailsResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      this.logger.warn(
        `Get user details request without session token - IP: ${extractIpAddress(request)}`,
      );
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(
      `Get user details request - UserId: ${userId}, correlationId: ${correlationId}`,
    );

    return this.userManagementService.getUserDetails(sessionToken, userId, correlationId);
  }

  @Put(':userId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update role of a specific user' })
  @ApiCookieAuth('session')
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateUserRoleRequestDto,
    examples: {
      manager: {
        summary: 'Assign Manager Role',
        value: { roleCode: 'MANAGER' },
      },
      staff: {
        summary: 'Assign Staff Role',
        value: { roleCode: 'STAFF' },
      },
      maintenance: {
        summary: 'Assign Maintenance Role',
        value: { roleCode: 'MAINTENANCE' },
      },
      readOnly: {
        summary: 'Assign Read-Only Role',
        value: { roleCode: 'READ_ONLY' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: UpdateUserRoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid request body or user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions, self-modification, or owner role protected',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateUserRoleRequestDto,
    @Req() request: Request,
  ): Promise<UpdateUserRoleResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    if (!sessionToken) {
      this.logger.warn(`Update user role request without session token - IP: ${ipAddress}`);
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(
      `Update user role request - UserId: ${userId}, NewRole: ${updateRoleDto.roleCode}, correlationId: ${correlationId}`,
    );

    return this.userManagementService.updateUserRole(
      userId,
      updateRoleDto.roleCode,
      sessionToken,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Put(':userId/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile information (name, email, phone)' })
  @ApiCookieAuth('session')
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateUserProfileRequestDto,
    examples: {
      fullUpdate: {
        summary: 'Update All Fields',
        value: {
          fullName: 'John Smith',
          email: 'john.smith@example.com',
          phoneNumber: '+989123456789',
        },
      },
      nameAndEmail: {
        summary: 'Update Name and Email',
        value: {
          fullName: 'Jane Doe',
          email: 'jane.doe@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UpdateUserProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid request body, user ID, or no changes made',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions or cross-tenant access',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateUserProfileRequestDto,
    @Req() request: Request,
  ): Promise<UpdateUserProfileResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    if (!sessionToken) {
      this.logger.warn(`Update user profile request without session token - IP: ${ipAddress}`);
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(
      `Update user profile request - UserId: ${userId}, correlationId: ${correlationId}`,
    );

    return this.userManagementService.updateUserProfile(
      userId,
      updateProfileDto,
      sessionToken,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Put(':userId/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user account to revoke system access' })
  @ApiCookieAuth('session')
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF protection token',
    required: true,
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID of user to deactivate',
    example: 'c89f4f73-2f4e-4b5b-9f4e-3e9f4f732f4e',
  })
  @ApiBody({
    type: DeactivateUserRequestDto,
    examples: {
      withReason: {
        summary: 'Deactivation with reason',
        value: {
          reason: 'Employee left the company',
        },
      },
      withoutReason: {
        summary: 'Deactivation without reason',
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: DeactivateUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - User already deactivated or invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot deactivate self, last owner, or insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async deactivateUser(
    @Param('userId') userId: string,
    @Body() deactivateDto: DeactivateUserRequestDto,
    @Req() request: Request,
  ): Promise<DeactivateUserResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    if (!sessionToken) {
      this.logger.warn(`Deactivate user request without session token - IP: ${ipAddress}`);
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(`Deactivate user request - UserId: ${userId}, correlationId: ${correlationId}`);

    return this.userManagementService.deactivateUser(
      userId,
      deactivateDto.reason,
      sessionToken,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Put(':userId/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reactivate previously deactivated user account',
  })
  @ApiCookieAuth('session')
  @ApiHeader({
    name: 'X-CSRF-Token',
    description: 'CSRF protection token',
    required: true,
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID of user to reactivate',
    example: 'c89f4f73-2f4e-4b5b-9f4e-3e9f4f732f4e',
  })
  @ApiResponse({
    status: 200,
    description: 'User reactivated successfully',
    type: ReactivateUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - User already active or invalid user ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service Unavailable',
    type: ErrorResponseDto,
  })
  async reactivateUser(
    @Param('userId') userId: string,
    @Req() request: Request,
  ): Promise<ReactivateUserResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    if (!sessionToken) {
      this.logger.warn(`Reactivate user request without session token - IP: ${ipAddress}`);
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(`Reactivate user request - UserId: ${userId}, correlationId: ${correlationId}`);

    return this.userManagementService.reactivateUser(
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      correlationId,
    );
  }
}
