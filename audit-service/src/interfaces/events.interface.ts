/**
 * Base event structure
 */
export interface BaseEvent {
  eventType: string;
  eventId: string;
  version: string;
  timestamp: string;
  correlationId: string;
}

/**
 * user.registered event
 */
export interface UserRegisteredEvent extends BaseEvent {
  eventType: 'user.registered';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    companyName: string;
    languagePreference: string;
    verificationToken: string;
    verificationTokenExpiresAt: string;
    phoneNumber?: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * user.registrationFailed event
 */
export interface UserRegistrationFailedEvent extends BaseEvent {
  eventType: 'user.registrationFailed';
  version: 'v1.0.0';
  data: {
    email: string;
    companyName: string;
    errorCode: string;
    errorMessage: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * email.deliveryFailed event
 */
export interface EmailDeliveryFailedEvent extends BaseEvent {
  eventType: 'email.deliveryFailed';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    emailType: string;
    attemptCount: number;
    lastError: string;
    originalEventId: string;
  };
}

/**
 * password.reset.requested event
 */
export interface PasswordResetRequestedEvent extends BaseEvent {
  eventType: 'password.reset.requested';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    resetToken: string;
    resetTokenExpiresAt: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * password.reset.token.validated event
 */
export interface PasswordResetTokenValidatedEvent extends BaseEvent {
  eventType: 'password.reset.token.validated';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    tenantId: string;
    tokenId: string;
  };
}

/**
 * password.reset.completed event
 */
export interface PasswordResetCompletedEvent extends BaseEvent {
  eventType: 'password.reset.completed';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    passwordChangedAt: string;
    sessionsInvalidated: number;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * password.reset.failed event
 */
export interface PasswordResetFailedEvent extends BaseEvent {
  eventType: 'password.reset.failed';
  version: 'v1.0.0';
  data: {
    email: string;
    userId?: string;
    tenantId?: string;
    failureReason: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * dashboard.accessed event
 */
export interface DashboardAccessedEvent extends BaseEvent {
  eventType: 'dashboard.accessed';
  version: 'v1.0.0';
  data: {
    userId: string;
    tenantId: string;
    sessionId: string;
    email: string;
    fullName: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * user.languageChanged event (P3UC02)
 */
export interface UserLanguageChangedEvent extends BaseEvent {
  eventType: 'user.languageChanged';
  version: 'v1.0.0';
  data: {
    userId: string;
    tenantId: string;
    email: string;
    oldLanguage: 'en' | 'fa';
    newLanguage: 'en' | 'fa';
    updatedAt: string;
  };
}

/**
 * user.logout.success event (P3UC04)
 */
export interface UserLogoutSuccessEvent extends BaseEvent {
  eventType: 'user.logout.success';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    tenantId: string;
    sessionId: string;
    invalidationReason: string;
    sessionDuration: number;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * session.expired event (P3UC04)
 */
export interface SessionExpiredEvent extends BaseEvent {
  eventType: 'session.expired';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    tenantId: string;
    sessionId: string;
    expirationReason: string;
    sessionDuration: number;
    lastActivityAt: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * user.created event (P4UC01)
 */
export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    roleCode: string;
    temporaryPassword: string;
    phoneNumber?: string;
    createdBy: string;
    createdByLanguage: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * user.roleModified event (P4UC03)
 */
export interface UserRoleModifiedEvent extends BaseEvent {
  eventType: 'user.roleModified';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    oldRoleCode: string;
    oldRoleName: string;
    newRoleCode: string;
    newRoleName: string;
    modifiedBy: string;
    ipAddress: string;
    userAgent: string;
    updatedAt: string;
  };
}

/**
 * user.profileUpdated event (P4UC04)
 */
export interface UserProfileUpdatedEvent extends BaseEvent {
  eventType: 'user.profileUpdated';
  version: 'v1.0.0';
  data: {
    userId: string;
    tenantId: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    languagePreference: string;
    changedFields: string[];
    oldValues: {
      fullName?: string;
      email?: string;
      phoneNumber?: string | null;
    };
    newValues: {
      fullName?: string;
      email?: string;
      phoneNumber?: string | null;
    };
    emailChanged: boolean;
    verificationToken?: string;
    verificationTokenExpiresAt?: string;
    modifiedBy: string;
    ipAddress: string;
    userAgent: string;
    updatedAt: string;
  };
}

/**
 * user.deactivated event (P4UC05)
 */
export interface UserDeactivatedEvent extends BaseEvent {
  eventType: 'user.deactivated';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    deactivatedBy: string;
    deactivatedAt: string;
    reason?: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * user.reactivated event (P4UC05)
 */
export interface UserReactivatedEvent extends BaseEvent {
  eventType: 'user.reactivated';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    reactivatedBy: string;
    reactivatedAt: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * password.changed.first.login event (P4UC06)
 */
export interface PasswordChangedFirstLoginEvent extends BaseEvent {
  eventType: 'password.changed.first.login';
  version: 'v1.0.0';
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    passwordChangedAt: string;
    sessionId: string;
    sessionExpiresAt: string;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * equipment.category.created event (P5UC01)
 */
export interface EquipmentCategoryCreatedEvent extends BaseEvent {
  eventType: 'equipment.category.created';
  version: 'v1.0.0';
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

/**
 * equipment.categories.viewed event (P5UC02)
 */
export interface EquipmentCategoriesViewedEvent extends BaseEvent {
  eventType: 'equipment.categories.viewed';
  version: 'v1.0.0';
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

/**
 * equipment.category.updated event (P5UC03)
 */
export interface EquipmentCategoryUpdatedEvent extends BaseEvent {
  eventType: 'equipment.category.updated';
  version: 'v1.0.0';
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

/**
 * equipment.category.deactivated event (P5UC04)
 */
export interface EquipmentCategoryDeactivatedEvent extends BaseEvent {
  eventType: 'equipment.category.deactivated';
  version: 'v1.0.0';
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

/**
 * equipment.category.reactivated event (P5UC04)
 */
export interface EquipmentCategoryReactivatedEvent extends BaseEvent {
  eventType: 'equipment.category.reactivated';
  version: 'v1.0.0';
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

/**
 * equipment.category.deleted event (P5UC04)
 */
export interface EquipmentCategoryDeletedEvent extends BaseEvent {
  eventType: 'equipment.category.deleted';
  version: 'v1.0.0';
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

/**
 * equipment.created event (P6UC01)
 */
export interface EquipmentCreatedEvent extends BaseEvent {
  eventType: 'equipment.created';
  version: 'v1.0.0';
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

/**
 * equipment.list.viewed event (P6UC02)
 */
export interface EquipmentListViewedEvent extends BaseEvent {
  eventType: 'equipment.list.viewed';
  version: 'v1.0.0';
  data: {
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
  };
}

/**
 * equipment.details.viewed event (P6UC03)
 */
export interface EquipmentDetailsViewedEvent extends BaseEvent {
  eventType: 'equipment.details.viewed';
  version: 'v1.0.0';
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

/**
 * equipment.updated event (P6UC04)
 */
export interface EquipmentUpdatedEvent extends BaseEvent {
  eventType: 'equipment.updated';
  version: 'v1.0.0';
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

/**
 * equipment.status.changed event (P6UC05)
 */
export interface EquipmentStatusChangedEvent extends BaseEvent {
  eventType: 'equipment.status.changed';
  version: 'v1.0.0';
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

/**
 * equipment.archived event (P6UC05)
 */
export interface EquipmentArchivedEvent extends BaseEvent {
  eventType: 'equipment.archived';
  version: 'v1.0.0';
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
    fullEquipmentData: Record<string, any>;
  };
}

/**
 * equipment.deleted.permanently event (P6UC05)
 */
export interface EquipmentDeletedPermanentlyEvent extends BaseEvent {
  eventType: 'equipment.deleted.permanently';
  version: 'v1.0.0';
  data: {
    userId: string;
    tenantId: string;
    equipmentId: string;
    equipmentName: string;
    categoryId: string;
    categoryPath: string;
    status: string;
    fullEquipmentData: Record<string, any>;
  };
}
