import {
  Injectable,
  Inject,
  OnModuleInit,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateCategoryRequestDto } from './dto/create-category.dto';
import { CreateEquipmentRequestDto } from './dto/create-equipment.dto';
import { UpdateCategoryRequestDto } from './dto/update-category.dto';
import { DeactivateCategoryRequestDto } from './dto/deactivate-category.dto';

interface IEquipmentService {
  listCategories(data: { tenantId: string; activeOnly: boolean; correlationId: string }): any;

  viewCategories(data: {
    tenantId: string;
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    hierarchyLevel?: string;
    correlationId: string;
  }): any;

  createCategory(data: {
    name: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
    tenantId: string;
    createdBy: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): any;

  updateCategory(data: {
    categoryId: string;
    tenantId: string;
    userId: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    isActive: boolean;
    correlationId: string;
    clearedFields?: string[];
  }): any;

  deactivateCategory(data: {
    categoryId: string;
    tenantId: string;
    userId: string;
    reason?: string;
    correlationId: string;
  }): any;

  reactivateCategory(data: {
    categoryId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
  }): any;

  deleteCategory(data: {
    categoryId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
  }): any;

  createEquipment(data: {
    tenantId: string;
    userId: string;
    name: string;
    categoryId: string;
    description: string | null;
    manufacturer: string | null;
    model: string | null;
    serialNumber: string | null;
    yearOfManufacture: number | null;
    purchasePrice: number | null;
    purchaseDate: string | null;
    status: string;
    customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
    correlationId: string;
  }): any;

  listEquipment(data: {
    tenantId: string;
    userId: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    filters: {
      status?: string[];
      categoryId?: string[];
      manufacturer?: string;
      searchQuery?: string;
      purchaseDateFrom?: string;
      purchaseDateTo?: string;
      createdDateFrom?: string;
      createdDateTo?: string;
    };
  }): any;

  getEquipmentDetails(data: {
    equipmentId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
  }): any;

  updateEquipment(data: {
    equipmentId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
    name: string;
    categoryId: string;
    description: string | null;
    manufacturer: string | null;
    model: string | null;
    serialNumber: string | null;
    yearOfManufacture: number | null;
    purchasePrice: number | null;
    purchaseDate: string | null;
    status: string;
    customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
    clearedFields?: string[];
  }): any;

  updateEquipmentStatus(data: {
    equipmentId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
    status: string;
    reason: string | null;
  }): any;

  archiveEquipment(data: {
    equipmentId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
    reason: string | null;
  }): any;

  deleteEquipmentPermanently(data: {
    equipmentId: string;
    tenantId: string;
    userId: string;
    correlationId: string;
  }): any;
}

@Injectable()
export class EquipmentService implements OnModuleInit {
  private readonly logger = new Logger(EquipmentService.name);
  private equipmentService: IEquipmentService;

