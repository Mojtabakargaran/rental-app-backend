import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CategoryService } from '../services/category.service';
import { EquipmentService } from '../services/equipment.service';
import { EventPublisherService } from '../events/event-publisher.service';
import {
  IListCategoriesRequest,
  IListCategoriesResponse,
  ICreateCategoryRequest,
  ICreateCategoryResponse,
  IViewCategoriesRequest,
  IViewCategoriesResponse,
  IUpdateCategoryRequest,
  IUpdateCategoryResponse,
  IDeactivateCategoryRequest,
  IDeactivateCategoryResponse,
  IReactivateCategoryRequest,
  IReactivateCategoryResponse,
  IDeleteCategoryRequest,
  IDeleteCategoryResponse,
  ICreateEquipmentRequest,
  ICreateEquipmentResponse,
  IListEquipmentRequest,
  IListEquipmentResponse,
  IGetEquipmentDetailsRequest,
  IGetEquipmentDetailsResponse,
  IUpdateEquipmentRequest,
  IUpdateEquipmentResponse,
  IUpdateEquipmentStatusRequest,
  IUpdateEquipmentStatusResponse,
  IArchiveEquipmentRequest,
  IArchiveEquipmentResponse,
  IDeleteEquipmentPermanentlyRequest,
  IDeleteEquipmentPermanentlyResponse,
} from '../interfaces/grpc.interface';

