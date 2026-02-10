import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import {
  ICategoryCreatedEvent,
  ICategoriesViewedEvent,
  ICategoryUpdatedEvent,
  ICategoryDeactivatedEvent,
  ICategoryReactivatedEvent,
  ICategoryDeletedEvent,
  IEquipmentCreatedEvent,
  IEquipmentDetailsViewedEvent,
  IEquipmentUpdatedEvent,
  IEquipmentStatusChangedEvent,
  IEquipmentArchivedEvent,
  IEquipmentDeletedPermanentlyEvent,
} from '../interfaces/events.interface';

@Injectable()
export class EventPublisherService {
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly rabbitClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  async publishCategoryCreated(data: {
    categoryId: string;
    name: string;
    description: string | null;
    parentId: string | null;
    level: number;
    isActive: boolean;
    tenantId: string;
    createdBy: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event: ICategoryCreatedEvent = {
      eventType: 'equipment.category.created',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        level: data.level,
        isActive: data.isActive,
        tenantId: data.tenantId,
        createdBy: data.createdBy,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    this.rabbitClient.emit('equipment.category.created', event);
    console.log('[Event Published] equipment.category.created', {
      eventId: event.eventId,
      categoryId: data.categoryId,
    });
  }

  async publishCategoriesViewed(data: {
    userId: string;
    tenantId: string;
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    hierarchyLevel?: string;
    totalItems: number;
    resultCount: number;
    correlationId: string;
  }): Promise<void> {
    const event: ICategoriesViewedEvent = {
      eventType: 'equipment.categories.viewed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        page: data.page,
        pageSize: data.pageSize,
        search: data.search,
        status: data.status,
        hierarchyLevel: data.hierarchyLevel,
        totalItems: data.totalItems,
        resultCount: data.resultCount,
      },
    };

    this.rabbitClient.emit('equipment.categories.viewed', event);
    console.log('[Event Published] equipment.categories.viewed', {
      eventId: event.eventId,
      tenantId: data.tenantId,
      resultCount: data.resultCount,
    });
  }

  async publishCategoryUpdated(data: {
    categoryId: string;
    tenantId: string;
    updatedBy: string;
    before: {
      name: string;
      description: string | null;
      parentId: string | null;
      level: number;
      isActive: boolean;
    };
    after: {
      name: string;
      description: string | null;
      parentId: string | null;
      level: number;
      isActive: boolean;
      updatedAt: string;
    };
    correlationId: string;
  }): Promise<void> {
    const changes: string[] = [];

    if (data.before.name !== data.after.name) {
      changes.push('name');
    }
    if (data.before.description !== data.after.description) {
      changes.push('description');
    }
    if (data.before.parentId !== data.after.parentId) {
      changes.push('parentId');
    }
    if (data.before.isActive !== data.after.isActive) {
      changes.push('isActive');
    }

    const event: ICategoryUpdatedEvent = {
      eventType: 'equipment.category.updated',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        categoryId: data.categoryId,
        tenantId: data.tenantId,
        updatedBy: data.updatedBy,
        before: data.before,
        after: data.after,
        changes,
      },
    };

    this.rabbitClient.emit('equipment.category.updated', event);
    console.log('[Event Published] equipment.category.updated', {
      eventId: event.eventId,
      categoryId: data.categoryId,
      changes,
    });
  }

  async publishCategoryDeactivated(data: {
    categoryId: string;
    tenantId: string;
    deactivatedBy: string;
    deactivatedAt: string;
    reason: string | null;
    categoryName: string;
    parentId: string | null;
    level: number;
    correlationId: string;
  }): Promise<void> {
    const event: ICategoryDeactivatedEvent = {
      eventType: 'equipment.category.deactivated',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        categoryId: data.categoryId,
        tenantId: data.tenantId,
        deactivatedBy: data.deactivatedBy,
        deactivatedAt: data.deactivatedAt,
        reason: data.reason,
        categoryName: data.categoryName,
        parentId: data.parentId,
        level: data.level,
      },
    };

