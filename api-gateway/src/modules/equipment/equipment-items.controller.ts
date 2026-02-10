import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  Req,
  UnauthorizedException,
  BadRequestException,
  Inject,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentRequestDto } from './dto/create-equipment.dto';
import { UpdateEquipmentRequestDto } from './dto/update-equipment.dto';
import { ListEquipmentQueryDto } from './dto/list-equipment.dto';
import { GetEquipmentDetailsParamsDto } from './dto/get-equipment-details-params.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import {
  DeleteEquipmentQueryDto,
  SoftDeleteEquipmentDto,
  PermanentDeleteEquipmentDto,
} from './dto/delete-equipment.dto';
import { generateCorrelationId } from '../../common/utils/request.util';
import { ValidateSessionResponse } from '../user-management/interfaces/user-management.interface';
import { UserManagementService } from '../user-management/user-management.service';

interface IAuthService {
  validateSession(data: { token: string; correlationId: string }): any;
}

@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentItemsController implements OnModuleInit {
  private authService: IAuthService;

  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly userManagementService: UserManagementService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<IAuthService>('AuthService');
  }

  @Post()
  @ApiOperation({ summary: 'Create new equipment item in tenant inventory' })
  @ApiBody({
    type: CreateEquipmentRequestDto,
    examples: {
      excavator: {
        summary: 'Excavator Example',
        value: {
          name: 'Caterpillar 320 Excavator',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          description: 'Heavy-duty hydraulic excavator for construction projects',
          manufacturer: 'Caterpillar',
          model: '320',
          serialNumber: 'CAT320-2024-001',
          yearOfManufacture: 2024,
          purchasePrice: 250000,
          purchaseDate: '2024-01-15',
          status: 'Available',
          customAttributes: [
            { key: 'Bucket Capacity', value: '1.2', unit: 'cubic meters' },
            { key: 'Operating Weight', value: '20', unit: 'tons' },
            { key: 'Engine Power', value: '159', unit: 'HP' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Equipment created successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.created',
        data: {
          equipment: {
            id: '456e7890-e12b-34c5-d678-901234567890',
            tenantId: 'abc12345-f678-90ab-cdef-123456789012',
            name: 'Caterpillar 320 Excavator',
            categoryId: '123e4567-e89b-12d3-a456-426614174000',
            categoryName: 'Excavators',
            description: 'Heavy-duty hydraulic excavator for construction projects',
            manufacturer: 'Caterpillar',
            model: '320',
            serialNumber: 'CAT320-2024-001',
            yearOfManufacture: 2024,
            purchasePrice: 250000,
            purchaseDate: '2024-01-15',
            status: 'Available',
            customAttributes: [
              { key: 'Bucket Capacity', value: '1.2', unit: 'cubic meters' },
              { key: 'Operating Weight', value: '20', unit: 'tons' },
              { key: 'Engine Power', value: '159', unit: 'HP' },
            ],
            createdBy: 'user123-uuid',
            createdAt: '2025-12-28T10:30:00.000Z',
            updatedAt: '2025-12-28T10:30:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failure',
    schema: {
      example: {
        success: false,
        error: 'error.validationFailed',
        code: 'VALIDATION_FAILED',
        details: [
          {
            field: 'name',
            message: 'error.equipment.nameRequired',
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
    description: 'Not Found - Category not found or inactive',
    schema: {
      example: {
        success: false,
        error: 'error.equipment.categoryNotFound',
        code: 'CATEGORY_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Duplicate serial number',
    schema: {
      example: {
        success: false,
        error: 'error.equipment.serialNumberExists',
        code: 'SERIAL_NUMBER_EXISTS',
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
  async createEquipment(
    @Body() createEquipmentDto: CreateEquipmentRequestDto,
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

    const result = await this.equipmentService.createEquipment(
      createEquipmentDto,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.created',
      data: {
        equipment: result.equipment,
      },
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve paginated list of equipment items with filtering, searching, and sorting',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment list retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.list.retrieved',
        data: {
          items: [
            {
              id: '456e7890-e12b-34c5-d678-901234567890',
              name: 'Caterpillar 320 Excavator',
              categoryId: '123e4567-e89b-12d3-a456-426614174000',
              categoryPath: 'Construction > Heavy Equipment > Excavators',
              serialNumber: 'CAT320-2024-001',
              status: 'Available',
              manufacturer: 'Caterpillar',
              model: '320',
              yearOfManufacture: 2024,
              purchasePrice: 250000,
              purchaseDate: '2024-01-15',
              description: 'Heavy-duty hydraulic excavator for construction projects',
              customAttributes: [{ key: 'Bucket Capacity', value: '1.2', unit: 'cubic meters' }],
              createdAt: '2025-12-28T10:30:00.000Z',
              updatedAt: '2025-12-28T10:30:00.000Z',
            },
          ],
          total: 45,
          page: 1,
          limit: 20,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid pagination or filter values',
    schema: {
      example: {
        success: false,
        error: 'error.invalidPagination',
        code: 'INVALID_PAGINATION',
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
  async listEquipment(@Query() query: ListEquipmentQueryDto, @Req() request: any) {
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

    const result = await this.equipmentService.listEquipment(
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      query.page ?? 1,
      query.limit ?? 20,
      query.sortBy ?? 'createdAt',
      query.sortOrder ?? 'desc',
      {
        status: query.status,
        categoryId: query.categoryId,
        manufacturer: query.manufacturer,
        searchQuery: query.searchQuery,
        purchaseDateFrom: query.purchaseDateFrom,
        purchaseDateTo: query.purchaseDateTo,
        createdDateFrom: query.createdDateFrom,
        createdDateTo: query.createdDateTo,
      },
      correlationId,
    );

    return {
      success: true,
      message: 'equipment.list.retrieved',
      data: result.data,
    };
  }

  @Get(':equipmentId')
  @ApiOperation({ summary: 'Retrieve detailed information about a specific equipment item' })
  @ApiParam({ name: 'equipmentId', description: 'Equipment ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Equipment details retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.details.retrieved',
        data: {
          id: '456e7890-e12b-34c5-d678-901234567890',
          name: 'Caterpillar 320 Excavator',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          categoryPath: 'Construction > Heavy Equipment > Excavators',
          categoryHierarchy: [
            { id: '111e1111-e11b-11c1-d111-111111111111', name: 'Construction', level: 1 },
            { id: '222e2222-e22b-22c2-d222-222222222222', name: 'Heavy Equipment', level: 2 },
            { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Excavators', level: 3 },
          ],
          description: 'Heavy-duty hydraulic excavator for construction projects',
          manufacturer: 'Caterpillar',
          model: '320',
          serialNumber: 'CAT320-2024-001',
          yearOfManufacture: 2024,
          purchasePrice: 250000,
          purchaseDate: '2024-01-15',
          status: 'Available',
          customAttributes: [
            { name: 'Bucket Capacity', value: '1.2', unit: 'cubic meters' },
            { name: 'Operating Weight', value: '20', unit: 'tons' },
            { name: 'Engine Power', value: '159', unit: 'HP' },
          ],
          isArchived: false,
          metadata: {
            createdBy: {
              id: 'user123-uuid',
              fullName: 'John Doe',
            },
            createdAt: '2025-12-28T10:30:00.000Z',
            updatedBy: {
              id: 'user456-uuid',
              fullName: 'Jane Smith',
            },
            updatedAt: '2025-12-28T15:45:00.000Z',
            deletedAt: null,
          },
          permissions: {
            canEdit: true,
            canDelete: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid equipment ID',
    schema: {
      example: {
        success: false,
        error: 'error.invalidEquipmentId',
        code: 'INVALID_EQUIPMENT_ID',
        details: [
          {
            field: 'equipmentId',
            message: 'equipmentId must be a valid UUID',
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
    status: 404,
    description: 'Not Found - Equipment not found',
    schema: {
      example: {
        success: false,
        error: 'error.equipmentNotFound',
        code: 'EQUIPMENT_NOT_FOUND',
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
  async getEquipmentDetails(@Param() params: GetEquipmentDetailsParamsDto, @Req() request: any) {
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

    const result = await this.equipmentService.getEquipmentDetails(
      params.equipmentId,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
    );

    // Get user names for createdBy and updatedBy (filter out undefined/null values)
    const userIds = [result.equipment.createdBy, result.equipment.updatedBy].filter(
      (id) => id !== undefined && id !== null && id !== '',
    );
    const uniqueUserIds = [...new Set(userIds)];

    const userNamesData =
      uniqueUserIds.length > 0
        ? await this.userManagementService.getUserNames(
            uniqueUserIds,
            sessionValidation.tenantId!,
            correlationId,
          )
        : [];

    const userNamesMap = new Map(userNamesData.map((user) => [user.id, user.fullName]));

    // Parse categoryPath to create hierarchy
    const categoryPath = result.equipment.categoryPath || result.equipment.categoryName;
    const categoryHierarchy = categoryPath
      ? categoryPath.split(' > ').map((name: string, index: number) => ({
          id: index === categoryPath.split(' > ').length - 1 ? result.equipment.categoryId : null,
          name: name.trim(),
          level: index + 1,
        }))
      : [];

    // Determine permissions based on role (simplified - actual role checking would be needed)
    // For now, assume equipment service returns role or we get from session
    const isArchived =
      result.equipment.deletedAt !== null &&
      result.equipment.deletedAt !== undefined &&
      result.equipment.deletedAt !== '';

    return {
      success: true,
      message: 'equipment.details.retrieved',
      data: {
        id: result.equipment.id,
        name: result.equipment.name,
        categoryId: result.equipment.categoryId,
        categoryPath: categoryPath,
        categoryHierarchy: categoryHierarchy,
        description: result.equipment.description,
        manufacturer: result.equipment.manufacturer,
        model: result.equipment.model,
        serialNumber: result.equipment.serialNumber,
        yearOfManufacture: result.equipment.yearOfManufacture,
        purchasePrice: result.equipment.purchasePrice,
        purchaseDate: result.equipment.purchaseDate,
        status: result.equipment.status,
        customAttributes: result.equipment.customAttributes
          ? result.equipment.customAttributes.map((attr: any) => ({
              name: attr.key,
              value: attr.value,
              unit: attr.unit || null,
            }))
          : null,
        isArchived,
        metadata: {
          createdBy: {
            id: result.equipment.createdBy,
            fullName: userNamesMap.get(result.equipment.createdBy) || 'Unknown',
          },
          createdAt: result.equipment.createdAt,
          updatedBy: {
            id: result.equipment.updatedBy,
            fullName: userNamesMap.get(result.equipment.updatedBy) || 'Unknown',
          },
          updatedAt: result.equipment.updatedAt,
          deletedAt: result.equipment.deletedAt,
        },
        permissions: {
          canEdit: !isArchived,
          canDelete: !isArchived,
        },
      },
    };
  }

  @Put(':equipmentId')
  @ApiOperation({ summary: 'Update existing equipment item information' })
  @ApiParam({ name: 'equipmentId', description: 'Equipment ID (UUID)' })
  @ApiBody({
    type: UpdateEquipmentRequestDto,
    examples: {
      example1: {
        summary: 'Update equipment with all fields',
        value: {
          name: 'Caterpillar 320D Excavator',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          description: 'Updated heavy-duty hydraulic excavator',
          manufacturer: 'Caterpillar',
          model: '320D',
          serialNumber: 'CAT320D-2024-001',
          yearOfManufacture: 2024,
          purchasePrice: 260000,
          purchaseDate: '2024-01-15',
          status: 'Maintenance',
          customAttributes: [
            { key: 'Bucket Capacity', value: '1.2', unit: 'cubic meters' },
            { key: 'Operating Weight', value: '20', unit: 'tons' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment updated successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.updated',
        data: {
          id: '456e7890-e12b-34c5-d678-901234567890',
          name: 'Caterpillar 320D Excavator',
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          categoryPath: 'Construction > Heavy Equipment > Excavators',
          description: 'Updated heavy-duty hydraulic excavator',
          manufacturer: 'Caterpillar',
          model: '320D',
          serialNumber: 'CAT320D-2024-001',
          yearOfManufacture: 2024,
          purchasePrice: 260000,
          purchaseDate: '2024-01-15',
          status: 'Maintenance',
          customAttributes: [
            { key: 'Bucket Capacity', value: '1.2', unit: 'cubic meters' },
            { key: 'Operating Weight', value: '20', unit: 'tons' },
          ],
          createdBy: 'user123-uuid',
          updatedBy: 'user456-uuid',
          createdAt: '2025-12-28T10:30:00.000Z',
          updatedAt: '2025-12-29T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failure',
    schema: {
      examples: {
        validation: {
          value: {
            success: false,
            error: 'error.validationFailed',
            code: 'VALIDATION_FAILED',
            details: [
              {
                field: 'name',
                message: 'error.equipment.nameRequired',
              },
            ],
          },
        },
        invalidId: {
          value: {
            success: false,
            error: 'error.invalidEquipmentId',
            code: 'INVALID_EQUIPMENT_ID',
          },
        },
        categoryInactive: {
          value: {
            success: false,
            error: 'error.equipment.categoryInactive',
            code: 'CATEGORY_INACTIVE',
          },
        },
        cannotChangeCategory: {
          value: {
            success: false,
            error: 'error.equipment.cannotChangeCategoryWithBookings',
            code: 'CANNOT_CHANGE_CATEGORY_WITH_BOOKINGS',
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
    description: 'Not Found - Equipment not found',
    schema: {
      example: {
        success: false,
        error: 'error.equipmentNotFound',
        code: 'EQUIPMENT_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Duplicate serial number or concurrent update',
    schema: {
      examples: {
        duplicate: {
          value: {
            success: false,
            error: 'error.equipment.serialNumberExists',
            code: 'SERIAL_NUMBER_EXISTS',
          },
        },
        concurrent: {
          value: {
            success: false,
            error: 'error.concurrentUpdateDetected',
            code: 'CONCURRENT_UPDATE_DETECTED',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 410,
    description: 'Gone - Equipment is soft-deleted',
    schema: {
      example: {
        success: false,
        error: 'error.equipment.archived',
        code: 'EQUIPMENT_ARCHIVED',
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
  async updateEquipment(
    @Param('equipmentId') equipmentId: string,
    @Body() updateEquipmentDto: UpdateEquipmentRequestDto,
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

    const result = await this.equipmentService.updateEquipment(
      equipmentId,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
      {
        name: updateEquipmentDto.name,
        categoryId: updateEquipmentDto.categoryId,
        description: updateEquipmentDto.description ?? null,
        manufacturer: updateEquipmentDto.manufacturer ?? null,
        model: updateEquipmentDto.model ?? null,
        serialNumber: updateEquipmentDto.serialNumber ?? null,
        yearOfManufacture: updateEquipmentDto.yearOfManufacture ?? null,
        purchasePrice: updateEquipmentDto.purchasePrice ?? null,
        purchaseDate: updateEquipmentDto.purchaseDate ?? null,
        status: updateEquipmentDto.status,
        customAttributes:
          updateEquipmentDto.customAttributes?.map((attr) => ({
            key: attr.key,
            value: attr.value,
            unit: attr.unit ?? null,
          })) ?? null,
      },
    );

    return {
      success: true,
      message: 'equipment.updated',
      data: result.equipment,
    };
  }

  @Patch(':equipmentId/status')
  @ApiOperation({ summary: 'Update equipment status with optional reason' })
  @ApiParam({ name: 'equipmentId', description: 'Equipment ID (UUID)' })
  @ApiBody({
    type: UpdateEquipmentStatusDto,
    examples: {
      maintenance: {
        summary: 'Set to Maintenance',
        value: {
          status: 'Maintenance',
          reason: 'Scheduled maintenance required',
        },
      },
      available: {
        summary: 'Set to Available',
        value: {
          status: 'Available',
          reason: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment status updated successfully',
    schema: {
      example: {
        success: true,
        message: 'equipment.status.updated',
        data: {
          id: '456e7890-e12b-34c5-d678-901234567890',
          name: 'Caterpillar 320 Excavator',
          status: 'Maintenance',
          updatedBy: 'user456-uuid',
          updatedAt: '2025-12-29T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failure',
    schema: {
      examples: {
        validation: {
          value: {
            success: false,
            error: 'error.validationFailed',
            code: 'VALIDATION_FAILED',
            details: [
              {
                field: 'status',
                message: 'error.equipment.statusInvalid',
              },
            ],
          },
        },
        invalidId: {
          value: {
            success: false,
            error: 'error.invalidEquipmentId',
            code: 'INVALID_EQUIPMENT_ID',
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
    description: 'Not Found - Equipment not found',
    schema: {
      example: {
        success: false,
        error: 'error.equipmentNotFound',
        code: 'EQUIPMENT_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 410,
    description: 'Gone - Equipment is archived',
    schema: {
      example: {
        success: false,
        error: 'error.equipment.archived',
        code: 'EQUIPMENT_ARCHIVED',
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
  async updateEquipmentStatus(
    @Param('equipmentId') equipmentId: string,
    @Body() updateStatusDto: UpdateEquipmentStatusDto,
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

    const result = await this.equipmentService.updateEquipmentStatus(
      equipmentId,
      sessionValidation.tenantId!,
      sessionValidation.userId!,
      correlationId,
      updateStatusDto.status,
      updateStatusDto.reason ?? null,
    );

    // Check if status changed
    if (result.data.statusChanged === false) {
      return {
        success: true,
        message: 'equipment.status.unchanged',
        data: {
          id: result.data.equipment.id,
          name: result.data.equipment.name,
          status: result.data.equipment.status,
        },
      };
    }

    return {
      success: true,
      message: 'equipment.status.updated',
      data: {
        id: result.data.equipment.id,
        name: result.data.equipment.name,
        status: result.data.equipment.status,
        updatedBy: result.data.equipment.updatedBy,
        updatedAt: result.data.equipment.updatedAt,
      },
    };
  }

  @Delete(':equipmentId')
  @ApiOperation({ summary: 'Delete equipment (soft delete or permanent delete)' })
  @ApiParam({ name: 'equipmentId', description: 'Equipment ID (UUID)' })
  @ApiQuery({
    name: 'type',
    enum: ['soft', 'permanent'],
    description: 'Type of deletion',
    example: 'soft',
  })
  @ApiBody({
    description: 'Request body varies by deletion type',
    examples: {
      soft: {
        summary: 'Soft Delete (Archive)',
        value: {
          reason: 'Equipment no longer in use',
        },
      },
      permanent: {
        summary: 'Permanent Delete',
        value: {
          confirmation: 'DELETE',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment deleted successfully',
    schema: {
      examples: {
        softDelete: {
          summary: 'Soft Delete Success',
          value: {
            success: true,
            message: 'equipment.archived',
            data: {
              id: '456e7890-e12b-34c5-d678-901234567890',
              name: 'Caterpillar 320 Excavator',
              categoryPath: 'Construction > Heavy Equipment > Excavators',
              deletedAt: '2025-12-29T10:00:00.000Z',
              deletedBy: 'user456-uuid',
            },
          },
        },
        permanentDelete: {
          summary: 'Permanent Delete Success',
          value: {
            success: true,
            message: 'equipment.deleted.permanently',
            data: {
              id: '456e7890-e12b-34c5-d678-901234567890',
              name: 'Caterpillar 320 Excavator',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation failure',
    schema: {
      examples: {
        validation: {
          value: {
            success: false,
            error: 'error.validationFailed',
            code: 'VALIDATION_FAILED',
            details: [
              {
                field: 'type',
                message: 'error.equipment.deleteTypeInvalid',
              },
            ],
          },
        },
        confirmationRequired: {
          value: {
            success: false,
            error: 'error.validationFailed',
            code: 'VALIDATION_FAILED',
            details: [
              {
                field: 'confirmation',
                message: 'error.equipment.confirmationRequired',
              },
            ],
          },
        },
        invalidId: {
          value: {
            success: false,
            error: 'error.invalidEquipmentId',
            code: 'INVALID_EQUIPMENT_ID',
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
        error: 'error.forbidden',
        code: 'FORBIDDEN',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Equipment not found',
    schema: {
      example: {
        success: false,
        error: 'error.equipmentNotFound',
        code: 'EQUIPMENT_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 410,
    description: 'Gone - Equipment already archived',
    schema: {
      example: {
        success: false,
        error: 'error.equipment.alreadyArchived',
        code: 'EQUIPMENT_ALREADY_ARCHIVED',
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
  async deleteEquipment(
    @Param('equipmentId') equipmentId: string,
    @Query() query: DeleteEquipmentQueryDto,
    @Body() body: SoftDeleteEquipmentDto | PermanentDeleteEquipmentDto,
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

    if (query.type === 'soft') {
      const softDeleteBody = body as SoftDeleteEquipmentDto;
      const result = await this.equipmentService.archiveEquipment(
        equipmentId,
        sessionValidation.tenantId!,
        sessionValidation.userId!,
        correlationId,
        softDeleteBody.reason ?? null,
      );

      return {
        success: true,
        message: 'equipment.archived',
        data: {
          id: result.data.equipment.id,
          name: result.data.equipment.name,
          categoryPath: result.data.equipment.categoryPath,
          deletedAt: result.data.equipment.deletedAt,
          deletedBy: result.data.equipment.deletedBy,
        },
      };
    } else {
      const permanentDeleteBody = body as PermanentDeleteEquipmentDto;

      // Validate confirmation
      if (permanentDeleteBody.confirmation !== 'DELETE') {
        throw new BadRequestException({
          success: false,
          error: 'error.validationFailed',
          code: 'VALIDATION_FAILED',
          details: [
            {
              field: 'confirmation',
              message: 'error.equipment.confirmationInvalid',
            },
          ],
        });
      }

      const result = await this.equipmentService.deleteEquipmentPermanently(
        equipmentId,
        sessionValidation.tenantId!,
        sessionValidation.userId!,
        correlationId,
      );

      return {
        success: true,
        message: 'equipment.deleted.permanently',
        data: {
          id: result.data.deletedEquipment.id,
          name: result.data.deletedEquipment.name,
        },
      };
    }
  }
}