@Controller()
export class EquipmentController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly equipmentService: EquipmentService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  @GrpcMethod('EquipmentService', 'ListCategories')
  async listCategories(request: IListCategoriesRequest): Promise<IListCategoriesResponse> {
    try {
      const categories = await this.categoryService.listCategories(
        request.tenantId,
        request.activeOnly,
      );

      return {
        success: true,
        categories,
      };
    } catch (error) {
      console.error('[ListCategories Error]', error);
      return {
        success: false,
        error: error.message || 'Failed to list categories',
        code: error.code || 'INTERNAL_ERROR',
      };
    }
  }

  @GrpcMethod('EquipmentService', 'CreateCategory')
  async createCategory(request: ICreateCategoryRequest): Promise<ICreateCategoryResponse> {
    try {
      const category = await this.categoryService.createCategory(request);

      await this.eventPublisher.publishCategoryCreated({
        categoryId: category.id,
        name: category.name,
        description: category.description,
        parentId: category.parentId,
        level: category.level,
        isActive: category.isActive,
        tenantId: request.tenantId,
        createdBy: request.createdBy,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        category,
      };
    } catch (error) {
      console.error('[CreateCategory Error]', error);
      
      // Extract code from RpcException
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to create category';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'ViewCategories')
  async viewCategories(request: IViewCategoriesRequest): Promise<IViewCategoriesResponse> {
    try {
      const { categories, pagination } = await this.categoryService.viewCategories(
        request.tenantId,
        request.page,
        request.pageSize,
        request.search,
        request.status,
        request.hierarchyLevel,
      );

      await this.eventPublisher.publishCategoriesViewed({
        userId: 'system',
        tenantId: request.tenantId,
        page: request.page,
        pageSize: request.pageSize,
        search: request.search,
        status: request.status,
        hierarchyLevel: request.hierarchyLevel,
        totalItems: pagination.totalItems,
        resultCount: categories.length,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        categories,
        pagination,
      };
    } catch (error) {
      console.error('[ViewCategories Error]', error);
      
      // Extract code from RpcException
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to view categories';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'UpdateCategory')
  async updateCategory(request: IUpdateCategoryRequest): Promise<IUpdateCategoryResponse> {
    try {
      const { category, beforeState } = await this.categoryService.updateCategory(request);

      await this.eventPublisher.publishCategoryUpdated({
        categoryId: request.categoryId,
        tenantId: request.tenantId,
        updatedBy: request.userId,
        before: beforeState,
        after: {
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          level: category.level,
          isActive: category.isActive,
          updatedAt: category.updatedAt,
        },
        correlationId: request.correlationId,
      });

      return {
        success: true,
        category,
      };
    } catch (error) {
      console.error('[UpdateCategory Error]', error);
      
      // Extract code from RpcException
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to update category';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'DeactivateCategory')
  async deactivateCategory(request: IDeactivateCategoryRequest): Promise<IDeactivateCategoryResponse> {
    try {
      const result = await this.categoryService.deactivateCategory(request);

      await this.eventPublisher.publishCategoryDeactivated({
        categoryId: result.id,
        tenantId: request.tenantId,
        deactivatedBy: request.userId,
        deactivatedAt: result.deactivatedAt,
        reason: request.reason || null,
        categoryName: result.name,
        parentId: result.parentId,
        level: result.level,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        category: {
          id: result.id,
          name: result.name,
          isActive: result.isActive,
          deactivatedAt: result.deactivatedAt,
        },
      };
    } catch (error) {
      console.error('[DeactivateCategory Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to deactivate category';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'ReactivateCategory')
  async reactivateCategory(request: IReactivateCategoryRequest): Promise<IReactivateCategoryResponse> {
    try {
      const result = await this.categoryService.reactivateCategory(request);

      await this.eventPublisher.publishCategoryReactivated({
        categoryId: result.id,
        tenantId: request.tenantId,
        reactivatedBy: request.userId,
        reactivatedAt: result.reactivatedAt,
        categoryName: result.name,
        parentId: result.parentId,
        level: result.level,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        category: {
          id: result.id,
          name: result.name,
          isActive: result.isActive,
          reactivatedAt: result.reactivatedAt,
        },
      };
    } catch (error) {
      console.error('[ReactivateCategory Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to reactivate category';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'DeleteCategory')
  async deleteCategory(request: IDeleteCategoryRequest): Promise<IDeleteCategoryResponse> {
    try {
      const result = await this.categoryService.deleteCategory(request);

      await this.eventPublisher.publishCategoryDeleted({
        categoryId: result.id,
        tenantId: request.tenantId,
        deletedBy: request.userId,
        deletedAt: result.deletedAt,
        categoryName: result.name,
        parentId: result.parentId,
        level: result.level,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        category: {
          id: result.id,
          name: result.name,
          deletedAt: result.deletedAt,
        },
      };
    } catch (error) {
      console.error('[DeleteCategory Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to delete category';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'CreateEquipment')
  async createEquipment(request: ICreateEquipmentRequest): Promise<ICreateEquipmentResponse> {
    try {
      const equipment = await this.equipmentService.createEquipment(request);

      await this.eventPublisher.publishEquipmentCreated({
        equipmentId: equipment.id,
        tenantId: equipment.tenantId,
        name: equipment.name,
        categoryId: equipment.categoryId,
        categoryName: equipment.categoryName,
        description: equipment.description,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        yearOfManufacture: equipment.yearOfManufacture,
        purchasePrice: equipment.purchasePrice,
        purchaseDate: equipment.purchaseDate,
        status: equipment.status,
        customAttributes: equipment.customAttributes,
        createdBy: equipment.createdBy,
        createdAt: equipment.createdAt,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        equipment,
      };
    } catch (error) {
      console.error('[CreateEquipment Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to create equipment';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'ListEquipment')
  async listEquipment(request: IListEquipmentRequest): Promise<IListEquipmentResponse> {
    try {
      const result = await this.equipmentService.listEquipment(
        request.tenantId,
        request.userId,
        request.page,
        request.limit,
        request.sortBy,
        request.sortOrder as 'asc' | 'desc',
        request.filters,
      );

      await this.eventPublisher.publishEquipmentListViewed({
        userId: request.userId,
        tenantId: request.tenantId,
        page: request.page,
        pageSize: request.limit,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
        filters: request.filters,
        totalItems: result.total,
        resultCount: result.items.length,
        correlationId: 'system',
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[ListEquipment Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to list equipment';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'GetEquipmentDetails')
  async getEquipmentDetails(request: IGetEquipmentDetailsRequest): Promise<IGetEquipmentDetailsResponse> {
    try {
      const equipment = await this.equipmentService.getEquipmentDetails(
        request.equipmentId,
        request.tenantId,
        request.userId,
        request.correlationId,
      );

      await this.eventPublisher.publishEquipmentDetailsViewed({
        userId: request.userId,
        tenantId: request.tenantId,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        categoryId: equipment.categoryId,
        categoryPath: equipment.categoryPath,
        status: equipment.status,
        isArchived: equipment.deletedAt !== null,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        equipment,
      };
    } catch (error) {
      console.error('[GetEquipmentDetails Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to get equipment details';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'UpdateEquipment')
  async updateEquipment(request: IUpdateEquipmentRequest): Promise<IUpdateEquipmentResponse> {
    try {
      const result = await this.equipmentService.updateEquipment(
        request.equipmentId,
        request.tenantId,
        request.userId,
        request.correlationId,
        {
          name: request.name,
          categoryId: request.categoryId,
          description: request.description,
          manufacturer: request.manufacturer,
          model: request.model,
          serialNumber: request.serialNumber,
          yearOfManufacture: request.yearOfManufacture,
          purchasePrice: request.purchasePrice,
          purchaseDate: request.purchaseDate,
          status: request.status,
          customAttributes: request.customAttributes,
        },
        request.clearedFields,
      );

      await this.eventPublisher.publishEquipmentUpdated({
        userId: request.userId,
        tenantId: request.tenantId,
        equipmentId: result.equipment.id,
        equipmentName: result.equipment.name,
        categoryId: result.category.id,
        categoryPath: result.category.path,
        status: result.equipment.status,
        changes: result.changes,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        equipment: result.equipment,
      };
    } catch (error) {
      console.error('[UpdateEquipment Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to update equipment';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'UpdateEquipmentStatus')
  async updateEquipmentStatus(request: IUpdateEquipmentStatusRequest): Promise<IUpdateEquipmentStatusResponse> {
    try {
      const result = await this.equipmentService.updateEquipmentStatus(
        request.equipmentId,
        request.tenantId,
        request.userId,
        request.correlationId,
        request.status,
        request.reason,
      );

      if (result.statusChanged) {
        const equipment = await this.equipmentService.getEquipmentDetails(
          request.equipmentId,
          request.tenantId,
          request.userId,
          request.correlationId,
        );

        await this.eventPublisher.publishEquipmentStatusChanged({
          userId: request.userId,
          tenantId: request.tenantId,
          equipmentId: result.equipment.id,
          equipmentName: result.equipment.name,
          categoryId: equipment.categoryId,
          categoryPath: equipment.categoryPath,
          oldStatus: result.oldStatus!,
          newStatus: result.equipment.status,
          reason: request.reason || null,
          correlationId: request.correlationId,
        });
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[UpdateEquipmentStatus Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to update equipment status';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'ArchiveEquipment')
  async archiveEquipment(request: IArchiveEquipmentRequest): Promise<IArchiveEquipmentResponse> {
    try {
      const result = await this.equipmentService.archiveEquipment(
        request.equipmentId,
        request.tenantId,
        request.userId,
        request.correlationId,
        request.reason,
      );

      await this.eventPublisher.publishEquipmentArchived({
        userId: request.userId,
        tenantId: request.tenantId,
        equipmentId: result.equipment.id,
        equipmentName: result.equipment.name,
        categoryId: result.equipment.categoryId,
        categoryPath: result.equipment.categoryPath,
        status: result.equipment.status,
        reason: request.reason || null,
        deletedAt: result.equipment.deletedAt,
        deletedBy: result.equipment.deletedBy,
        fullEquipmentData: result.fullData,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[ArchiveEquipment Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to archive equipment';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }

  @GrpcMethod('EquipmentService', 'DeleteEquipmentPermanently')
  async deleteEquipmentPermanently(request: IDeleteEquipmentPermanentlyRequest): Promise<IDeleteEquipmentPermanentlyResponse> {
    try {
      const result = await this.equipmentService.deleteEquipmentPermanently(
        request.equipmentId,
        request.tenantId,
        request.userId,
        request.correlationId,
      );

      await this.eventPublisher.publishEquipmentDeletedPermanently({
        userId: request.userId,
        tenantId: request.tenantId,
        equipmentId: result.deletedEquipment.id,
        equipmentName: result.deletedEquipment.name,
        categoryId: result.fullData.categoryId,
        categoryPath: result.deletedEquipment.categoryPath,
        status: result.deletedEquipment.status,
        fullEquipmentData: result.fullData,
        correlationId: request.correlationId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[DeleteEquipmentPermanently Error]', error);
      
      const errorCode = error.error?.code || error.code || 'INTERNAL_ERROR';
      const errorMessage = error.error?.message || error.message || 'Failed to delete equipment permanently';
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }
  }
}

