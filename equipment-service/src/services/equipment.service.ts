import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { Equipment } from '../entities/equipment.entity';
import { EquipmentCategory } from '../entities/equipment-category.entity';
import { CreateEquipmentRequestDto } from '../dto/category.dto';
import { IEquipmentItem, IEquipmentDetailsItem } from '../interfaces/grpc.interface';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(EquipmentCategory)
    private readonly categoryRepository: Repository<EquipmentCategory>,
  ) {}

  async createEquipment(dto: CreateEquipmentRequestDto): Promise<IEquipmentItem> {
    try {
      this.validateEquipmentData(dto);

      const category = await this.validateAndGetCategory(dto.categoryId, dto.tenantId);

      if (dto.serialNumber) {
        await this.checkSerialNumberUniqueness(dto.tenantId, dto.serialNumber);
      }

      if (dto.purchaseDate) {
        this.validatePurchaseDate(dto.purchaseDate);
      }

      const equipment = this.equipmentRepository.create({
        tenantId: dto.tenantId,
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        description: dto.description || null,
        manufacturer: dto.manufacturer || null,
        model: dto.model || null,
        serialNumber: dto.serialNumber || null,
        yearOfManufacture: dto.yearOfManufacture || null,
        purchasePrice: dto.purchasePrice || null,
        purchaseDate: dto.purchaseDate || null,
        status: dto.status,
        customAttributes: dto.customAttributes || null,
        createdBy: dto.userId,
      });

      const savedEquipment = await this.equipmentRepository.save(equipment);

      return {
        id: savedEquipment.id,
        tenantId: savedEquipment.tenantId,
        name: savedEquipment.name,
        categoryId: savedEquipment.categoryId,
        categoryName: category.name,
        description: savedEquipment.description,
        manufacturer: savedEquipment.manufacturer,
        model: savedEquipment.model,
        serialNumber: savedEquipment.serialNumber,
        yearOfManufacture: savedEquipment.yearOfManufacture,
        purchasePrice: savedEquipment.purchasePrice,
        purchaseDate: savedEquipment.purchaseDate,
        status: savedEquipment.status,
        customAttributes: savedEquipment.customAttributes,
        createdBy: savedEquipment.createdBy,
        createdAt: savedEquipment.createdAt.toISOString(),
        updatedAt: savedEquipment.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'EQUIPMENT_CREATION_FAILED',
        message: 'Failed to create equipment',
      });
    }
  }

  private validateEquipmentData(dto: CreateEquipmentRequestDto): void {
    const trimmedName = dto.name.trim();

    if (!trimmedName || trimmedName.length === 0) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.nameRequired',
      });
    }

    if (trimmedName.length > 200) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.nameLength',
      });
    }

    if (dto.description && dto.description.length > 2000) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.descriptionLength',
      });
    }

    if (dto.manufacturer && dto.manufacturer.length > 100) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.manufacturerLength',
      });
    }

    if (dto.model && dto.model.length > 100) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.modelLength',
      });
    }

    if (dto.serialNumber && dto.serialNumber.length > 100) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.serialNumberLength',
      });
    }

    if (dto.yearOfManufacture !== null && dto.yearOfManufacture !== undefined) {
      const currentYear = new Date().getFullYear();
      if (dto.yearOfManufacture < 1900 || dto.yearOfManufacture > currentYear) {
        throw new RpcException({
          code: 'VALIDATION_FAILED',
          message: 'error.equipment.yearInvalid',
        });
      }
    }

    if (dto.purchasePrice !== null && dto.purchasePrice !== undefined && dto.purchasePrice < 0) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.purchasePriceInvalid',
      });
    }

    const validStatuses = ['Available', 'Rented', 'Maintenance', 'Out of Service'];
    if (!validStatuses.includes(dto.status)) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.statusInvalid',
      });
    }

    if (dto.customAttributes) {
      for (const attr of dto.customAttributes) {
        if (attr.key.length > 100) {
          throw new RpcException({
            code: 'VALIDATION_FAILED',
            message: 'error.equipment.customAttributeKeyLength',
          });
        }
        if (attr.value.length > 500) {
          throw new RpcException({
            code: 'VALIDATION_FAILED',
            message: 'error.equipment.customAttributeValueLength',
          });
        }
      }
    }
  }

  private async validateAndGetCategory(
    categoryId: string,
    tenantId: string,
  ): Promise<EquipmentCategory> {
    const category = await this.categoryRepository.findOne({
      where: {
        id: categoryId,
        tenantId,
        deletedAt: IsNull(),
      },
    });

    if (!category) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'error.equipment.categoryNotFound',
      });
    }

    if (!category.isActive) {
      throw new RpcException({
        code: 'CATEGORY_INACTIVE',
        message: 'error.equipment.categoryInactive',
      });
    }

    return category;
  }

  private async checkSerialNumberUniqueness(tenantId: string, serialNumber: string): Promise<void> {
    const existing = await this.equipmentRepository.findOne({
      where: {
        tenantId,
        serialNumber,
        deletedAt: IsNull(),
      },
    });

    if (existing) {
      throw new RpcException({
        code: 'SERIAL_NUMBER_EXISTS',
        message: 'error.equipment.serialNumberExists',
      });
    }
  }

  private validatePurchaseDate(purchaseDate: string): void {
    const date = new Date(purchaseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      throw new RpcException({
        code: 'VALIDATION_FAILED',
        message: 'error.equipment.purchaseDateFuture',
      });
    }
  }

  async listEquipment(
    tenantId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    filters: {
      status?: string[];
      categoryId?: string[];
      manufacturer?: string;
      searchQuery?: string;
      purchaseDateFrom?: string;
      purchaseDateTo?: string;
      createdDateFrom?: string;
      createdDateTo?: string;
    } = {},
  ): Promise<{
    items: Array<{
      id: string;
      name: string;
      categoryId: string;
      categoryPath: string;
      serialNumber: string | null;
      status: string;
      manufacturer: string | null;
      model: string | null;
      yearOfManufacture: number | null;
      purchasePrice: number | null;
      purchaseDate: string | null;
      description: string | null;
      customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    try {
      this.validateListParams(page, limit, sortBy, sortOrder, filters);

      const queryBuilder = this.equipmentRepository
        .createQueryBuilder('equipment')
        .leftJoinAndSelect('equipment.category', 'category')
        .where('equipment.tenantId = :tenantId', { tenantId })
        .andWhere('equipment.deletedAt IS NULL');

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        queryBuilder.andWhere('equipment.status IN (:...statuses)', { statuses: filters.status });
      }

      if (filters.categoryId && filters.categoryId.length > 0) {
        queryBuilder.andWhere('equipment.categoryId IN (:...categoryIds)', { categoryIds: filters.categoryId });
      }

      if (filters.manufacturer) {
        queryBuilder.andWhere('LOWER(equipment.manufacturer) LIKE LOWER(:manufacturer)', {
          manufacturer: `%${filters.manufacturer}%`,
        });
      }

      if (filters.searchQuery) {
        queryBuilder.andWhere(
          '(LOWER(equipment.name) LIKE LOWER(:search) OR LOWER(equipment.serialNumber) LIKE LOWER(:search) OR LOWER(equipment.model) LIKE LOWER(:search) OR LOWER(equipment.description) LIKE LOWER(:search))',
          { search: `%${filters.searchQuery}%` },
        );
      }

      if (filters.purchaseDateFrom) {
        queryBuilder.andWhere('equipment.purchaseDate >= :purchaseDateFrom', {
          purchaseDateFrom: filters.purchaseDateFrom,
        });
      }

      if (filters.purchaseDateTo) {
        queryBuilder.andWhere('equipment.purchaseDate <= :purchaseDateTo', {
          purchaseDateTo: filters.purchaseDateTo,
        });
      }

      if (filters.createdDateFrom) {
        queryBuilder.andWhere('equipment.createdAt >= :createdDateFrom', {
          createdDateFrom: new Date(filters.createdDateFrom),
        });
      }

      if (filters.createdDateTo) {
        queryBuilder.andWhere('equipment.createdAt <= :createdDateTo', {
          createdDateTo: new Date(filters.createdDateTo),
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply sorting
      const sortField = this.mapSortField(sortBy);
      queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const equipmentList = await queryBuilder.getMany();

      // Build category paths
      const items = await Promise.all(
        equipmentList.map(async (equipment) => {
          const categoryPath = await this.buildCategoryPath(equipment.category);

          return {
            id: equipment.id,
            name: equipment.name,
            categoryId: equipment.categoryId,
            categoryPath,
            serialNumber: equipment.serialNumber,
            status: equipment.status,
            manufacturer: equipment.manufacturer,
            model: equipment.model,
            yearOfManufacture: equipment.yearOfManufacture,
            purchasePrice: equipment.purchasePrice ? Number(equipment.purchasePrice) : null,
            purchaseDate: equipment.purchaseDate,
            description: equipment.description,
            customAttributes: equipment.customAttributes,
            createdAt: equipment.createdAt.toISOString(),
            updatedAt: equipment.updatedAt.toISOString(),
          };
        }),
      );

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'DATABASE_ERROR',
        message: 'error.databaseError',
      });
    }
  }

  private validateListParams(
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
    filters: any,
  ): void {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new RpcException({
        code: 'INVALID_PAGINATION',
        message: 'error.invalidPagination',
      });
    }

    const validSortFields = ['name', 'status', 'createdAt', 'purchaseDate'];
    if (!validSortFields.includes(sortBy)) {
      throw new RpcException({
        code: 'INVALID_SORT_FIELD',
        message: 'error.invalidSortField',
      });
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      throw new RpcException({
        code: 'INVALID_SORT_FIELD',
        message: 'error.invalidSortField',
      });
    }

    if (filters.status && filters.status.length > 0) {
      const validStatuses = ['Available', 'Rented', 'Maintenance', 'Out of Service'];
      for (const status of filters.status) {
        if (!validStatuses.includes(status)) {
          throw new RpcException({
            code: 'INVALID_FILTER_VALUES',
            message: 'error.invalidFilterValues',
          });
        }
      }
    }

    if (filters.createdDateFrom) {
      const date = new Date(filters.createdDateFrom);
      if (isNaN(date.getTime())) {
        throw new RpcException({
          code: 'INVALID_FILTER_VALUES',
          message: 'error.invalidFilterValues',
        });
      }
    }

    if (filters.createdDateTo) {
      const date = new Date(filters.createdDateTo);
      if (isNaN(date.getTime())) {
        throw new RpcException({
          code: 'INVALID_FILTER_VALUES',
          message: 'error.invalidFilterValues',
        });
      }
    }

    if (filters.purchaseDateFrom) {
      const date = new Date(filters.purchaseDateFrom);
      if (isNaN(date.getTime())) {
        throw new RpcException({
          code: 'INVALID_FILTER_VALUES',
          message: 'error.invalidFilterValues',
        });
      }
    }

    if (filters.purchaseDateTo) {
      const date = new Date(filters.purchaseDateTo);
      if (isNaN(date.getTime())) {
        throw new RpcException({
          code: 'INVALID_FILTER_VALUES',
          message: 'error.invalidFilterValues',
        });
      }
    }
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      name: 'equipment.name',
      status: 'equipment.status',
      createdAt: 'equipment.createdAt',
      purchaseDate: 'equipment.purchaseDate',
    };
    return fieldMap[sortBy] || 'equipment.createdAt';
  }

  private async buildCategoryPath(category: EquipmentCategory): Promise<string> {
    const path: string[] = [];
    let currentCategory: EquipmentCategory | null = category;

    while (currentCategory) {
      path.unshift(currentCategory.name);
      
      if (currentCategory.parentId) {
        currentCategory = await this.categoryRepository.findOne({
          where: { id: currentCategory.parentId },
        });
      } else {
        currentCategory = null;
      }
    }

    return path.join(' > ');
  }

  async getEquipmentDetails(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<{
    id: string;
    tenantId: string;
    name: string;
    categoryId: string;
    categoryName: string;
    categoryPath: string;
    description: string | null;
    manufacturer: string | null;
    model: string | null;
    serialNumber: string | null;
    yearOfManufacture: number | null;
    purchasePrice: number | null;
    purchaseDate: string | null;
    status: string;
    customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
    createdBy: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(equipmentId)) {
        throw new RpcException({
          code: 'INVALID_EQUIPMENT_ID',
          message: 'error.invalidEquipmentId',
        });
      }

      const equipment = await this.equipmentRepository.findOne({
        where: {
          id: equipmentId,
          tenantId,
        },
        relations: ['category'],
      });

      if (!equipment) {
        throw new RpcException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'error.equipmentNotFound',
        });
      }

      const categoryPath = await this.buildCategoryPath(equipment.category);

      let categoryName = equipment.category.name;
      if (!equipment.category.isActive) {
        categoryName += ' (Inactive)';
      } else if (equipment.category.deletedAt) {
        categoryName += ' (Deleted)';
      }

      return {
        id: equipment.id,
        tenantId: equipment.tenantId,
        name: equipment.name,
        categoryId: equipment.categoryId,
        categoryName,
        categoryPath,
        description: equipment.description,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        yearOfManufacture: equipment.yearOfManufacture,
        purchasePrice: equipment.purchasePrice ? Number(equipment.purchasePrice) : null,
        purchaseDate: equipment.purchaseDate,
        status: equipment.status,
        customAttributes: equipment.customAttributes,
        createdBy: equipment.createdBy,
        updatedBy: equipment.updatedBy,
        createdAt: equipment.createdAt.toISOString(),
        updatedAt: equipment.updatedAt.toISOString(),
        deletedAt: equipment.deletedAt ? equipment.deletedAt.toISOString() : null,
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'DATABASE_ERROR',
        message: 'error.databaseError',
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
    clearedFields?: string[],
  ): Promise<{
    equipment: IEquipmentDetailsItem;
    category: { id: string; name: string; path: string; isActive: boolean };
    changes: { oldValues: Record<string, any>; newValues: Record<string, any> };
  }> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(equipmentId)) {
        throw new RpcException({
          code: 'INVALID_EQUIPMENT_ID',
          message: 'error.invalidEquipmentId',
        });
      }

      this.validateEquipmentData({
        ...updateData,
        tenantId,
        userId,
        correlationId,
      } as any);

      const existingEquipment = await this.equipmentRepository.findOne({
        where: {
          id: equipmentId,
          tenantId,
        },
        relations: ['category'],
      });

      if (!existingEquipment) {
        throw new RpcException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'error.equipmentNotFound',
        });
      }

      if (existingEquipment.deletedAt) {
        throw new RpcException({
          code: 'EQUIPMENT_ARCHIVED',
          message: 'error.equipment.archived',
        });
      }

      const newCategory = await this.validateAndGetCategory(updateData.categoryId, tenantId);

      if (updateData.serialNumber && updateData.serialNumber !== existingEquipment.serialNumber) {
        const existing = await this.equipmentRepository
          .createQueryBuilder('equipment')
          .where('equipment.tenantId = :tenantId', { tenantId })
          .andWhere('equipment.serialNumber = :serialNumber', { serialNumber: updateData.serialNumber })
          .andWhere('equipment.id != :excludeId', { excludeId: equipmentId })
          .andWhere('equipment.deletedAt IS NULL')
          .getOne();

        if (existing) {
          throw new RpcException({
            code: 'SERIAL_NUMBER_EXISTS',
            message: 'error.equipment.serialNumberExists',
          });
        }
      }

      if (updateData.purchaseDate) {
        this.validatePurchaseDate(updateData.purchaseDate);
      }

      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      if (existingEquipment.name !== updateData.name.trim()) {
        oldValues.name = existingEquipment.name;
        newValues.name = updateData.name.trim();
      }

      if (existingEquipment.categoryId !== updateData.categoryId) {
        oldValues.categoryId = existingEquipment.categoryId;
        newValues.categoryId = updateData.categoryId;
      }

      // Resolve actual new values (proto3 strips null → use clearedFields to detect explicit null)
      const resolvedDescription = clearedFields?.includes('description') ? null : (updateData.description ?? existingEquipment.description);
      const resolvedManufacturer = clearedFields?.includes('manufacturer') ? null : (updateData.manufacturer ?? existingEquipment.manufacturer);
      const resolvedModel = clearedFields?.includes('model') ? null : (updateData.model ?? existingEquipment.model);
      const resolvedSerialNumber = clearedFields?.includes('serialNumber') ? null : (updateData.serialNumber ?? existingEquipment.serialNumber);
      const resolvedYearOfManufacture = clearedFields?.includes('yearOfManufacture') ? null : (updateData.yearOfManufacture ?? existingEquipment.yearOfManufacture);
      const resolvedPurchasePrice = clearedFields?.includes('purchasePrice') ? null : (updateData.purchasePrice ?? existingEquipment.purchasePrice);
      const resolvedPurchaseDate = clearedFields?.includes('purchaseDate') ? null : (updateData.purchaseDate ?? existingEquipment.purchaseDate);

      if (existingEquipment.description !== resolvedDescription) {
        oldValues.description = existingEquipment.description;
        newValues.description = resolvedDescription;
      }

      if (existingEquipment.manufacturer !== resolvedManufacturer) {
        oldValues.manufacturer = existingEquipment.manufacturer;
        newValues.manufacturer = resolvedManufacturer;
      }

      if (existingEquipment.model !== resolvedModel) {
        oldValues.model = existingEquipment.model;
        newValues.model = resolvedModel;
      }

      if (existingEquipment.serialNumber !== resolvedSerialNumber) {
        oldValues.serialNumber = existingEquipment.serialNumber;
        newValues.serialNumber = resolvedSerialNumber;
      }

      if (existingEquipment.yearOfManufacture !== resolvedYearOfManufacture) {
        oldValues.yearOfManufacture = existingEquipment.yearOfManufacture;
        newValues.yearOfManufacture = resolvedYearOfManufacture;
      }

      if (existingEquipment.purchasePrice !== resolvedPurchasePrice) {
        oldValues.purchasePrice = existingEquipment.purchasePrice;
        newValues.purchasePrice = resolvedPurchasePrice;
      }

      if (existingEquipment.purchaseDate !== resolvedPurchaseDate) {
        oldValues.purchaseDate = existingEquipment.purchaseDate;
        newValues.purchaseDate = resolvedPurchaseDate;
      }

      if (existingEquipment.status !== updateData.status) {
        oldValues.status = existingEquipment.status;
        newValues.status = updateData.status;
      }

      if (JSON.stringify(existingEquipment.customAttributes) !== JSON.stringify(updateData.customAttributes)) {
        oldValues.customAttributes = existingEquipment.customAttributes;
        newValues.customAttributes = updateData.customAttributes;
      }

      existingEquipment.name = updateData.name.trim();
      existingEquipment.categoryId = updateData.categoryId;
      existingEquipment.description = resolvedDescription;
      existingEquipment.manufacturer = resolvedManufacturer;
      existingEquipment.model = resolvedModel;
      existingEquipment.serialNumber = resolvedSerialNumber;
      existingEquipment.yearOfManufacture = resolvedYearOfManufacture;
      existingEquipment.purchasePrice = resolvedPurchasePrice;
      existingEquipment.purchaseDate = resolvedPurchaseDate;
      existingEquipment.status = updateData.status;
      existingEquipment.customAttributes = updateData.customAttributes;
      existingEquipment.updatedBy = userId;

      const updatedEquipment = await this.equipmentRepository.save(existingEquipment);

      const categoryPath = await this.buildCategoryPath(newCategory);

      let categoryName = newCategory.name;
      if (!newCategory.isActive) {
        categoryName += ' (Inactive)';
      } else if (newCategory.deletedAt) {
        categoryName += ' (Deleted)';
      }

      return {
        equipment: {
          id: updatedEquipment.id,
          tenantId: updatedEquipment.tenantId,
          name: updatedEquipment.name,
          categoryId: updatedEquipment.categoryId,
          categoryName,
          categoryPath,
          description: updatedEquipment.description,
          manufacturer: updatedEquipment.manufacturer,
          model: updatedEquipment.model,
          serialNumber: updatedEquipment.serialNumber,
          yearOfManufacture: updatedEquipment.yearOfManufacture,
          purchasePrice: updatedEquipment.purchasePrice ? Number(updatedEquipment.purchasePrice) : null,
          purchaseDate: updatedEquipment.purchaseDate,
          status: updatedEquipment.status,
          customAttributes: updatedEquipment.customAttributes,
          createdBy: updatedEquipment.createdBy,
          updatedBy: updatedEquipment.updatedBy,
          createdAt: updatedEquipment.createdAt.toISOString(),
          updatedAt: updatedEquipment.updatedAt.toISOString(),
          deletedAt: updatedEquipment.deletedAt ? updatedEquipment.deletedAt.toISOString() : null,
        },
        category: {
          id: newCategory.id,
          name: newCategory.name,
          path: categoryPath,
          isActive: newCategory.isActive,
        },
        changes: {
          oldValues,
          newValues,
        },
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'DATABASE_ERROR',
        message: 'error.databaseError',
      });
    }
  }

  async updateEquipmentStatus(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
    status: string,
    reason?: string | null,
  ): Promise<{
    equipment: {
      id: string;
      name: string;
      status: string;
      updatedBy: string;
      updatedAt: string;
    };
    statusChanged: boolean;
    oldStatus?: string;
  }> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(equipmentId)) {
        throw new RpcException({
          code: 'INVALID_EQUIPMENT_ID',
          message: 'error.invalidEquipmentId',
        });
      }

      const validStatuses = ['Available', 'Rented', 'Maintenance', 'Out of Service'];
      if (!validStatuses.includes(status)) {
        throw new RpcException({
          code: 'STATUS_INVALID',
          message: 'error.equipment.statusInvalid',
        });
      }

      if (reason && reason.length > 500) {
        throw new RpcException({
          code: 'VALIDATION_FAILED',
          message: 'error.equipment.reasonTooLong',
        });
      }

      const equipment = await this.equipmentRepository.findOne({
        where: {
          id: equipmentId,
          tenantId,
          deletedAt: IsNull(),
        },
      });

      if (!equipment) {
        throw new RpcException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'error.equipmentNotFound',
        });
      }

      const oldStatus = equipment.status;

      if (oldStatus === status) {
        return {
          equipment: {
            id: equipment.id,
            name: equipment.name,
            status: equipment.status,
            updatedBy: equipment.updatedBy || equipment.createdBy,
            updatedAt: equipment.updatedAt.toISOString(),
          },
          statusChanged: false,
        };
      }

      equipment.status = status;
      equipment.updatedBy = userId;

      if (reason) {
        const statusHistory = equipment.customAttributes
          ? [...(Array.isArray(equipment.customAttributes) ? [] : []), ...(equipment.customAttributes as any).statusHistory || []]
          : [];

        statusHistory.push({
          timestamp: new Date().toISOString(),
          oldStatus,
          newStatus: status,
          reason,
          userId,
        });

        equipment.customAttributes = {
          ...(equipment.customAttributes as any || {}),
          statusHistory,
        } as any;
      }

      const updatedEquipment = await this.equipmentRepository.save(equipment);

      return {
        equipment: {
          id: updatedEquipment.id,
          name: updatedEquipment.name,
          status: updatedEquipment.status,
          updatedBy: updatedEquipment.updatedBy!,
          updatedAt: updatedEquipment.updatedAt.toISOString(),
        },
        statusChanged: true,
        oldStatus,
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'DATABASE_ERROR',
        message: 'error.databaseError',
      });
    }
  }

  async archiveEquipment(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
    reason?: string | null,
  ): Promise<{
    equipment: {
      id: string;
      name: string;
      categoryId: string;
      categoryPath: string;
      status: string;
      deletedAt: string;
      deletedBy: string;
    };
    fullData: {
      description: string | null;
      manufacturer: string | null;
      model: string | null;
      serialNumber: string | null;
      yearOfManufacture: number | null;
      purchasePrice: number | null;
      purchaseDate: string | null;
      customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
      createdBy: string;
      createdAt: string;
      updatedBy: string | null;
      updatedAt: string;
    };
  }> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(equipmentId)) {
        throw new RpcException({
          code: 'INVALID_EQUIPMENT_ID',
          message: 'error.invalidEquipmentId',
        });
      }

      if (reason && reason.length > 500) {
        throw new RpcException({
          code: 'VALIDATION_FAILED',
          message: 'error.equipment.reasonTooLong',
        });
      }

      const equipment = await this.equipmentRepository.findOne({
        where: {
          id: equipmentId,
          tenantId,
        },
        relations: ['category'],
      });

      if (!equipment) {
        throw new RpcException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'error.equipmentNotFound',
        });
      }

      if (equipment.deletedAt) {
        throw new RpcException({
          code: 'EQUIPMENT_ALREADY_ARCHIVED',
          message: 'error.equipment.alreadyArchived',
        });
      }

      const categoryPath = await this.buildCategoryPath(equipment.category);

      const fullData = {
        description: equipment.description,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        yearOfManufacture: equipment.yearOfManufacture,
        purchasePrice: equipment.purchasePrice ? Number(equipment.purchasePrice) : null,
        purchaseDate: equipment.purchaseDate,
        customAttributes: equipment.customAttributes,
        createdBy: equipment.createdBy,
        createdAt: equipment.createdAt.toISOString(),
        updatedBy: equipment.updatedBy,
        updatedAt: equipment.updatedAt.toISOString(),
      };

      if (reason) {
        equipment.customAttributes = {
          ...(equipment.customAttributes as any || {}),
          deletionInfo: {
            deletedAt: new Date().toISOString(),
            deletedBy: userId,
            reason,
          },
        } as any;
      }

      equipment.deletedBy = userId;
      await this.equipmentRepository.softRemove(equipment);

      const archivedEquipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
        withDeleted: true,
      });

      return {
        equipment: {
          id: archivedEquipment!.id,
          name: archivedEquipment!.name,
          categoryId: archivedEquipment!.categoryId,
          categoryPath,
          status: archivedEquipment!.status,
          deletedAt: archivedEquipment!.deletedAt!.toISOString(),
          deletedBy: archivedEquipment!.deletedBy!,
        },
        fullData,
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'DATABASE_ERROR',
        message: 'error.databaseError',
      });
    }
  }

  async deleteEquipmentPermanently(
    equipmentId: string,
    tenantId: string,
    userId: string,
    correlationId: string,
  ): Promise<{
    deletedEquipment: {
      id: string;
      name: string;
      categoryPath: string;
      status: string;
    };
    fullData: {
      categoryId: string;
      description: string | null;
      manufacturer: string | null;
      model: string | null;
      serialNumber: string | null;
      yearOfManufacture: number | null;
      purchasePrice: number | null;
      purchaseDate: string | null;
      customAttributes: Array<{ key: string; value: string; unit: string | null }> | null;
      createdBy: string;
      createdAt: string;
      updatedBy: string | null;
      updatedAt: string;
      deletedAt: string | null;
      deletedBy: string | null;
    };
  }> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(equipmentId)) {
        throw new RpcException({
          code: 'INVALID_EQUIPMENT_ID',
          message: 'error.invalidEquipmentId',
        });
      }

      const equipment = await this.equipmentRepository.findOne({
        where: {
          id: equipmentId,
          tenantId,
        },
        relations: ['category'],
        withDeleted: true,
      });

      if (!equipment) {
        throw new RpcException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'error.equipmentNotFound',
        });
      }

      const categoryPath = await this.buildCategoryPath(equipment.category);

      const fullData = {
        categoryId: equipment.categoryId,
        description: equipment.description,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serialNumber: equipment.serialNumber,
        yearOfManufacture: equipment.yearOfManufacture,
        purchasePrice: equipment.purchasePrice ? Number(equipment.purchasePrice) : null,
        purchaseDate: equipment.purchaseDate,
        customAttributes: equipment.customAttributes,
        createdBy: equipment.createdBy,
        createdAt: equipment.createdAt.toISOString(),
        updatedBy: equipment.updatedBy,
        updatedAt: equipment.updatedAt.toISOString(),
        deletedAt: equipment.deletedAt ? equipment.deletedAt.toISOString() : null,
        deletedBy: equipment.deletedBy,
      };

      const deletedEquipment = {
        id: equipment.id,
        name: equipment.name,
        categoryPath,
        status: equipment.status,
      };

      await this.equipmentRepository.remove(equipment);

      return {
        deletedEquipment,
        fullData,
      };
    } catch (error) {
      if (error.error?.code || error.code) {
        throw error;
      }
      throw new RpcException({
        code: 'DATABASE_ERROR',
        message: 'error.databaseError',
      });
    }
  }
}
