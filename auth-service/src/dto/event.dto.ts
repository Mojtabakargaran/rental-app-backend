// ============================================================================
// PASSWORD RESET EVENTS
// ============================================================================

export interface PasswordResetRequestedEventDto {
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

export interface PasswordResetTokenValidatedEventDto {
  eventType: 'password.reset.token.validated';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    userId: string;
    email: string;
    tenantId: string;
    tokenId: string;
  };
}

export interface PasswordResetCompletedEventDto {
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

export interface PasswordResetFailedEventDto {
  eventType: 'password.reset.failed';
  eventId: string;
  version: 'v1.0.0';
  timestamp: string;
  correlationId: string;
  data: {
    email: string;
    userId?: string;
    tenantId?: string;
    failureReason: string;
    ipAddress: string;
    userAgent: string;
  };
}
