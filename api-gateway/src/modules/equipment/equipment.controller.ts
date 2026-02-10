import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { EquipmentService } from './equipment.service';
import { CreateCategoryRequestDto } from './dto/create-category.dto';
import { UpdateCategoryRequestDto } from './dto/update-category.dto';
import { DeactivateCategoryRequestDto } from './dto/deactivate-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories.dto';
import { ViewCategoriesQueryDto } from './dto/view-categories.dto';
import { generateCorrelationId } from '../../common/utils/request.util';
import { ValidateSessionResponse } from '../user-management/interfaces/user-management.interface';
import { extractIpAddress } from '../../common/utils/request.util';
import { extractUserAgent } from '../../common/utils/request.util';

interface IAuthService {
  validateSession(data: { token: string; correlationId: string }): any;
}

@ApiTags('Equipment')
@Controller('equipment/categories')
export class EquipmentController implements OnModuleInit {
  private authService: IAuthService;

  constructor(
    private readonly equipmentService: EquipmentService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<IAuthService>('AuthService');
  }

  @Get()
  @ApiOperation({ summary: 'View paginated equipment categories with search and filters' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoriesRetrieved',
        data: {
          categories: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Heavy Equipment',
              description: 'Large construction equipment',
              parentId: null,
              parentName: null,
              level: 1,
              isActive: true,
              createdAt: '2025-01-15T10:30:00.000Z',
              childrenCount: 3,
            },
          ],
          pagination: {
            currentPage: 1,
            pageSize: 20,
            totalItems: 25,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters',
    schema: {
      example: {
        success: false,
        error: 'error.invalidParameters',
        code: 'INVALID_PARAMETERS',
        details: [
          {
            field: 'page',
            message: 'page must be a positive number',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async viewCategories(@Query() query: ViewCategoriesQueryDto, @Req() request: any) {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.viewCategories(
      sessionValidation.tenantId!,
      query.page ?? 1,
      query.pageSize ?? 20,
      query.search,
      query.status,
      query.hierarchyLevel,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoriesRetrieved',
      data: {
        categories: result.categories,
        pagination: result.pagination,
      },
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'List equipment categories for dropdown selection' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoriesRetrieved',
        data: {
          categories: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Heavy Equipment',
              description: 'Large construction equipment',
              parentId: null,
              level: 1,
              isActive: true,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async listCategories(@Query() query: ListCategoriesQueryDto, @Req() request: any) {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.listCategories(
      sessionValidation.tenantId!,
      query.activeOnly ?? true,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoriesRetrieved',
      data: {
        categories: result.categories,
      },
    };
  }

  @Post('create')
  @ApiOperation({ summary: 'Create new equipment category' })
  @ApiBody({
    type: CreateCategoryRequestDto,
    examples: {
      example1: {
        summary: 'Create category without parent',
        value: {
          name: 'Heavy Equipment',
          description: 'Large construction and industrial equipment',
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoryCreated',
        data: {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Heavy Equipment',
          description: 'Large construction and industrial equipment',
          parentId: null,
          level: 1,
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        error: 'error.categoryNameExists',
        code: 'CATEGORY_NAME_EXISTS',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async createCategory(@Body() createCategoryDto: CreateCategoryRequestDto, @Req() request: any) {
    const correlationId = generateCorrelationId();
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.createCategory(
      createCategoryDto,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      ipAddress,
      userAgent,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoryCreated',
      data: {
        categoryId: result.category.id,
        name: result.category.name,
        description: result.category.description,
        parentId: result.category.parentId,
        level: result.category.level,
        isActive: result.category.isActive,
      },
    };
  }

  @Put(':categoryId')
  @ApiOperation({ summary: 'Update existing equipment category' })
  @ApiParam({
    name: 'categoryId',
    description: 'UUID of category to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateCategoryRequestDto,
    examples: {
      example1: {
        summary: 'Update category name and description',
        value: {
          name: 'Heavy Machinery',
          description: 'Updated description for heavy equipment',
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoryUpdated',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Heavy Machinery',
          description: 'Updated description for heavy equipment',
          parentId: null,
          parentName: null,
          level: 1,
          isActive: true,
          updatedAt: '2025-12-27T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
    schema: {
      example: {
        success: false,
        error: 'error.validationFailed',
        code: 'VALIDATION_FAILED',
        details: [
          {
            field: 'name',
            message: 'name must be between 2 and 100 characters',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Category name already exists',
    schema: {
      example: {
        success: false,
        error: 'error.categoryNameExists',
        code: 'CATEGORY_NAME_EXISTS',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Circular reference detected',
    schema: {
      example: {
        success: false,
        error: 'error.circularReferenceDetected',
        code: 'CIRCULAR_REFERENCE_DETECTED',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Hierarchy depth exceeded',
    schema: {
      example: {
        success: false,
        error: 'error.hierarchyDepthExceeded',
        code: 'HIERARCHY_DEPTH_EXCEEDED',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot deactivate category with equipment',
    schema: {
      example: {
        success: false,
        error: 'error.cannotDeactivateCategoryWithEquipment',
        code: 'CANNOT_DEACTIVATE_CATEGORY_WITH_EQUIPMENT',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Category not found',
    schema: {
      example: {
        success: false,
        error: 'error.categoryNotFound',
        code: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Concurrent modification detected',
    schema: {
      example: {
        success: false,
        error: 'error.concurrentModification',
        code: 'CONCURRENT_MODIFICATION',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryRequestDto,
    @Req() request: any,
  ) {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.updateCategory(
      categoryId,
      updateCategoryDto,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoryUpdated',
      data: {
        id: result.category.id,
        name: result.category.name,
        description: result.category.description,
        parentId: result.category.parentId,
        parentName: result.category.parentName,
        level: result.category.level,
        isActive: result.category.isActive,
        updatedAt: result.category.updatedAt,
      },
    };
  }

  @Put(':categoryId/deactivate')
  @ApiOperation({ summary: 'Deactivate equipment category' })
  @ApiParam({
    name: 'categoryId',
    description: 'UUID of the category to deactivate',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: DeactivateCategoryRequestDto,
    examples: {
      'With reason': {
        value: {
          reason: 'No longer needed for operations',
        },
      },
      'Without reason': {
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category deactivated successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoryDeactivated',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Heavy Equipment',
          isActive: false,
          deactivatedAt: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error or category has dependencies',
    schema: {
      examples: {
        'Active children': {
          value: {
            success: false,
            error: 'error.cannotDeactivateCategoryWithActiveChildren',
            code: 'CANNOT_DEACTIVATE_CATEGORY_WITH_ACTIVE_CHILDREN',
          },
        },
        'Active equipment': {
          value: {
            success: false,
            error: 'error.cannotDeactivateCategoryWithEquipment',
            code: 'CANNOT_DEACTIVATE_CATEGORY_WITH_EQUIPMENT',
            details: {
              equipmentCount: 5,
            },
          },
        },
        'Already deactivated': {
          value: {
            success: false,
            error: 'error.categoryAlreadyDeactivated',
            code: 'CATEGORY_ALREADY_DEACTIVATED',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Category not found',
    schema: {
      example: {
        success: false,
        error: 'error.categoryNotFound',
        code: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async deactivateCategory(
    @Param('categoryId') categoryId: string,
    @Body() deactivateDto: DeactivateCategoryRequestDto,
    @Req() request: any,
  ) {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.deactivateCategory(
      categoryId,
      deactivateDto,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoryDeactivated',
      data: {
        id: result.category.id,
        name: result.category.name,
        isActive: result.category.isActive,
        deactivatedAt: result.category.deactivatedAt,
      },
    };
  }

  @Put(':categoryId/reactivate')
  @ApiOperation({ summary: 'Reactivate equipment category' })
  @ApiParam({
    name: 'categoryId',
    description: 'UUID of the category to reactivate',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {},
    },
    examples: {
      'Empty body': {
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category reactivated successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoryReactivated',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Heavy Equipment',
          isActive: true,
          reactivatedAt: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Category already active',
    schema: {
      example: {
        success: false,
        error: 'error.categoryAlreadyActive',
        code: 'CATEGORY_ALREADY_ACTIVE',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Category not found',
    schema: {
      example: {
        success: false,
        error: 'error.categoryNotFound',
        code: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async reactivateCategory(@Param('categoryId') categoryId: string, @Req() request: any) {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.reactivateCategory(
      categoryId,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoryReactivated',
      data: {
        id: result.category.id,
        name: result.category.name,
        isActive: result.category.isActive,
        reactivatedAt: result.category.reactivatedAt,
      },
    };
  }

  @Delete(':categoryId')
  @ApiOperation({ summary: 'Permanently delete equipment category (soft delete)' })
  @ApiParam({
    name: 'categoryId',
    description: 'UUID of the category to delete',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.categoryDeleted',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Heavy Equipment',
          deletedAt: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Category has dependencies',
    schema: {
      examples: {
        'Has children': {
          value: {
            success: false,
            error: 'error.cannotDeleteCategoryWithChildren',
            code: 'CANNOT_DELETE_CATEGORY_WITH_CHILDREN',
            details: {
              childCategories: ['Sub-category 1', 'Sub-category 2'],
            },
          },
        },
        'Has equipment': {
          value: {
            success: false,
            error: 'error.cannotDeleteCategoryWithEquipment',
            code: 'CANNOT_DELETE_CATEGORY_WITH_EQUIPMENT',
            details: {
              equipmentCount: 5,
            },
          },
        },
        'Already deleted': {
          value: {
            success: false,
            error: 'error.categoryAlreadyDeleted',
            code: 'CATEGORY_ALREADY_DELETED',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    schema: {
      example: {
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    schema: {
      example: {
        success: false,
        error: 'error.insufficientPermissions',
        code: 'INSUFFICIENT_PERMISSIONS',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Category not found',
    schema: {
      example: {
        success: false,
        error: 'error.categoryNotFound',
        code: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        error: 'error.internalServerError',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  })
  async deleteCategory(@Param('categoryId') categoryId: string, @Req() request: any) {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const sessionValidation = (await firstValueFrom(
      this.authService.validateSession({
        token: sessionToken,
        correlationId,
      }),
    )) as ValidateSessionResponse;

    if (!sessionValidation.success) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.sessionExpired',
        code: 'SESSION_EXPIRED',
      });
    }

    const result = await this.equipmentService.deleteCategory(
      categoryId,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.categoryDeleted',
      data: {
        id: result.category.id,
        name: result.category.name,
        deletedAt: result.category.deletedAt,
      },
    };
  }
}
