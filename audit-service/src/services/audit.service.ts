import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import {
  UserRegisteredEvent,
  UserRegistrationFailedEvent,
  EmailDeliveryFailedEvent,
  PasswordResetRequestedEvent,
  PasswordResetTokenValidatedEvent,
  PasswordResetCompletedEvent,
  PasswordResetFailedEvent,
  DashboardAccessedEvent,
  UserLanguageChangedEvent,
  UserLogoutSuccessEvent,
  SessionExpiredEvent,
  UserCreatedEvent,
  UserRoleModifiedEvent,
  UserProfileUpdatedEvent,
  UserDeactivatedEvent,
  UserReactivatedEvent,
  PasswordChangedFirstLoginEvent,
  EquipmentCategoryCreatedEvent,
  EquipmentCategoriesViewedEvent,
  EquipmentCategoryUpdatedEvent,
  EquipmentCategoryDeactivatedEvent,
  EquipmentCategoryReactivatedEvent,
  EquipmentCategoryDeletedEvent,
  EquipmentCreatedEvent,
  EquipmentListViewedEvent,
  EquipmentDetailsViewedEvent,
  EquipmentUpdatedEvent,
  EquipmentStatusChangedEvent,
  EquipmentArchivedEvent,
  EquipmentDeletedPermanentlyEvent,
} from '../interfaces/events.interface';

