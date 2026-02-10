/**
 * user.created event structure published to RabbitMQ (P4UC01)
 */
export interface UserCreatedEvent {
  eventType: 'user.created';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * user.languageChanged event structure published to RabbitMQ (P3UC02)
 */
export interface UserLanguageChangedEvent {
  eventType: 'user.languageChanged';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * user.roleModified event structure published to RabbitMQ (P4UC03)
 */
export interface UserRoleModifiedEvent {
  eventType: 'user.roleModified';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
