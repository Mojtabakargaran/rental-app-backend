import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, SelectQueryBuilder } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { EquipmentCategory } from '../entities/equipment-category.entity';
import {
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
  DeactivateCategoryRequestDto,
  ReactivateCategoryRequestDto,
  DeleteCategoryRequestDto,
} from '../dto/category.dto';
import { ICategoryItem, ICategoryItemWithDetails, IPaginationInfo } from '../interfaces/grpc.interface';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(EquipmentCategory)
    private readonly categoryRepository: Repository<EquipmentCategory>,
  ) {}

  async listCategories(tenantId: string, activeOnly: boolean): Promise<ICategoryItem[]> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.tenantId = :tenantId', { tenantId })
      .andWhere('category.deletedAt IS NULL');

    if (activeOnly) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    queryBuilder.orderBy('category.level', 'ASC').addOrderBy('category.name', 'ASC');

    const categories = await queryBuilder.getMany();

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      parentId: cat.parentId,
      level: cat.level,
      isActive: cat.isActive,
    }));
  }

  async createCategory(dto: CreateCategoryRequestDto): Promise<ICategoryItem> {
    try {
      const trimmedName = dto.name.trim();

      this.validateCategoryName(trimmedName);

      if (dto.description) {
        this.validateDescription(dto.description);
      }

      await this.checkNameUniqueness(dto.tenantId, trimmedName);

      let level = 1;
      let parentCategory: EquipmentCategory | null = null;

      if (dto.parentId) {
        parentCategory = await this.validateAndGetParent(dto.parentId, dto.tenantId);
        level = parentCategory.level + 1;

        if (level > 3) {
          throw new RpcException({
            code: 'MAX_HIERARCHY_DEPTH_EXCEEDED',
            message: 'Maximum hierarchy depth (3 levels) exceeded',
          });
        }
      }

      const category = this.categoryRepository.create({
        tenantId: dto.tenantId,
        parentId: dto.parentId || null,
        name: trimmedName,
        description: dto.description || null,
        level,
        isActive: dto.isActive,
        createdBy: dto.createdBy,
      });

      const savedCategory = await this.categoryRepository.save(category);

      return {
        id: savedCategory.id,
        name: savedCategory.name,
        description: savedCategory.description,
        parentId: savedCategory.parentId,
        level: savedCategory.level,
        isActive: savedCategory.isActive,
      };
    } catch (error) {
      // If it's already an RpcException, rethrow it
      if (error.error?.code || error.code) {
        throw error;
      }
      // Otherwise, wrap database errors
      throw new RpcException({
        code: 'CATEGORY_CREATION_FAILED',
        message: error.message || 'Failed to create category',
      });
    }
  }

  private validateCategoryName(name: string): void {
    if (name.length < 2) {
      throw new RpcException({
        code: 'CATEGORY_NAME_TOO_SHORT',
        message: 'Category name must be at least 2 characters',
      });
    }

    if (name.length > 100) {
      throw new RpcException({
        code: 'CATEGORY_NAME_TOO_LONG',
        message: 'Category name must not exceed 100 characters',
      });
    }

    // Allow English letters, numbers, Persian/Arabic characters, spaces, underscores, and hyphens
    const validNameRegex = /^[A-Za-z0-9\u0600-\u06FF\u0750-\u077F _-]+$/;
    if (!validNameRegex.test(name)) {
      throw new RpcException({
        code: 'INVALID_CATEGORY_NAME',
        message: 'Category name contains invalid characters',
      });
    }
  }

  private validateDescription(description: string): void {
    if (description.length > 500) {
      throw new RpcException({
        code: 'DESCRIPTION_TOO_LONG',
        message: 'Description must not exceed 500 characters',
      });
    }
  }

  private async checkNameUniqueness(tenantId: string, name: string): Promise<void> {
    const existing = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.tenantId = :tenantId', { tenantId })
      .andWhere('LOWER(category.name) = LOWER(:name)', { name })
      .andWhere('category.deletedAt IS NULL')
      .getOne();

    if (existing) {
      throw new RpcException({
        code: 'CATEGORY_NAME_EXISTS',
        message: 'Category name already exists',
      });
    }
  }

  private async validateAndGetParent(
    parentId: string,
    tenantId: string,
  ): Promise<EquipmentCategory> {
    const parent = await this.categoryRepository.findOne({
      where: { id: parentId, deletedAt: IsNull() },
    });

    if (!parent) {
      throw new RpcException({
        code: 'PARENT_CATEGORY_NOT_FOUND',
        message: 'Parent category does not exist',
      });
    }

    if (parent.tenantId !== tenantId) {
      throw new RpcException({
        code: 'PARENT_TENANT_MISMATCH',
        message: 'Parent category belongs to different tenant',
      });
    }

    if (!parent.isActive) {
      throw new RpcException({
        code: 'PARENT_CATEGORY_INACTIVE',
        message: 'Parent category is not active',
      });
    }

    return parent;
  }

  async viewCategories(
    tenantId: string,
    page: number,
    pageSize: number,
    search?: string,
    status?: string,
    hierarchyLevel?: string,
  ): Promise<{ categories: ICategoryItemWithDetails[]; pagination: IPaginationInfo }> {
    if (page < 1) {
      throw new RpcException({
        code: 'INVALID_PARAMETERS',
        message: 'Page number must be at least 1',
      });
    }

    if (pageSize < 1 || pageSize > 100) {
      throw new RpcException({
        code: 'INVALID_PARAMETERS',
        message: 'Page size must be between 1 and 100',
      });
    }

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('c')
      .leftJoin('equipment_categories', 'p', 'c.parentId = p.id')
      .addSelect('p.name', 'parentName')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.deletedAt IS NULL');

    if (search && search.trim()) {
      queryBuilder.andWhere('c.name ILIKE :search', { search: `%${search.trim()}%` });
    }

    if (status === 'active') {
      queryBuilder.andWhere('c.isActive = :isActive', { isActive: true });
    } else if (status === 'inactive') {
      queryBuilder.andWhere('c.isActive = :isActive', { isActive: false });
    }

    if (hierarchyLevel === 'top-level') {
      queryBuilder.andWhere('c.parentId IS NULL');
    } else if (hierarchyLevel === 'sub-categories') {
      queryBuilder.andWhere('c.parentId IS NOT NULL');
    }

    const totalItems = await queryBuilder.getCount();

    const offset = (page - 1) * pageSize;
    queryBuilder
      .orderBy('c.name', 'ASC')
      .limit(pageSize)
      .offset(offset);

    const results = await queryBuilder.getRawAndEntities();

    const categoryIds = results.entities.map((c) => c.id);
    const childrenCounts = await this.getChildrenCounts(categoryIds);

    const categories: ICategoryItemWithDetails[] = results.raw.map((row, index) => ({
      id: results.entities[index].id,
      name: results.entities[index].name,
      description: results.entities[index].description || null,
      parentId: results.entities[index].parentId || null,
      parentName: row.parentName || null,
      level: results.entities[index].level,
      isActive: results.entities[index].isActive,
      createdAt: results.entities[index].createdAt.toISOString(),
      childrenCount: childrenCounts[results.entities[index].id] || 0,
    }));

    const totalPages = Math.ceil(totalItems / pageSize);

    const pagination: IPaginationInfo = {
      currentPage: page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return { categories, pagination };
  }

  private async getChildrenCounts(parentIds: string[]): Promise<Record<string, number>> {
    if (parentIds.length === 0) {
      return {};
    }

    const results = await this.categoryRepository
      .createQueryBuilder('category')
      .select('category.parentId', 'parentId')
      .addSelect('COUNT(*)', 'count')
      .where('category.parentId IN (:...parentIds)', { parentIds })
      .andWhere('category.deletedAt IS NULL')
      .groupBy('category.parentId')
      .getRawMany();

    const counts: Record<string, number> = {};
    results.forEach((r) => {
      counts[r.parentId] = parseInt(r.count, 10);
    });
    return counts;
  }

  async updateCategory(dto: UpdateCategoryRequestDto): Promise<{
    category: ICategoryItem & { parentName: string | null; updatedAt: string };
    beforeState: any;
  }> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
    });

    if (!existingCategory) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category does not exist',
      });
    }

    const beforeState = {
      name: existingCategory.name,
      description: existingCategory.description,
      parentId: existingCategory.parentId,
      level: existingCategory.level,
      isActive: existingCategory.isActive,
    };

    const trimmedName = dto.name.trim();

    this.validateCategoryName(trimmedName);

    if (dto.description) {
      this.validateDescription(dto.description);
    }

    if (trimmedName.toLowerCase() !== existingCategory.name.toLowerCase()) {
      await this.checkNameUniqueness(dto.tenantId, trimmedName);
    }

    let newLevel = existingCategory.level;
    let parentCategory: EquipmentCategory | null = null;
    let parentName: string | null = null;

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        newLevel = 1;
        parentName = null;
      } else {
        if (dto.parentId === dto.categoryId) {
          throw new RpcException({
            code: 'CIRCULAR_REFERENCE_DETECTED',
            message: 'Category cannot be its own parent',
          });
        }

        // Check if the new parent is a descendant of the category being updated
        // If so, moving the category would create a circular reference
        const isDescendant = await this.isAncestorOf(dto.parentId, dto.categoryId);
        if (isDescendant) {
          throw new RpcException({
            code: 'CIRCULAR_REFERENCE_DETECTED',
            message: 'Circular reference detected in category hierarchy',
          });
        }

        parentCategory = await this.validateAndGetParent(dto.parentId, dto.tenantId);
        newLevel = parentCategory.level + 1;
        parentName = parentCategory.name;

        if (newLevel > 3) {
          throw new RpcException({
            code: 'MAX_HIERARCHY_DEPTH_EXCEEDED',
            message: 'Maximum hierarchy depth (3 levels) exceeded',
          });
        }
      }
    } else {
      if (existingCategory.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: existingCategory.parentId },
        });
        parentName = parent ? parent.name : null;
      }
    }

    if (dto.isActive === false && existingCategory.isActive === true) {
      // Future phase: check for active equipment items
      // For now, we allow deactivation
    }

    existingCategory.name = trimmedName;
    existingCategory.description = dto.clearedFields?.includes('description')
      ? null
      : (dto.description !== undefined ? dto.description : existingCategory.description);
    existingCategory.parentId = dto.clearedFields?.includes('parentId')
      ? null
      : (dto.parentId !== undefined ? dto.parentId : existingCategory.parentId);
    existingCategory.level = newLevel;
    existingCategory.isActive = dto.isActive;
    existingCategory.updatedBy = dto.userId;

    const updateResult = await this.categoryRepository
      .createQueryBuilder()
      .update(EquipmentCategory)
      .set({
        name: existingCategory.name,
        description: existingCategory.description,
        parentId: existingCategory.parentId,
        level: existingCategory.level,
        isActive: existingCategory.isActive,
        updatedBy: existingCategory.updatedBy,
      })
      .where('id = :id', { id: dto.categoryId })
      .andWhere('tenantId = :tenantId', { tenantId: dto.tenantId })
      .execute();

    if (updateResult.affected === 0) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }

    const updatedCategory = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!updatedCategory) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found after update',
      });
    }

    return {
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        parentId: updatedCategory.parentId,
        parentName,
        level: updatedCategory.level,
        isActive: updatedCategory.isActive,
        updatedAt: updatedCategory.updatedAt.toISOString(),
      },
      beforeState,
    };
  }

  private async isAncestorOf(categoryId: string, potentialAncestorId: string): Promise<boolean> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, deletedAt: IsNull() },
    });

    if (!category || !category.parentId) {
      return false;
    }

    if (category.parentId === potentialAncestorId) {
      return true;
    }

    return this.isAncestorOf(category.parentId, potentialAncestorId);
  }

  async deactivateCategory(dto: DeactivateCategoryRequestDto): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    deactivatedAt: string;
    parentId: string | null;
    level: number;
  }> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
    });

    if (!category) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category does not exist',
      });
    }

    if (!category.isActive) {
      throw new RpcException({
        code: 'CATEGORY_ALREADY_DEACTIVATED',
        message: 'Category is already deactivated',
      });
    }

    const activeChildren = await this.categoryRepository.count({
      where: {
        parentId: dto.categoryId,
        isActive: true,
        deletedAt: IsNull(),
      },
    });

    if (activeChildren > 0) {
      throw new RpcException({
        code: 'CANNOT_DEACTIVATE_CATEGORY_WITH_ACTIVE_CHILDREN',
        message: 'Cannot deactivate category with active sub-categories',
      });
    }

    if (dto.reason && dto.reason.length > 500) {
      throw new RpcException({
        code: 'DEACTIVATION_REASON_TOO_LONG',
        message: 'Deactivation reason must not exceed 500 characters',
      });
    }

    const deactivatedAt = new Date();

    await this.categoryRepository.update(
      { id: dto.categoryId, tenantId: dto.tenantId },
      {
        isActive: false,
        deactivatedBy: dto.userId,
        deactivatedAt,
        deactivationReason: dto.reason || null,
        updatedBy: dto.userId,
      },
    );

    return {
      id: category.id,
      name: category.name,
      isActive: false,
      deactivatedAt: deactivatedAt.toISOString(),
      parentId: category.parentId,
      level: category.level,
    };
  }

  async reactivateCategory(dto: ReactivateCategoryRequestDto): Promise<{
    id: string;
    name: string;
    isActive: boolean;
    reactivatedAt: string;
    parentId: string | null;
    level: number;
  }> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
    });

    if (!category) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category does not exist',
      });
    }

    if (category.isActive) {
      throw new RpcException({
        code: 'CATEGORY_ALREADY_ACTIVE',
        message: 'Category is already active',
      });
    }

    const reactivatedAt = new Date();

    await this.categoryRepository.update(
      { id: dto.categoryId, tenantId: dto.tenantId },
      {
        isActive: true,
        reactivatedBy: dto.userId,
        reactivatedAt,
        updatedBy: dto.userId,
      },
    );

    return {
      id: category.id,
      name: category.name,
      isActive: true,
      reactivatedAt: reactivatedAt.toISOString(),
      parentId: category.parentId,
      level: category.level,
    };
  }

  async deleteCategory(dto: DeleteCategoryRequestDto): Promise<{
    id: string;
    name: string;
    deletedAt: string;
    parentId: string | null;
    level: number;
  }> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
    });

    if (!category) {
      throw new RpcException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category does not exist',
      });
    }

    const childrenCount = await this.categoryRepository.count({
      where: {
        parentId: dto.categoryId,
        deletedAt: IsNull(),
      },
    });

    if (childrenCount > 0) {
      throw new RpcException({
        code: 'CANNOT_DELETE_CATEGORY_WITH_CHILDREN',
        message: 'Cannot delete category with sub-categories',
      });
    }

    const deletedAt = new Date();

    await this.categoryRepository.update(
      { id: dto.categoryId, tenantId: dto.tenantId },
      {
        deletedAt,
        deletedBy: dto.userId,
      },
    );

    return {
      id: category.id,
      name: category.name,
      deletedAt: deletedAt.toISOString(),
      parentId: category.parentId,
      level: category.level,
    };
  }
}
