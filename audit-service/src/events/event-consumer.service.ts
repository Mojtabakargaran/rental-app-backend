import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { AuditService } from '../services/audit.service';
import {
  UserRegisteredEvent,
  UserRegistrationFailedEvent,
  EmailDeliveryFailedEvent,
  PasswordResetRequestedEvent,
  PasswordResetTokenValidatedEvent,
  PasswordResetCompletedEvent,
  PasswordResetFailedEvent,
  DashboardAccessedEvent,
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
 * Service for consuming events from RabbitMQ
 */
@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupConsumers();
  }

  /**
   * Establish connection to RabbitMQ
   */
  private async connect(): Promise<void> {
    const rabbitMQUrl = this.configService.get('rabbitmq.url');

    this.connection = amqp.connect([rabbitMQUrl], {
      heartbeatIntervalInSeconds: 30,
      reconnectTimeInSeconds: 2,
    });

    this.connection.on('connect', () => {
      this.logger.log('Connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.error('Disconnected from RabbitMQ', err);
    });

    this.channelWrapper = this.connection.createChannel({
      json: false,
      setup: async (channel: any) => {
        const exchange = this.configService.get('rabbitmq.exchange');
        await channel.assertExchange(exchange, 'topic', { durable: true });
      },
    });
  }

  /**
   * Setup event consumers with queues and bindings
   */
  private async setupConsumers(): Promise<void> {
    await this.channelWrapper.addSetup(async (channel: any) => {
      const exchange = this.configService.get('rabbitmq.exchange');

      // Queue for user.registered event
      const userRegisteredQueue = 'audit-service.user-registered';
      await channel.assertQueue(userRegisteredQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userRegisteredQueue, exchange, 'user.registered');

      await channel.consume(
        userRegisteredQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserRegistered(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userRegisteredQueue}`);

      // Queue for user.registrationFailed event
      const userRegistrationFailedQueue = 'audit-service.user-registrationFailed';
      await channel.assertQueue(userRegistrationFailedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userRegistrationFailedQueue, exchange, 'user.registrationFailed');

      await channel.consume(
        userRegistrationFailedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserRegistrationFailed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userRegistrationFailedQueue}`);

      // Queue for email.deliveryFailed event
      const emailDeliveryFailedQueue = 'audit-service.email-deliveryFailed';
      await channel.assertQueue(emailDeliveryFailedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(emailDeliveryFailedQueue, exchange, 'email.deliveryFailed');

      await channel.consume(
        emailDeliveryFailedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEmailDeliveryFailed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${emailDeliveryFailedQueue}`);

      // Queue for verification.email.resent event
      const verificationEmailResentQueue = 'audit-service.verification-email-resent';
      await channel.assertQueue(verificationEmailResentQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(verificationEmailResentQueue, exchange, 'verification.email.resent');

      await channel.consume(
        verificationEmailResentQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleVerificationEmailResent(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${verificationEmailResentQueue}`);

      // Queue for email.verified event (P1UC03)
      const emailVerifiedQueue = 'audit-service.email-verified';
      await channel.assertQueue(emailVerifiedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(emailVerifiedQueue, exchange, 'email.verified');

      await channel.consume(
        emailVerifiedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEmailVerified(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${emailVerifiedQueue}`);

      // Queue for user.login.success event (P2UC01)
      const userLoginSuccessQueue = 'audit-service.user-login-success';
      await channel.assertQueue(userLoginSuccessQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userLoginSuccessQueue, exchange, 'user.login.success');

      await channel.consume(
        userLoginSuccessQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserLoginSuccess(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userLoginSuccessQueue}`);

      // Queue for user.login.failed event (P2UC01)
      const userLoginFailedQueue = 'audit-service.user-login-failed';
      await channel.assertQueue(userLoginFailedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userLoginFailedQueue, exchange, 'user.login.failed');

      await channel.consume(
        userLoginFailedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserLoginFailed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userLoginFailedQueue}`);

      // Queue for password.reset.requested event (P2UC02)
      const passwordResetRequestedQueue = 'audit-service.password-reset-requested';
      await channel.assertQueue(passwordResetRequestedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(passwordResetRequestedQueue, exchange, 'password.reset.requested');

      await channel.consume(
        passwordResetRequestedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handlePasswordResetRequested(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${passwordResetRequestedQueue}`);

      // Queue for password.reset.token.validated event (P2UC02)
      const passwordResetTokenValidatedQueue = 'audit-service.password-reset-token-validated';
      await channel.assertQueue(passwordResetTokenValidatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(
        passwordResetTokenValidatedQueue,
        exchange,
        'password.reset.token.validated',
      );

      await channel.consume(
        passwordResetTokenValidatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handlePasswordResetTokenValidated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${passwordResetTokenValidatedQueue}`);

      // Queue for password.reset.completed event (P2UC02)
      const passwordResetCompletedQueue = 'audit-service.password-reset-completed';
      await channel.assertQueue(passwordResetCompletedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(passwordResetCompletedQueue, exchange, 'password.reset.completed');

      await channel.consume(
        passwordResetCompletedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handlePasswordResetCompleted(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${passwordResetCompletedQueue}`);

      // Queue for password.reset.failed event (P2UC02)
      const passwordResetFailedQueue = 'audit-service.password-reset-failed';
      await channel.assertQueue(passwordResetFailedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(passwordResetFailedQueue, exchange, 'password.reset.failed');

      await channel.consume(
        passwordResetFailedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handlePasswordResetFailed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${passwordResetFailedQueue}`);

      // Queue for dashboard.accessed event (P3UC01)
      const dashboardAccessedQueue = 'audit-service.dashboard-accessed';
      await channel.assertQueue(dashboardAccessedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(dashboardAccessedQueue, exchange, 'dashboard.accessed');

      await channel.consume(
        dashboardAccessedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleDashboardAccessed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${dashboardAccessedQueue}`);

      // Queue for user.languageChanged event (P3UC02)
      const userLanguageChangedQueue = 'audit-service.user-languageChanged';
      await channel.assertQueue(userLanguageChangedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userLanguageChangedQueue, exchange, 'user.language.changed');

      await channel.consume(
        userLanguageChangedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserLanguageChanged(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userLanguageChangedQueue}`);

      // Queue for user.logout.success event (P3UC04)
      const userLogoutSuccessQueue = 'audit-service.user-logout-success';
      await channel.assertQueue(userLogoutSuccessQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userLogoutSuccessQueue, exchange, 'user.logout.success');

      await channel.consume(
        userLogoutSuccessQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserLogoutSuccess(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userLogoutSuccessQueue}`);

      // Queue for session.expired event (P3UC04)
      const sessionExpiredQueue = 'audit-service.session-expired';
      await channel.assertQueue(sessionExpiredQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(sessionExpiredQueue, exchange, 'session.expired');

      await channel.consume(
        sessionExpiredQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleSessionExpired(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${sessionExpiredQueue}`);

      // Queue for user.created event (P4UC01)
      const userCreatedQueue = 'audit-service.user-created';
      await channel.assertQueue(userCreatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userCreatedQueue, exchange, 'user.created');

      await channel.consume(
        userCreatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserCreated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userCreatedQueue}`);

      // Queue for user.roleModified event (P4UC03)
      const userRoleModifiedQueue = 'audit-service.user-roleModified';
      await channel.assertQueue(userRoleModifiedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userRoleModifiedQueue, exchange, 'user.role.modified');

      await channel.consume(
        userRoleModifiedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserRoleModified(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userRoleModifiedQueue}`);

      // Queue for user.profileUpdated event (P4UC04)
      const userProfileUpdatedQueue = 'audit-service.user-profile-updated';
      await channel.assertQueue(userProfileUpdatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userProfileUpdatedQueue, exchange, 'user.profile.updated');

      await channel.consume(
        userProfileUpdatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserProfileUpdated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userProfileUpdatedQueue}`);

      // Queue for user.deactivated event (P4UC05)
      const userDeactivatedQueue = 'audit-service.user-deactivated';
      await channel.assertQueue(userDeactivatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userDeactivatedQueue, exchange, 'user.deactivated');

      await channel.consume(
        userDeactivatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserDeactivated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userDeactivatedQueue}`);

      // Queue for user.reactivated event (P4UC05)
      const userReactivatedQueue = 'audit-service.user-reactivated';
      await channel.assertQueue(userReactivatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(userReactivatedQueue, exchange, 'user.reactivated');

      await channel.consume(
        userReactivatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleUserReactivated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${userReactivatedQueue}`);

      // Queue for password.changed.first.login event (P4UC06)
      const passwordChangedFirstLoginQueue = 'audit-service.password-changed-first-login';
      await channel.assertQueue(passwordChangedFirstLoginQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(passwordChangedFirstLoginQueue, exchange, 'password.changed.first.login');

      await channel.consume(
        passwordChangedFirstLoginQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handlePasswordChangedFirstLogin(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${passwordChangedFirstLoginQueue}`);

      // Queue for equipment.category.created event (P5UC01)
      const equipmentCategoryCreatedQueue = 'audit-service.equipment-category-created';
      await channel.assertQueue(equipmentCategoryCreatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCategoryCreatedQueue, exchange, 'equipment.category.created');

      await channel.consume(
        equipmentCategoryCreatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCategoryCreated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCategoryCreatedQueue}`);

      // Queue for equipment.categories.viewed event (P5UC02)
      const equipmentCategoriesViewedQueue = 'audit.equipment.categories.viewed';
      await channel.assertQueue(equipmentCategoriesViewedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCategoriesViewedQueue, exchange, 'equipment.categories.viewed');

      await channel.consume(
        equipmentCategoriesViewedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCategoriesViewed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCategoriesViewedQueue}`);

      // Queue for equipment.category.updated event (P5UC03)
      const equipmentCategoryUpdatedQueue = 'audit.equipment.category.updated';
      await channel.assertQueue(equipmentCategoryUpdatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCategoryUpdatedQueue, exchange, 'equipment.category.updated');

      await channel.consume(
        equipmentCategoryUpdatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCategoryUpdated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCategoryUpdatedQueue}`);

      // Queue for equipment.category.deactivated event (P5UC04)
      const equipmentCategoryDeactivatedQueue = 'audit.equipment.category.deactivated';
      await channel.assertQueue(equipmentCategoryDeactivatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCategoryDeactivatedQueue, exchange, 'equipment.category.deactivated');

      await channel.consume(
        equipmentCategoryDeactivatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCategoryDeactivated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCategoryDeactivatedQueue}`);

      // Queue for equipment.category.reactivated event (P5UC04)
      const equipmentCategoryReactivatedQueue = 'audit.equipment.category.reactivated';
      await channel.assertQueue(equipmentCategoryReactivatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCategoryReactivatedQueue, exchange, 'equipment.category.reactivated');

      await channel.consume(
        equipmentCategoryReactivatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCategoryReactivated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCategoryReactivatedQueue}`);

      // Queue for equipment.category.deleted event (P5UC04)
      const equipmentCategoryDeletedQueue = 'audit.equipment.category.deleted';
      await channel.assertQueue(equipmentCategoryDeletedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCategoryDeletedQueue, exchange, 'equipment.category.deleted');

      await channel.consume(
        equipmentCategoryDeletedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCategoryDeleted(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCategoryDeletedQueue}`);

      // Queue for equipment.created event (P6UC01)
      const equipmentCreatedQueue = 'audit.equipment.created';
      await channel.assertQueue(equipmentCreatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentCreatedQueue, exchange, 'equipment.created');

      await channel.consume(
        equipmentCreatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentCreated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentCreatedQueue}`);

      // Queue for equipment.list.viewed event (P6UC02)
      const equipmentListViewedQueue = 'audit.equipment.list.viewed';
      await channel.assertQueue(equipmentListViewedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentListViewedQueue, exchange, 'equipment.list.viewed');

      await channel.consume(
        equipmentListViewedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentListViewed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentListViewedQueue}`);

      // Queue for equipment.details.viewed event (P6UC03)
      const equipmentDetailsViewedQueue = 'audit.equipment.details.viewed';
      await channel.assertQueue(equipmentDetailsViewedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentDetailsViewedQueue, exchange, 'equipment.details.viewed');

      await channel.consume(
        equipmentDetailsViewedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentDetailsViewed(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentDetailsViewedQueue}`);

      // Queue for equipment.updated event (P6UC04)
      const equipmentUpdatedQueue = 'audit.equipment.updated';
      await channel.assertQueue(equipmentUpdatedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentUpdatedQueue, exchange, 'equipment.updated');

      await channel.consume(
        equipmentUpdatedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentUpdated(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentUpdatedQueue}`);

      // Queue for equipment.status.changed event (P6UC05)
      const equipmentStatusChangedQueue = 'audit.equipment.status.changed';
      await channel.assertQueue(equipmentStatusChangedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentStatusChangedQueue, exchange, 'equipment.status.changed');

      await channel.consume(
        equipmentStatusChangedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentStatusChanged(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentStatusChangedQueue}`);

      // Queue for equipment.archived event (P6UC05)
      const equipmentArchivedQueue = 'audit.equipment.archived';
      await channel.assertQueue(equipmentArchivedQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentArchivedQueue, exchange, 'equipment.archived');

      await channel.consume(
        equipmentArchivedQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentArchived(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentArchivedQueue}`);

      // Queue for equipment.deleted.permanently event (P6UC05)
      const equipmentDeletedPermanentlyQueue = 'audit.equipment.deleted.permanently';
      await channel.assertQueue(equipmentDeletedPermanentlyQueue, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await channel.bindQueue(equipmentDeletedPermanentlyQueue, exchange, 'equipment.deleted.permanently');

      await channel.consume(
        equipmentDeletedPermanentlyQueue,
        (msg: ConsumeMessage | null) => {
          if (msg) {
            this.handleEquipmentDeletedPermanently(msg, channel);
          }
        },
        { noAck: false },
      );

      this.logger.log(`Consuming from queue: ${equipmentDeletedPermanentlyQueue}`);
    });
  }

  /**
   * Handle user.registered event
   */
  private async handleUserRegistered(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserRegisteredEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.registered event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserRegistrationSuccess(event);

      // ACK message after successful processing
      channel.ack(msg);

      this.logger.log(`Successfully processed user.registered event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Failed to process user.registered event: ${error.message}`, error.stack);

      // NACK and requeue on error
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.registrationFailed event
   */
  private async handleUserRegistrationFailed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserRegistrationFailedEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.registrationFailed event: ${event.eventId} for email: ${event.data.email}`,
      );

      await this.auditService.logUserRegistrationFailure(event);

      // ACK message after successful processing
      channel.ack(msg);

      this.logger.log(`Successfully processed user.registrationFailed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.registrationFailed event: ${error.message}`,
        error.stack,
      );

      // NACK and requeue on error
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle email.deliveryFailed event
   */
  private async handleEmailDeliveryFailed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EmailDeliveryFailedEvent = JSON.parse(content);

      this.logger.log(
        `Processing email.deliveryFailed event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logEmailDeliveryFailure(event);

      // ACK message after successful processing
      channel.ack(msg);

      this.logger.log(`Successfully processed email.deliveryFailed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process email.deliveryFailed event: ${error.message}`,
        error.stack,
      );

      // NACK and requeue on error
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle verification.email.resent event
   */
  private async handleVerificationEmailResent(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: any = JSON.parse(content);

      this.logger.log(
        `Processing verification.email.resent event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logVerificationEmailResent(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed verification.email.resent event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process verification.email.resent event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle email.verified event (P1UC03)
   */
  private async handleEmailVerified(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: any = JSON.parse(content);

      this.logger.log(
        `Processing email.verified event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logEmailVerified(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed email.verified event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process email.verified event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.login.success event (P2UC01)
   */
  private async handleUserLoginSuccess(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: any = JSON.parse(content);

      this.logger.log(
        `Processing user.login.success event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserLoginSuccess(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.login.success event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.login.success event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.login.failed event (P2UC01)
   */
  private async handleUserLoginFailed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: any = JSON.parse(content);

      this.logger.log(
        `Processing user.login.failed event: ${event.eventId} for email: ${event.data.email}`,
      );

      await this.auditService.logUserLoginFailure(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.login.failed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.login.failed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.reset.requested event (P2UC02)
   */
  private async handlePasswordResetRequested(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordResetRequestedEvent = JSON.parse(content);

      this.logger.log(
        `Processing password.reset.requested event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logPasswordResetRequested(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed password.reset.requested event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process password.reset.requested event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.reset.token.validated event (P2UC02)
   */
  private async handlePasswordResetTokenValidated(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordResetTokenValidatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing password.reset.token.validated event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logPasswordResetTokenValidated(event);

      channel.ack(msg);

      this.logger.log(
        `Successfully processed password.reset.token.validated event: ${event.eventId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process password.reset.token.validated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.reset.completed event (P2UC02)
   */
  private async handlePasswordResetCompleted(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordResetCompletedEvent = JSON.parse(content);

      this.logger.log(
        `Processing password.reset.completed event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logPasswordResetCompleted(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed password.reset.completed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process password.reset.completed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.reset.failed event (P2UC02)
   */
  private async handlePasswordResetFailed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordResetFailedEvent = JSON.parse(content);

      this.logger.log(
        `Processing password.reset.failed event: ${event.eventId} for email: ${event.data.email}`,
      );

      await this.auditService.logPasswordResetFailed(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed password.reset.failed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process password.reset.failed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle dashboard.accessed event (P3UC01)
   */
  private async handleDashboardAccessed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: DashboardAccessedEvent = JSON.parse(content);

      this.logger.log(
        `Processing dashboard.accessed event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logDashboardAccessed(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed dashboard.accessed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process dashboard.accessed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.languageChanged event (P3UC02)
   */
  private async handleUserLanguageChanged(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: any = JSON.parse(content);

      this.logger.log(
        `Processing user.languageChanged event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserLanguageChanged(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.languageChanged event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.languageChanged event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.logout.success event (P3UC04)
   */
  private async handleUserLogoutSuccess(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserLogoutSuccessEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.logout.success event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserLogoutSuccess(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.logout.success event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.logout.success event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle session.expired event (P3UC04)
   */
  private async handleSessionExpired(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: SessionExpiredEvent = JSON.parse(content);

      this.logger.log(
        `Processing session.expired event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logSessionExpired(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed session.expired event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process session.expired event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.created event (P4UC01)
   */
  private async handleUserCreated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserCreatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.created event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserCreated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.created event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.created event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.roleModified event (P4UC03)
   */
  private async handleUserRoleModified(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserRoleModifiedEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.roleModified event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserRoleModified(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.roleModified event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.roleModified event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.profileUpdated event (P4UC04)
   */
  private async handleUserProfileUpdated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserProfileUpdatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.profileUpdated event: ${event.eventId} for user: ${event.data.userId}`,
      );

      await this.auditService.logUserProfileUpdated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.profileUpdated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.profileUpdated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, false);
    }
  }

  /**
   * Handle user.deactivated event (P4UC05)
   */
  private async handleUserDeactivated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserDeactivatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.deactivated event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserDeactivated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.deactivated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.deactivated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.reactivated event (P4UC05)
   */
  private async handleUserReactivated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserReactivatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing user.reactivated event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logUserReactivated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed user.reactivated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process user.reactivated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.changed.first.login event (P4UC06)
   */
  private async handlePasswordChangedFirstLogin(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordChangedFirstLoginEvent = JSON.parse(content);

      this.logger.log(
        `Processing password.changed.first.login event: ${event.eventId} for user: ${event.data.email}`,
      );

      await this.auditService.logPasswordChangedFirstLogin(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed password.changed.first.login event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process password.changed.first.login event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.category.created event (P5UC01)
   */
  private async handleEquipmentCategoryCreated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCategoryCreatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.category.created event: ${event.eventId} for category: ${event.data.name}`,
      );

      await this.auditService.logEquipmentCategoryCreated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.category.created event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.category.created event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.categories.viewed event (P5UC02)
   */
  private async handleEquipmentCategoriesViewed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCategoriesViewedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.categories.viewed event: ${event.eventId} for tenant: ${event.data.tenantId}`,
      );

      await this.auditService.logEquipmentCategoriesViewed(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.categories.viewed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.categories.viewed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.category.updated event (P5UC03)
   */
  private async handleEquipmentCategoryUpdated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCategoryUpdatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.category.updated event: ${event.eventId} for category: ${event.data.categoryId}`,
      );

      await this.auditService.logEquipmentCategoryUpdated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.category.updated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.category.updated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.category.deactivated event (P5UC04)
   */
  private async handleEquipmentCategoryDeactivated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCategoryDeactivatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.category.deactivated event: ${event.eventId} for category: ${event.data.categoryId}`,
      );

      await this.auditService.logEquipmentCategoryDeactivated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.category.deactivated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.category.deactivated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.category.reactivated event (P5UC04)
   */
  private async handleEquipmentCategoryReactivated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCategoryReactivatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.category.reactivated event: ${event.eventId} for category: ${event.data.categoryId}`,
      );

      await this.auditService.logEquipmentCategoryReactivated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.category.reactivated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.category.reactivated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.category.deleted event (P5UC04)
   */
  private async handleEquipmentCategoryDeleted(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCategoryDeletedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.category.deleted event: ${event.eventId} for category: ${event.data.categoryId}`,
      );

      await this.auditService.logEquipmentCategoryDeleted(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.category.deleted event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.category.deleted event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.created event (P6UC01)
   */
  private async handleEquipmentCreated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentCreatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.created event: ${event.eventId} for equipment: ${event.data.name}`,
      );

      await this.auditService.logEquipmentCreated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.created event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.created event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.list.viewed event (P6UC02)
   */
  private async handleEquipmentListViewed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentListViewedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.list.viewed event: ${event.eventId} for tenant: ${event.data.tenantId}`,
      );

      await this.auditService.logEquipmentListViewed(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.list.viewed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.list.viewed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.details.viewed event (P6UC03)
   */
  private async handleEquipmentDetailsViewed(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentDetailsViewedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.details.viewed event: ${event.eventId} for equipment: ${event.data.equipmentId}`,
      );

      await this.auditService.logEquipmentDetailsViewed(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.details.viewed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.details.viewed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.updated event (P6UC04)
   */
  private async handleEquipmentUpdated(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentUpdatedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.updated event: ${event.eventId} for equipment: ${event.data.equipmentId}`,
      );

      await this.auditService.logEquipmentUpdated(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.updated event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.updated event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.status.changed event (P6UC05)
   */
  private async handleEquipmentStatusChanged(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentStatusChangedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.status.changed event: ${event.eventId} for equipment: ${event.data.equipmentId}`,
      );

      await this.auditService.logEquipmentStatusChanged(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.status.changed event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.status.changed event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.archived event (P6UC05)
   */
  private async handleEquipmentArchived(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentArchivedEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.archived event: ${event.eventId} for equipment: ${event.data.equipmentId}`,
      );

      await this.auditService.logEquipmentArchived(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.archived event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.archived event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle equipment.deleted.permanently event (P6UC05)
   */
  private async handleEquipmentDeletedPermanently(msg: ConsumeMessage, channel: any): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: EquipmentDeletedPermanentlyEvent = JSON.parse(content);

      this.logger.log(
        `Processing equipment.deleted.permanently event: ${event.eventId} for equipment: ${event.data.equipmentId}`,
      );

      await this.auditService.logEquipmentDeletedPermanently(event);

      channel.ack(msg);

      this.logger.log(`Successfully processed equipment.deleted.permanently event: ${event.eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process equipment.deleted.permanently event: ${error.message}`,
        error.stack,
      );

      channel.nack(msg, false, true);
    }
  }
}
