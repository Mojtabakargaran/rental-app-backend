export interface ICategoryCreatedEvent {
  eventType: 'equipment.category.created';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
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
  };
}

export interface ICategoriesViewedEvent {
  eventType: 'equipment.categories.viewed';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    userId: string;
    tenantId: string;
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    hierarchyLevel?: string;
    totalItems: number;
    resultCount: number;
  };
}

export interface ICategoryUpdatedEvent {
  eventType: 'equipment.category.updated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
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
    changes: string[];
  };
}

export interface ICategoryDeactivatedEvent {
  eventType: 'equipment.category.deactivated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    categoryId: string;
    tenantId: string;
    deactivatedBy: string;
    deactivatedAt: string;
    reason: string | null;
    categoryName: string;
    parentId: string | null;
    level: number;
  };
}

export interface ICategoryReactivatedEvent {
  eventType: 'equipment.category.reactivated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    categoryId: string;
    tenantId: string;
    reactivatedBy: string;
    reactivatedAt: string;
    categoryName: string;
    parentId: string | null;
    level: number;
  };
}

export interface ICategoryDeletedEvent {
  eventType: 'equipment.category.deleted';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    categoryId: string;
    tenantId: string;
    deletedBy: string;
    deletedAt: string;
    categoryName: string;
    parentId: string | null;
    level: number;
  };
}

export interface IEquipmentCreatedEvent {
  eventType: 'equipment.created';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
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
  };
}

export interface IEquipmentDetailsViewedEvent {
  eventType: 'equipment.details.viewed';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    status: string;
    isArchived: boolean;
  };
}

export interface IEquipmentUpdatedEvent {
  eventType: 'equipment.updated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
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
  };
}

export interface IEquipmentStatusChangedEvent {
  eventType: 'equipment.status.changed';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    oldStatus: string;
    newStatus: string;
    reason: string | null;
  };
}

export interface IEquipmentArchivedEvent {
  eventType: 'equipment.archived';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
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
  };
}

export interface IEquipmentDeletedPermanentlyEvent {
  eventType: 'equipment.deleted.permanently';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
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
  };
}