  constructor(@Inject('EQUIPMENT_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.equipmentService = this.client.getService<IEquipmentService>('EquipmentService');
  }

  // Validation errors (400 Bad Request)
  private readonly validationErrorCodes = new Set([
    'CATEGORY_NAME_EXISTS',
    'INVALID_CATEGORY_NAME',
    'CATEGORY_NAME_TOO_SHORT',
    'CATEGORY_NAME_TOO_LONG',
    'DESCRIPTION_TOO_LONG',
    'PARENT_CATEGORY_NOT_FOUND',
    'PARENT_CATEGORY_INACTIVE',
    'PARENT_TENANT_MISMATCH',
    'MAX_HIERARCHY_DEPTH_EXCEEDED',
    'CIRCULAR_REFERENCE_DETECTED',
    'INVALID_PARAMETERS',
    'CATEGORY_NOT_FOUND',
    'CANNOT_DEACTIVATE_CATEGORY_WITH_EQUIPMENT',
    'CANNOT_DEACTIVATE_CATEGORY_WITH_ACTIVE_CHILDREN',
    'CANNOT_DELETE_CATEGORY_WITH_CHILDREN',
    'CANNOT_DELETE_CATEGORY_WITH_EQUIPMENT',
    'CATEGORY_ALREADY_DEACTIVATED',
    'CATEGORY_ALREADY_ACTIVE',
    'CATEGORY_ALREADY_DELETED',
    'VALIDATION_FAILED',
    'CATEGORY_INACTIVE',
    'INVALID_PAGINATION',
    'INVALID_SORT_FIELD',
    'INVALID_FILTER_VALUES',
    'INVALID_EQUIPMENT_ID',
    'CANNOT_CHANGE_CATEGORY_WITH_BOOKINGS',
    'STATUS_INVALID',
  ]);

  // Not found errors (404)
  private readonly notFoundErrorCodes = new Set([
    'CATEGORY_NOT_FOUND',
    'PARENT_CATEGORY_NOT_FOUND',
    'EQUIPMENT_NOT_FOUND',
  ]);

  // Gone errors (410)
  private readonly goneErrorCodes = new Set(['EQUIPMENT_ARCHIVED', 'EQUIPMENT_ALREADY_ARCHIVED']);

  // Conflict errors (409)
  private readonly conflictErrorCodes = new Set([
    'CONCURRENT_MODIFICATION',
    'SERIAL_NUMBER_EXISTS',
    'CONCURRENT_UPDATE_DETECTED',
  ]);

  private readonly errorCodeMap: Record<string, { message: string; code: string }> = {
    CATEGORY_NAME_EXISTS: {
      message: 'error.categoryNameExists',
      code: 'CATEGORY_NAME_EXISTS',
    },
    INVALID_CATEGORY_NAME: {
      message: 'error.invalidCategoryName',
      code: 'INVALID_CATEGORY_NAME',
    },
    CATEGORY_NAME_TOO_SHORT: {
      message: 'error.categoryNameTooShort',
      code: 'CATEGORY_NAME_TOO_SHORT',
    },
    CATEGORY_NAME_TOO_LONG: {
      message: 'error.categoryNameTooLong',
      code: 'CATEGORY_NAME_TOO_LONG',
    },
    DESCRIPTION_TOO_LONG: {
      message: 'error.descriptionTooLong',
      code: 'DESCRIPTION_TOO_LONG',
    },
    PARENT_CATEGORY_NOT_FOUND: {
      message: 'error.parentCategoryNotFound',
      code: 'PARENT_CATEGORY_NOT_FOUND',
    },
    PARENT_CATEGORY_INACTIVE: {
      message: 'error.parentCategoryInactive',
      code: 'PARENT_CATEGORY_INACTIVE',
    },
    PARENT_TENANT_MISMATCH: {
      message: 'error.crossTenantAccess',
      code: 'PARENT_TENANT_MISMATCH',
    },
    MAX_HIERARCHY_DEPTH_EXCEEDED: {
      message: 'error.maxHierarchyDepthExceeded',
      code: 'MAX_HIERARCHY_DEPTH_EXCEEDED',
    },
    CIRCULAR_REFERENCE_DETECTED: {
      message: 'error.circularReferenceDetected',
      code: 'CIRCULAR_REFERENCE_DETECTED',
    },
    INVALID_PARAMETERS: {
      message: 'error.invalidParameters',
      code: 'INVALID_PARAMETERS',
    },
    CATEGORY_NOT_FOUND: {
      message: 'error.categoryNotFound',
      code: 'CATEGORY_NOT_FOUND',
    },
    CANNOT_DEACTIVATE_CATEGORY_WITH_EQUIPMENT: {
      message: 'error.cannotDeactivateCategoryWithEquipment',
      code: 'CANNOT_DEACTIVATE_CATEGORY_WITH_EQUIPMENT',
    },
    CONCURRENT_MODIFICATION: {
      message: 'error.concurrentModification',
      code: 'CONCURRENT_MODIFICATION',
    },
    HIERARCHY_DEPTH_EXCEEDED: {
      message: 'error.hierarchyDepthExceeded',
      code: 'HIERARCHY_DEPTH_EXCEEDED',
    },
    INTERNAL_ERROR: {
      message: 'error.internalServerError',
      code: 'INTERNAL_ERROR',
    },
    CANNOT_DEACTIVATE_CATEGORY_WITH_ACTIVE_CHILDREN: {
      message: 'error.cannotDeactivateCategoryWithActiveChildren',
      code: 'CANNOT_DEACTIVATE_CATEGORY_WITH_ACTIVE_CHILDREN',
    },
    CANNOT_DELETE_CATEGORY_WITH_CHILDREN: {
      message: 'error.cannotDeleteCategoryWithChildren',
      code: 'CANNOT_DELETE_CATEGORY_WITH_CHILDREN',
    },
    CANNOT_DELETE_CATEGORY_WITH_EQUIPMENT: {
      message: 'error.cannotDeleteCategoryWithEquipment',
      code: 'CANNOT_DELETE_CATEGORY_WITH_EQUIPMENT',
    },
    CATEGORY_ALREADY_DEACTIVATED: {
      message: 'error.categoryAlreadyDeactivated',
      code: 'CATEGORY_ALREADY_DEACTIVATED',
    },
    CATEGORY_ALREADY_ACTIVE: {
      message: 'error.categoryAlreadyActive',
      code: 'CATEGORY_ALREADY_ACTIVE',
    },
    CATEGORY_ALREADY_DELETED: {
      message: 'error.categoryAlreadyDeleted',
      code: 'CATEGORY_ALREADY_DELETED',
    },
    VALIDATION_FAILED: {
      message: 'error.validationFailed',
      code: 'VALIDATION_FAILED',
    },
    CATEGORY_INACTIVE: {
      message: 'error.equipment.categoryInactive',
      code: 'CATEGORY_INACTIVE',
    },
    SERIAL_NUMBER_EXISTS: {
      message: 'error.equipment.serialNumberExists',
      code: 'SERIAL_NUMBER_EXISTS',
    },
    INVALID_PAGINATION: {
      message: 'error.invalidPagination',
      code: 'INVALID_PAGINATION',
    },
    INVALID_SORT_FIELD: {
      message: 'error.invalidSortField',
      code: 'INVALID_SORT_FIELD',
    },
    INVALID_FILTER_VALUES: {
      message: 'error.invalidFilterValues',
      code: 'INVALID_FILTER_VALUES',
    },
    DATABASE_ERROR: {
      message: 'error.databaseError',
      code: 'DATABASE_ERROR',
    },
    EQUIPMENT_NOT_FOUND: {
      message: 'error.equipmentNotFound',
      code: 'EQUIPMENT_NOT_FOUND',
    },
    INVALID_EQUIPMENT_ID: {
      message: 'error.invalidEquipmentId',
      code: 'INVALID_EQUIPMENT_ID',
    },
    EQUIPMENT_ARCHIVED: {
      message: 'error.equipment.archived',
      code: 'EQUIPMENT_ARCHIVED',
    },
    CONCURRENT_UPDATE_DETECTED: {
      message: 'error.concurrentUpdateDetected',
      code: 'CONCURRENT_UPDATE_DETECTED',
    },
    CANNOT_CHANGE_CATEGORY_WITH_BOOKINGS: {
      message: 'error.equipment.cannotChangeCategoryWithBookings',
      code: 'CANNOT_CHANGE_CATEGORY_WITH_BOOKINGS',
    },
    STATUS_INVALID: {
      message: 'error.equipment.statusInvalid',
      code: 'STATUS_INVALID',
    },
    EQUIPMENT_ALREADY_ARCHIVED: {
      message: 'error.equipment.alreadyArchived',
      code: 'EQUIPMENT_ALREADY_ARCHIVED',
    },
  };

  async listCategories(tenantId: string, activeOnly: boolean, correlationId: string): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.listCategories({
          tenantId,
          activeOnly,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        // Throw appropriate exception based on error type
        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async viewCategories(
    tenantId: string,
    page: number,
    pageSize: number,
    search: string | undefined,
    status: string | undefined,
    hierarchyLevel: string | undefined,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.viewCategories({
          tenantId,
          page,
          pageSize,
          search: search || '',
          status: status || 'all',
          hierarchyLevel: hierarchyLevel || 'all',
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        // Throw appropriate exception based on error type
        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async createCategory(
    createCategoryDto: CreateCategoryRequestDto,
    tenantId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.createCategory({
          name: createCategoryDto.name.trim(),
          description: createCategoryDto.description?.trim(),
          parentId: createCategoryDto.parentId,
          isActive: createCategoryDto.isActive,
          tenantId,
          createdBy: userId,
          ipAddress,
          userAgent,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        // Throw appropriate exception based on error type
        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async updateCategory(
    categoryId: string,
    updateCategoryDto: UpdateCategoryRequestDto,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Updating category ${categoryId} for tenant ${tenantId}`);
      this.logger.debug(`Update data: ${JSON.stringify(updateCategoryDto)}`);

      // Track fields explicitly set to null so the equipment-service
      // can distinguish "not sent" from "clear this field" (proto3 strips null)
      const clearedFields: string[] = [];
      if (updateCategoryDto.description === null || updateCategoryDto.description === undefined) {
        clearedFields.push('description');
      }
      if (updateCategoryDto.parentId === null || updateCategoryDto.parentId === undefined) {
        clearedFields.push('parentId');
      }

      const response = (await firstValueFrom(
        this.equipmentService.updateCategory({
          categoryId,
          tenantId,
          userId,
          name: updateCategoryDto.name.trim(),
          description: updateCategoryDto.description
            ? updateCategoryDto.description.trim()
            : updateCategoryDto.description,
          parentId: updateCategoryDto.parentId,
          isActive: updateCategoryDto.isActive,
          correlationId,
          clearedFields,
        }),
      )) as any;

      this.logger.debug(`Equipment service response: ${JSON.stringify(response)}`);

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        // Throw appropriate exception based on error type
        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.conflictErrorCodes.has(response.code)) {
          throw new ConflictException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error updating category: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async deactivateCategory(
    categoryId: string,
    deactivateDto: DeactivateCategoryRequestDto,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Deactivating category ${categoryId} for tenant ${tenantId}`);

      const response = (await firstValueFrom(
        this.equipmentService.deactivateCategory({
          categoryId,
          tenantId,
          userId,
          reason: deactivateDto.reason,
          correlationId,
        }),
      )) as any;

      this.logger.debug(`Equipment service response: ${JSON.stringify(response)}`);

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
            ...(response.code === 'CANNOT_DEACTIVATE_CATEGORY_WITH_EQUIPMENT' && {
              details: { equipmentCount: response.equipmentCount || 0 },
            }),
          });
        }

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error deactivating category: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async reactivateCategory(
    categoryId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Reactivating category ${categoryId} for tenant ${tenantId}`);

      const response = (await firstValueFrom(
        this.equipmentService.reactivateCategory({
          categoryId,
          tenantId,
          userId,
          correlationId,
        }),
      )) as any;

      this.logger.debug(`Equipment service response: ${JSON.stringify(response)}`);

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error reactivating category: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async deleteCategory(
    categoryId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Deleting category ${categoryId} for tenant ${tenantId}`);

      const response = (await firstValueFrom(
        this.equipmentService.deleteCategory({
          categoryId,
          tenantId,
          userId,
          correlationId,
        }),
      )) as any;

      this.logger.debug(`Equipment service response: ${JSON.stringify(response)}`);

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
            ...(response.code === 'CANNOT_DELETE_CATEGORY_WITH_CHILDREN' && {
              details: { childCategories: response.childCategories || [] },
            }),
            ...(response.code === 'CANNOT_DELETE_CATEGORY_WITH_EQUIPMENT' && {
              details: { equipmentCount: response.equipmentCount || 0 },
            }),
          });
        }

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error deleting category: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async createEquipment(
    dto: CreateEquipmentRequestDto,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.createEquipment({
          tenantId,
          userId,
          name: dto.name,
          categoryId: dto.categoryId,
          description: dto.description || null,
          manufacturer: dto.manufacturer || null,
          model: dto.model || null,
          serialNumber: dto.serialNumber || null,
          yearOfManufacture: dto.yearOfManufacture || null,
          purchasePrice: dto.purchasePrice || null,
          purchaseDate: dto.purchaseDate || null,
          status: dto.status || 'Available',
          customAttributes:
            dto.customAttributes?.map((attr) => ({
              key: attr.key,
              value: attr.value,
              unit: attr.unit ?? null,
            })) || null,
          correlationId,
        }),
      )) as any;

      this.logger.debug(`Equipment service response: ${JSON.stringify(response)}`);

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.conflictErrorCodes.has(response.code)) {
          throw new ConflictException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error creating equipment: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async listEquipment(
    tenantId: string,
    userId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
    filters: {
      status?: string[];
      categoryId?: string[];
      manufacturer?: string;
      searchQuery?: string;
      purchaseDateFrom?: string;
      purchaseDateTo?: string;
      createdDateFrom?: string;
      createdDateTo?: string;
    },
    correlationId: string,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.listEquipment({
          tenantId,
          userId,
          page: page || 1,
          limit: limit || 20,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
          filters: {
            status: filters.status,
            categoryId: filters.categoryId,
            manufacturer: filters.manufacturer,
            searchQuery: filters.searchQuery,
            purchaseDateFrom: filters.purchaseDateFrom,
            purchaseDateTo: filters.purchaseDateTo,
            createdDateFrom: filters.createdDateFrom,
            createdDateTo: filters.createdDateTo,
          },
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async getEquipmentDetails(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.getEquipmentDetails({
          equipmentId,
          tenantId,
          userId,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error getting equipment details: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async updateEquipment(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
    updateData: {
      name: string;
      categoryId: string;
      description: string | null;
      manufacturer: string | null;
      model: string | null;
      serialNumber: string | null;
      yearOfManufacture: number | null;
      purchasePrice: number | null;
      purchaseDate: string | null;
      status: string;
      customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
    },
  ): Promise<any> {
    try {
      // Track fields explicitly set to null so the equipment-service
      // can distinguish "not sent" from "clear this field" (proto3 strips null)
      const clearedFields: string[] = [];
      const nullableFields = [
        'description', 'manufacturer', 'model', 'serialNumber',
        'yearOfManufacture', 'purchasePrice', 'purchaseDate',
      ] as const;
      for (const field of nullableFields) {
        if (updateData[field] === null || updateData[field] === undefined) {
          clearedFields.push(field);
        }
      }

      const response = (await firstValueFrom(
        this.equipmentService.updateEquipment({
          equipmentId,
          tenantId,
          userId,
          correlationId,
          ...updateData,
          clearedFields,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.conflictErrorCodes.has(response.code)) {
          throw new ConflictException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.goneErrorCodes.has(response.code)) {
          throw new GoneException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error updating equipment: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof GoneException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async updateEquipmentStatus(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
    status: string,
    reason: string | null,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.updateEquipmentStatus({
          equipmentId,
          tenantId,
          userId,
          correlationId,
          status,
          reason,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.goneErrorCodes.has(response.code)) {
          throw new GoneException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error updating equipment status: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof GoneException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async archiveEquipment(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
    reason: string | null,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.archiveEquipment({
          equipmentId,
          tenantId,
          userId,
          correlationId,
          reason,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.goneErrorCodes.has(response.code)) {
          throw new GoneException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error archiving equipment: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof GoneException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  async deleteEquipmentPermanently(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<any> {
    try {
      const response = (await firstValueFrom(
        this.equipmentService.deleteEquipmentPermanently({
          equipmentId,
          tenantId,
          userId,
          correlationId,
        }),
      )) as any;

      if (!response.success) {
        const errorMapping =
          this.errorCodeMap[response.code as string] || this.errorCodeMap['INTERNAL_ERROR'];

        if (this.notFoundErrorCodes.has(response.code)) {
          throw new NotFoundException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        if (this.validationErrorCodes.has(response.code)) {
          throw new BadRequestException({
            message: errorMapping.message,
            code: errorMapping.code,
          });
        }

        throw new InternalServerErrorException({
          message: errorMapping.message,
          code: errorMapping.code,
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error deleting equipment permanently: ${error.message}`, error.stack);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: 'error.internalServerError',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}