/**
 * Service for creating and managing audit logs
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Helper function to normalize UUID fields - convert empty strings to null
   * PostgreSQL UUID columns cannot accept empty strings
   */
  private normalizeUuid(value: string | null | undefined): string | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    return value;
  }

  /**
   * Log user registration success
   */
  async logUserRegistrationSuccess(event: UserRegisteredEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_REGISTRATION_SUCCESS',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          fullName: event.data.fullName,
          companyName: event.data.companyName,
          languagePreference: event.data.languagePreference,
          phoneNumber: event.data.phoneNumber,
          verificationTokenExpiresAt: event.data.verificationTokenExpiresAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: USER_REGISTRATION_SUCCESS for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for user registration: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user registration failure
   */
  async logUserRegistrationFailure(event: UserRegistrationFailedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_REGISTRATION_FAILED',
        userId: null,
        tenantId: null,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          companyName: event.data.companyName,
          timestamp: event.timestamp,
        },
        errorCode: event.data.errorCode,
        errorMessage: event.data.errorMessage,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: USER_REGISTRATION_FAILED for email ${event.data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for registration failure: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log email delivery failure
   */
  async logEmailDeliveryFailure(event: EmailDeliveryFailedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EMAIL_DELIVERY_FAILED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: null,
        email: event.data.email,
        ipAddress: null,
        userAgent: null,
        metadata: {
          emailType: event.data.emailType,
          attemptCount: event.data.attemptCount,
          originalEventId: event.data.originalEventId,
          timestamp: event.timestamp,
        },
        errorCode: 'EMAIL_DELIVERY_ERROR',
        errorMessage: event.data.lastError,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: EMAIL_DELIVERY_FAILED for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for email delivery failure: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log verification email resent
   */
  async logVerificationEmailResent(event: any): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'VERIFICATION_EMAIL_RESENT',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: null,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          fullName: event.data.fullName,
          languagePreference: event.data.languagePreference,
          verificationTokenExpiresAt: event.data.verificationTokenExpiresAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: VERIFICATION_EMAIL_RESENT for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for verification email resent: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log email verified (P1UC03)
   */
  async logEmailVerified(event: any): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EMAIL_VERIFIED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          fullName: event.data.fullName,
          languagePreference: event.data.languagePreference,
          emailVerifiedAt: event.data.emailVerifiedAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: EMAIL_VERIFIED for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for email verified: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user login success (P2UC01)
   */
  async logUserLoginSuccess(event: any): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_LOGIN_SUCCESS',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          sessionId: event.data.sessionId,
          rememberMe: event.data.rememberMe,
          sessionExpiresAt: event.data.sessionExpiresAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: USER_LOGIN_SUCCESS for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for user login success: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user login failure (P2UC01)
   */
  async logUserLoginFailure(event: any): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_LOGIN_FAILED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          failureReason: event.data.failureReason,
          attemptsRemaining: event.data.attemptsRemaining,
          timestamp: event.timestamp,
        },
        errorCode: event.data.failureReason,
        errorMessage: `Login failed: ${event.data.failureReason}`,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: USER_LOGIN_FAILED for email ${event.data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for user login failure: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get audit logs by correlation ID
   */
  async getLogsByCorrelationId(correlationId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { correlationId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get audit logs by user ID
   */
  async getLogsByUserId(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs by tenant ID
   */
  async getLogsByTenantId(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Log password reset requested (P2UC02)
   */
  async logPasswordResetRequested(event: PasswordResetRequestedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'PASSWORD_RESET_REQUESTED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          fullName: event.data.fullName,
          languagePreference: event.data.languagePreference,
          resetTokenExpiresAt: event.data.resetTokenExpiresAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: PASSWORD_RESET_REQUESTED for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for password reset requested: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log password reset token validated (P2UC02)
   */
  async logPasswordResetTokenValidated(event: PasswordResetTokenValidatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'PASSWORD_RESET_TOKEN_VALIDATED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: null,
        userAgent: null,
        metadata: {
          tokenId: event.data.tokenId,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: PASSWORD_RESET_TOKEN_VALIDATED for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for password reset token validated: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log password reset completed (P2UC02)
   */
  async logPasswordResetCompleted(event: PasswordResetCompletedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'PASSWORD_RESET_COMPLETED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          fullName: event.data.fullName,
          languagePreference: event.data.languagePreference,
          passwordChangedAt: event.data.passwordChangedAt,
          sessionsInvalidated: event.data.sessionsInvalidated,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: PASSWORD_RESET_COMPLETED for user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for password reset completed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log password reset failed (P2UC02)
   */
  async logPasswordResetFailed(event: PasswordResetFailedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'PASSWORD_RESET_FAILED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          failureReason: event.data.failureReason,
          timestamp: event.timestamp,
        },
        errorCode: event.data.failureReason,
        errorMessage: `Password reset failed: ${event.data.failureReason}`,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Audit log created: PASSWORD_RESET_FAILED for email ${event.data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for password reset failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} audit logs older than ${retentionDays} days`);
      
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Failed to cleanup old audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Log dashboard access (P3UC01)
   */
  async logDashboardAccessed(event: DashboardAccessedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'DASHBOARD_ACCESSED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          sessionId: event.data.sessionId,
          fullName: event.data.fullName,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged dashboard access for user ${event.data.email} (${event.data.userId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log dashboard access: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user language preference change (P3UC02)
   */
  async logUserLanguageChanged(event: UserLanguageChangedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_LANGUAGE_CHANGED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: null,
        userAgent: null,
        metadata: {
          oldLanguage: event.data.oldLanguage,
          newLanguage: event.data.newLanguage,
          updatedAt: event.data.updatedAt,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged language change for user ${event.data.email}: ${event.data.oldLanguage} -> ${event.data.newLanguage}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log language change: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async logUserLogoutSuccess(event: UserLogoutSuccessEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_LOGOUT_SUCCESS',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          sessionId: event.data.sessionId,
          invalidationReason: event.data.invalidationReason,
          sessionDuration: event.data.sessionDuration,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged successful logout for user ${event.data.email}, session duration: ${event.data.sessionDuration}s`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log user logout: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async logSessionExpired(event: SessionExpiredEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'SESSION_EXPIRED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          sessionId: event.data.sessionId,
          expirationReason: event.data.expirationReason,
          sessionDuration: event.data.sessionDuration,
          lastActivityAt: event.data.lastActivityAt,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged session expiration for user ${event.data.email}, reason: ${event.data.expirationReason}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log session expiration: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user created by company owner (P4UC01)
   */
  async logUserCreated(event: UserCreatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_CREATED',
        userId: this.normalizeUuid(event.data.createdBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          targetUserId: event.data.userId,
          fullName: event.data.fullName,
          roleCode: event.data.roleCode,
          phoneNumber: event.data.phoneNumber,
          createdByLanguage: event.data.createdByLanguage,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged user creation: user ${event.data.email} created by ${event.data.createdBy}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log user creation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user role modified by company owner (P4UC03)
   */
  async logUserRoleModified(event: UserRoleModifiedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_ROLE_MODIFIED',
        userId: this.normalizeUuid(event.data.modifiedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          targetUserId: event.data.userId,
          targetUserEmail: event.data.email,
          targetUserFullName: event.data.fullName,
          oldRoleCode: event.data.oldRoleCode,
          oldRoleName: event.data.oldRoleName,
          newRoleCode: event.data.newRoleCode,
          newRoleName: event.data.newRoleName,
          updatedAt: event.data.updatedAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged role modification: user ${event.data.email} role changed from ${event.data.oldRoleCode} to ${event.data.newRoleCode} by ${event.data.modifiedBy}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log role modification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user profile update (P4UC04)
   */
  async logUserProfileUpdated(event: UserProfileUpdatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_PROFILE_UPDATED',
        userId: this.normalizeUuid(event.data.modifiedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          targetUserId: event.data.userId,
          targetEmail: event.data.email,
          targetFullName: event.data.fullName,
          changedFields: event.data.changedFields,
          oldValues: event.data.oldValues,
          newValues: event.data.newValues,
          emailChanged: event.data.emailChanged,
          updatedAt: event.data.updatedAt,
          timestamp: event.timestamp,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged profile update: user ${event.data.userId} modified by ${event.data.modifiedBy}, fields: ${event.data.changedFields.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log profile update: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user deactivated (P4UC05)
   */
  async logUserDeactivated(event: UserDeactivatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_DEACTIVATED',
        userId: this.normalizeUuid(event.data.deactivatedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          targetUserId: event.data.userId,
          targetEmail: event.data.email,
          targetFullName: event.data.fullName,
          deactivatedBy: event.data.deactivatedBy,
          reason: event.data.reason,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged user deactivation: user ${event.data.email} deactivated by ${event.data.deactivatedBy}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log user deactivation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log user reactivated (P4UC05)
   */
  async logUserReactivated(event: UserReactivatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'USER_REACTIVATED',
        userId: this.normalizeUuid(event.data.reactivatedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          targetUserId: event.data.userId,
          targetEmail: event.data.email,
          targetFullName: event.data.fullName,
          reactivatedBy: event.data.reactivatedBy,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged user reactivation: user ${event.data.email} reactivated by ${event.data.reactivatedBy}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log user reactivation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log password changed on first login (P4UC06)
   */
  async logPasswordChangedFirstLogin(event: PasswordChangedFirstLoginEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'PASSWORD_CHANGED_FIRST_LOGIN',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: event.data.email,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          fullName: event.data.fullName,
          passwordChangedAt: event.data.passwordChangedAt,
          sessionId: event.data.sessionId,
          sessionExpiresAt: event.data.sessionExpiresAt,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged first-time password change for user: ${event.data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log first-time password change: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment category created (P5UC01)
   */
  async logEquipmentCategoryCreated(event: EquipmentCategoryCreatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CATEGORY_CREATED',
        userId: this.normalizeUuid(event.data.createdBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: event.data.ipAddress,
        userAgent: event.data.userAgent,
        metadata: {
          categoryId: event.data.categoryId,
          name: event.data.name,
          description: event.data.description,
          parentId: event.data.parentId,
          level: event.data.level,
          isActive: event.data.isActive,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment category creation: ${event.data.name} (${event.data.categoryId}) by user ${event.data.createdBy}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment category creation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment categories viewed (P5UC02)
   */
  async logEquipmentCategoriesViewed(event: EquipmentCategoriesViewedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CATEGORIES_VIEWED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          page: event.data.page,
          pageSize: event.data.pageSize,
          search: event.data.search,
          status: event.data.status,
          hierarchyLevel: event.data.hierarchyLevel,
          totalItems: event.data.totalItems,
          resultCount: event.data.resultCount,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment categories view: tenant ${event.data.tenantId}, page ${event.data.page}, resultCount ${event.data.resultCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment categories view: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * P5UC03 log equipment category updated
   */
  async logEquipmentCategoryUpdated(event: EquipmentCategoryUpdatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CATEGORY_UPDATED',
        userId: this.normalizeUuid(event.data.updatedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          categoryId: event.data.categoryId,
          before: event.data.before,
          after: event.data.after,
          changes: event.data.changes,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment category update: category ${event.data.categoryId}, changes: ${event.data.changes.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment category update: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * P5UC04 log equipment category deactivated
   */
  async logEquipmentCategoryDeactivated(event: EquipmentCategoryDeactivatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CATEGORY_DEACTIVATED',
        userId: this.normalizeUuid(event.data.deactivatedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          categoryId: event.data.categoryId,
          categoryName: event.data.categoryName,
          reason: event.data.reason,
          deactivatedAt: event.data.deactivatedAt,
          parentId: event.data.parentId,
          level: event.data.level,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment category deactivation: category ${event.data.categoryId} (${event.data.categoryName})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment category deactivation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * P5UC04 log equipment category reactivated
   */
  async logEquipmentCategoryReactivated(event: EquipmentCategoryReactivatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CATEGORY_REACTIVATED',
        userId: this.normalizeUuid(event.data.reactivatedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          categoryId: event.data.categoryId,
          categoryName: event.data.categoryName,
          reactivatedAt: event.data.reactivatedAt,
          parentId: event.data.parentId,
          level: event.data.level,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment category reactivation: category ${event.data.categoryId} (${event.data.categoryName})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment category reactivation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * P5UC04 log equipment category deleted
   */
  async logEquipmentCategoryDeleted(event: EquipmentCategoryDeletedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CATEGORY_DELETED',
        userId: this.normalizeUuid(event.data.deletedBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          categoryId: event.data.categoryId,
          categoryName: event.data.categoryName,
          deletedAt: event.data.deletedAt,
          parentId: event.data.parentId,
          level: event.data.level,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment category deletion: category ${event.data.categoryId} (${event.data.categoryName})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment category deletion: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * P6UC01 log equipment created
   */
  async logEquipmentCreated(event: EquipmentCreatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_CREATED',
        userId: this.normalizeUuid(event.data.createdBy) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          equipmentId: event.data.equipmentId,
          name: event.data.name,
          categoryId: event.data.categoryId,
          categoryName: event.data.categoryName,
          description: event.data.description,
          manufacturer: event.data.manufacturer,
          model: event.data.model,
          serialNumber: event.data.serialNumber,
          yearOfManufacture: event.data.yearOfManufacture,
          purchasePrice: event.data.purchasePrice,
          purchaseDate: event.data.purchaseDate,
          status: event.data.status,
          customAttributes: event.data.customAttributes,
          createdAt: event.data.createdAt,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment creation: equipment ${event.data.equipmentId} (${event.data.name})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment creation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment list viewed (P6UC02)
   */
  async logEquipmentListViewed(event: EquipmentListViewedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_LIST_VIEWED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          page: event.data.page,
          pageSize: event.data.pageSize,
          sortBy: event.data.sortBy,
          sortOrder: event.data.sortOrder,
          filters: event.data.filters,
          totalItems: event.data.totalItems,
          resultCount: event.data.resultCount,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment list view: user ${event.data.userId}, page ${event.data.page}, result count ${event.data.resultCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment list view: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment details viewed (P6UC03)
   */
  async logEquipmentDetailsViewed(event: EquipmentDetailsViewedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_DETAILS_VIEWED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          equipmentId: event.data.equipmentId,
          equipmentName: event.data.equipmentName,
          categoryId: event.data.categoryId,
          categoryPath: event.data.categoryPath,
          status: event.data.status,
          isArchived: event.data.isArchived,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment details view: equipment ${event.data.equipmentId} (${event.data.equipmentName}) by user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment details view: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment updated (P6UC04)
   */
  async logEquipmentUpdated(event: EquipmentUpdatedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_UPDATED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          equipmentId: event.data.equipmentId,
          equipmentName: event.data.equipmentName,
          categoryId: event.data.categoryId,
          categoryPath: event.data.categoryPath,
          status: event.data.status,
          changes: event.data.changes,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment update: equipment ${event.data.equipmentId} (${event.data.equipmentName}) by user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment update: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment status changed (P6UC05)
   */
  async logEquipmentStatusChanged(event: EquipmentStatusChangedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_STATUS_CHANGED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          equipmentId: event.data.equipmentId,
          equipmentName: event.data.equipmentName,
          categoryId: event.data.categoryId,
          categoryPath: event.data.categoryPath,
          oldStatus: event.data.oldStatus,
          newStatus: event.data.newStatus,
          reason: event.data.reason,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment status change: equipment ${event.data.equipmentId} (${event.data.equipmentName}) from ${event.data.oldStatus} to ${event.data.newStatus} by user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment status change: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment archived (P6UC05)
   */
  async logEquipmentArchived(event: EquipmentArchivedEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_ARCHIVED',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          equipmentId: event.data.equipmentId,
          equipmentName: event.data.equipmentName,
          categoryId: event.data.categoryId,
          categoryPath: event.data.categoryPath,
          status: event.data.status,
          reason: event.data.reason,
          deletedAt: event.data.deletedAt,
          deletedBy: event.data.deletedBy,
          fullEquipmentData: event.data.fullEquipmentData,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment archive: equipment ${event.data.equipmentId} (${event.data.equipmentName}) by user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment archive: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Log equipment permanently deleted (P6UC05)
   */
  async logEquipmentDeletedPermanently(event: EquipmentDeletedPermanentlyEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        correlationId: this.normalizeUuid(event.correlationId) as any,
        eventId: this.normalizeUuid(event.eventId) as any,
        action: 'EQUIPMENT_DELETED_PERMANENTLY',
        userId: this.normalizeUuid(event.data.userId) as any,
        tenantId: this.normalizeUuid(event.data.tenantId) as any,
        email: null,
        ipAddress: null,
        userAgent: null,
        metadata: {
          equipmentId: event.data.equipmentId,
          equipmentName: event.data.equipmentName,
          categoryId: event.data.categoryId,
          categoryPath: event.data.categoryPath,
          status: event.data.status,
          fullEquipmentData: event.data.fullEquipmentData,
        },
        errorCode: null,
        errorMessage: null,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.log(
        `Logged equipment permanent deletion: equipment ${event.data.equipmentId} (${event.data.equipmentName}) by user ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log equipment permanent deletion: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