    this.rabbitClient.emit('equipment.category.deactivated', event);
    console.log('[Event Published] equipment.category.deactivated', {
      eventId: event.eventId,
      categoryId: data.categoryId,
    });
  }

  async publishCategoryReactivated(data: {
    categoryId: string;
    tenantId: string;
    reactivatedBy: string;
    reactivatedAt: string;
    categoryName: string;
    parentId: string | null;
    level: number;
    correlationId: string;
  }): Promise<void> {
    const event: ICategoryReactivatedEvent = {
      eventType: 'equipment.category.reactivated',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        categoryId: data.categoryId,
        tenantId: data.tenantId,
        reactivatedBy: data.reactivatedBy,
        reactivatedAt: data.reactivatedAt,
        categoryName: data.categoryName,
        parentId: data.parentId,
        level: data.level,
      },
    };

    this.rabbitClient.emit('equipment.category.reactivated', event);
    console.log('[Event Published] equipment.category.reactivated', {
      eventId: event.eventId,
      categoryId: data.categoryId,
    });
  }

  async publishCategoryDeleted(data: {
    categoryId: string;
    tenantId: string;
    deletedBy: string;
    deletedAt: string;
    categoryName: string;
    parentId: string | null;
    level: number;
    correlationId: string;
  }): Promise<void> {
    const event: ICategoryDeletedEvent = {
      eventType: 'equipment.category.deleted',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        categoryId: data.categoryId,
        tenantId: data.tenantId,
        deletedBy: data.deletedBy,
        deletedAt: data.deletedAt,
        categoryName: data.categoryName,
        parentId: data.parentId,
        level: data.level,
      },
    };

    this.rabbitClient.emit('equipment.category.deleted', event);
    console.log('[Event Published] equipment.category.deleted', {
      eventId: event.eventId,
      categoryId: data.categoryId,
    });
  }

  async publishEquipmentCreated(data: {
    equipmentId: string;
    tenantId: string;
    name: string;
    categoryId: string;
    categoryName: string;
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
    createdAt: string;
    correlationId: string;
  }): Promise<void> {
    const event: IEquipmentCreatedEvent = {
      eventType: 'equipment.created',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        equipmentId: data.equipmentId,
        tenantId: data.tenantId,
        name: data.name,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        description: data.description,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        yearOfManufacture: data.yearOfManufacture,
        purchasePrice: data.purchasePrice,
        purchaseDate: data.purchaseDate,
        status: data.status,
        customAttributes: data.customAttributes,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
      },
    };

    this.rabbitClient.emit('equipment.created', event);
    console.log('[Event Published] equipment.created', {
      eventId: event.eventId,
      equipmentId: data.equipmentId,
    });
  }

  async publishEquipmentListViewed(data: {
    userId: string;
    tenantId: string;
    page: number;
    pageSize: number;
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
    totalItems: number;
    resultCount: number;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'equipment.list.viewed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        page: data.page,
        pageSize: data.pageSize,
        sortBy: data.sortBy,
        sortOrder: data.sortOrder,
        filters: data.filters,
        totalItems: data.totalItems,
        resultCount: data.resultCount,
      },
    };

    this.rabbitClient.emit('equipment.list.viewed', event);
    console.log('[Event Published] equipment.list.viewed', {
      eventId: event.eventId,
      tenantId: data.tenantId,
      resultCount: data.resultCount,
    });
  }

  async publishEquipmentDetailsViewed(data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    status: string;
    isArchived: boolean;
    correlationId: string;
  }): Promise<void> {
    const event: IEquipmentDetailsViewedEvent = {
      eventType: 'equipment.details.viewed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        categoryId: data.categoryId,
        categoryPath: data.categoryPath,
        status: data.status,
        isArchived: data.isArchived,
      },
    };

    this.rabbitClient.emit('equipment.details.viewed', event);
    console.log('[Event Published] equipment.details.viewed', {
      eventId: event.eventId,
      equipmentId: data.equipmentId,
    });
  }

  async publishEquipmentUpdated(data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    status: string;
    changes: {
      oldValues: Record<string, any>;
      newValues: Record<string, any>;
    };
    correlationId: string;
  }): Promise<void> {
    const event: IEquipmentUpdatedEvent = {
      eventType: 'equipment.updated',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        categoryId: data.categoryId,
        categoryPath: data.categoryPath,
        status: data.status,
        changes: data.changes,
      },
    };

    this.rabbitClient.emit('equipment.updated', event);
    console.log('[Event Published] equipment.updated', {
      eventId: event.eventId,
      equipmentId: data.equipmentId,
      changedFields: Object.keys(data.changes.newValues),
    });
  }

  async publishEquipmentStatusChanged(data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    oldStatus: string;
    newStatus: string;
    reason: string | null;
    correlationId: string;
  }): Promise<void> {
    const event: IEquipmentStatusChangedEvent = {
      eventType: 'equipment.status.changed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        categoryId: data.categoryId,
        categoryPath: data.categoryPath,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        reason: data.reason,
      },
    };

    this.rabbitClient.emit('equipment.status.changed', event);
    console.log('[Event Published] equipment.status.changed', {
      eventId: event.eventId,
      equipmentId: data.equipmentId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
    });
  }

  async publishEquipmentArchived(data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    status: string;
    reason: string | null;
    deletedAt: string;
    deletedBy: string;
    fullEquipmentData: {
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
    correlationId: string;
  }): Promise<void> {
    const event: IEquipmentArchivedEvent = {
      eventType: 'equipment.archived',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        categoryId: data.categoryId,
        categoryPath: data.categoryPath,
        status: data.status,
        reason: data.reason,
        deletedAt: data.deletedAt,
        deletedBy: data.deletedBy,
        fullEquipmentData: data.fullEquipmentData,
      },
    };

    this.rabbitClient.emit('equipment.archived', event);
    console.log('[Event Published] equipment.archived', {
      eventId: event.eventId,
      equipmentId: data.equipmentId,
    });
  }

  async publishEquipmentDeletedPermanently(data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    status: string;
    fullEquipmentData: {
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
    correlationId: string;
  }): Promise<void> {
    const event: IEquipmentDeletedPermanentlyEvent = {
      eventType: 'equipment.deleted.permanently',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        categoryId: data.categoryId,
        categoryPath: data.categoryPath,
        status: data.status,
        fullEquipmentData: data.fullEquipmentData,
      },
    };

    this.rabbitClient.emit('equipment.deleted.permanently', event);
    console.log('[Event Published] equipment.deleted.permanently', {
      eventId: event.eventId,
      equipmentId: data.equipmentId,
    });
  }
}
