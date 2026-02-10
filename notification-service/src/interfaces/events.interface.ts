/**
 * user.registered event structure consumed from RabbitMQ
 */
export interface UserRegisteredEvent {
  eventType: 'user.registered';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * Data for publishing email.deliveryFailed event
 */
export interface EmailDeliveryFailedEventData {
  userId: string;
  email: string;
  emailType: string;
  attemptCount: number;
  lastError: string;
  originalEventId: string;
  correlationId: string;
}

/**
 * password.reset.requested event structure (P2UC02)
 */
export interface PasswordResetRequestedEvent {
  eventType: 'password.reset.requested';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * password.reset.completed event structure (P2UC02)
 */
export interface PasswordResetCompletedEvent {
  eventType: 'password.reset.completed';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * user.created event structure consumed from RabbitMQ (P4UC01)
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
 * user.profileUpdated event structure consumed from RabbitMQ (P4UC04)
 */
export interface UserProfileUpdatedEvent {
  eventType: 'user.profileUpdated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * user.deactivated event structure consumed from RabbitMQ (P4UC05)
 */
export interface UserDeactivatedEvent {
  eventType: 'user.deactivated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * user.reactivated event structure consumed from RabbitMQ (P4UC05)
 */
export interface UserReactivatedEvent {
  eventType: 'user.reactivated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
 * password.changed.first.login event structure consumed from RabbitMQ (P4UC06)
 */
export interface PasswordChangedFirstLoginEvent {
  eventType: 'password.changed.first.login';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
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
