import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { EmailService } from '../services/email.service';
import { EventPublisherService } from './event-publisher.service';
import { 
  UserRegisteredEvent,
  PasswordResetRequestedEvent,
  PasswordResetCompletedEvent,
  UserCreatedEvent,
  UserProfileUpdatedEvent,
  UserDeactivatedEvent,
  UserReactivatedEvent,
  PasswordChangedFirstLoginEvent,
} from '../interfaces/events.interface';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private readonly logger = new Logger(EventConsumerService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly eventPublisher: EventPublisherService,
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
      const queueUserRegistered = 'email-service.user-registered';
      await channel.assertQueue(queueUserRegistered, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queueUserRegistered, exchange, 'user.registered');
      
      await channel.consume(queueUserRegistered, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleUserRegistered(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queueUserRegistered}`);

      // Queue for verification.email.resent event
      const queueVerificationResent = 'email-service.verification-email-resent';
      await channel.assertQueue(queueVerificationResent, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queueVerificationResent, exchange, 'verification.email.resent');
      
      await channel.consume(queueVerificationResent, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleVerificationEmailResent(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queueVerificationResent}`);

      // Queue for password.reset.requested event (P2UC02)
      const queuePasswordResetRequested = 'email-service.password-reset-requested';
      await channel.assertQueue(queuePasswordResetRequested, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queuePasswordResetRequested, exchange, 'password.reset.requested');
      
      await channel.consume(queuePasswordResetRequested, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handlePasswordResetRequested(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queuePasswordResetRequested}`);

      // Queue for password.reset.completed event (P2UC02)
      const queuePasswordResetCompleted = 'email-service.password-reset-completed';
      await channel.assertQueue(queuePasswordResetCompleted, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queuePasswordResetCompleted, exchange, 'password.reset.completed');
      
      await channel.consume(queuePasswordResetCompleted, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handlePasswordResetCompleted(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queuePasswordResetCompleted}`);

      // Queue for user.created event (P4UC01)
      const queueUserCreated = 'email-service.user-created';
      await channel.assertQueue(queueUserCreated, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queueUserCreated, exchange, 'user.created');
      
      await channel.consume(queueUserCreated, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleUserCreated(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queueUserCreated}`);

      // Queue for user.profileUpdated event (P4UC04)
      const queueUserProfileUpdated = 'email-service.user-profile-updated';
      await channel.assertQueue(queueUserProfileUpdated, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queueUserProfileUpdated, exchange, 'user.profile.updated');
      
      await channel.consume(queueUserProfileUpdated, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleUserProfileUpdated(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queueUserProfileUpdated}`);

      // Queue for user.deactivated event (P4UC05)
      const queueUserDeactivated = 'notification-service.user-deactivated';
      await channel.assertQueue(queueUserDeactivated, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queueUserDeactivated, exchange, 'user.deactivated');
      
      await channel.consume(queueUserDeactivated, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleUserDeactivated(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queueUserDeactivated}`);

      // Queue for user.reactivated event (P4UC05)
      const queueUserReactivated = 'notification-service.user-reactivated';
      await channel.assertQueue(queueUserReactivated, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queueUserReactivated, exchange, 'user.reactivated');
      
      await channel.consume(queueUserReactivated, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleUserReactivated(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queueUserReactivated}`);

      // Queue for password.changed.first.login event (P4UC06)
      const queuePasswordChangedFirstLogin = 'notification-service.password-changed-first-login';
      await channel.assertQueue(queuePasswordChangedFirstLogin, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });
      
      await channel.bindQueue(queuePasswordChangedFirstLogin, exchange, 'password.changed.first.login');
      
      await channel.consume(queuePasswordChangedFirstLogin, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handlePasswordChangedFirstLogin(msg, channel);
        }
      }, { noAck: false });
      
      this.logger.log(`Consuming from queue: ${queuePasswordChangedFirstLogin}`);
    });
  }

  /**
   * Handle user.registered event with retry logic
   */
  private async handleUserRegistered(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserRegisteredEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing user.registered event: ${event.eventId} for user: ${event.data.email}`,
      );

      // Attempt to send email with retries
      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendVerificationEmail(
            event.data.email,
            event.data.fullName,
            event.data.companyName,
            event.data.verificationToken,
            event.data.languagePreference,
          );

          // Success - ACK message
          channel.ack(msg);
          this.logger.log(
            `Successfully sent verification email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      // All retries exhausted - publish failure event
      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'verification',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      // ACK message to prevent infinite reprocessing
      channel.ack(msg);
      this.logger.error(
        `Failed to send email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing user.registered event:', error);
      // NACK and requeue for transient errors (e.g., invalid JSON)
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle verification.email.resent event with retry logic
   */
  private async handleVerificationEmailResent(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: any = JSON.parse(content);
      
      this.logger.log(
        `Processing verification.email.resent event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendVerificationEmail(
            event.data.email,
            event.data.fullName,
            '',
            event.data.verificationToken,
            event.data.languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent resend verification email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'verification-resend',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send resend verification email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing verification.email.resent event:', error);
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.reset.requested event with retry logic (P2UC02)
   */
  private async handlePasswordResetRequested(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordResetRequestedEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing password.reset.requested event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendPasswordResetRequestedEmail(
            event.data.email,
            event.data.fullName,
            event.data.resetToken,
            event.data.languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent password reset email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'password-reset-requested',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send password reset email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing password.reset.requested event:', error);
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle password.reset.completed event with retry logic (P2UC02)
   */
  private async handlePasswordResetCompleted(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordResetCompletedEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing password.reset.completed event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendPasswordResetCompletedEmail(
            event.data.email,
            event.data.fullName,
            event.data.passwordChangedAt,
            event.data.languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent password reset confirmation email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'password-reset-completed',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send password reset confirmation email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing password.reset.completed event:', error);
      channel.nack(msg, false, true);
    }
  }

  /**
   * Handle user.created event with retry logic (P4UC01)
   */
  private async handleUserCreated(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserCreatedEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing user.created event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendWelcomeEmail(
            event.data.email,
            event.data.fullName,
            event.data.temporaryPassword,
            event.data.roleCode,
            event.data.createdByLanguage,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent welcome email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'welcome',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send welcome email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing user.created event:', error);
      channel.nack(msg, false, true);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle user.profileUpdated event (P4UC04)
   */
  private async handleUserProfileUpdated(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserProfileUpdatedEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing user.profileUpdated event: ${event.eventId} for user: ${event.data.userId}`,
      );

      // Only send email if email was changed
      if (!event.data.emailChanged) {
        this.logger.log(
          `Email not changed for user ${event.data.userId}, skipping email send`,
        );
        channel.ack(msg);
        return;
      }

      // Email was changed - send verification email
      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendEmailVerificationAfterProfileUpdate(
            event.data.email,
            event.data.fullName,
            event.data.oldValues.email || '',
            event.data.verificationToken || '',
            event.data.languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent email verification to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      // All retries failed - publish failure event
      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'profile_email_verification',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send email verification to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing user.profileUpdated event:', error);
      channel.nack(msg, false, false);
    }
  }

  /**
   * Handle user.deactivated event (P4UC05 - optional email feature)
   */
  private async handleUserDeactivated(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserDeactivatedEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing user.deactivated event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendAccountDeactivatedEmail(
            event.data.email,
            event.data.fullName,
            event.data.deactivatedAt,
            event.data.reason,
            event.data.languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent account deactivation email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      // All retries failed - publish failure event
      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'account_deactivated',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send account deactivation email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing user.deactivated event:', error);
      channel.nack(msg, false, false);
    }
  }

  /**
   * Handle user.reactivated event (P4UC05 - optional email feature)
   */
  private async handleUserReactivated(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: UserReactivatedEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing user.reactivated event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendAccountReactivatedEmail(
            event.data.email,
            event.data.fullName,
            event.data.reactivatedAt,
            event.data.languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent account reactivation email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      // All retries failed - publish failure event
      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'account_reactivated',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send account reactivation email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing user.reactivated event:', error);
      channel.nack(msg, false, false);
    }
  }

  /**
   * Handle password.changed.first.login event (P4UC06)
   */
  private async handlePasswordChangedFirstLogin(
    msg: ConsumeMessage,
    channel: any,
  ): Promise<void> {
    try {
      const content = msg.content.toString();
      const event: PasswordChangedFirstLoginEvent = JSON.parse(content);
      
      this.logger.log(
        `Processing password.changed.first.login event: ${event.eventId} for user: ${event.data.email}`,
      );

      const maxRetries = this.configService.get('retry.maxRetries');
      const retryDelay = this.configService.get('retry.retryDelay');
      
      let attemptCount = 0;
      let lastError: Error | null = null;

      // Need to fetch user language preference from user-service
      // For now, using default 'en' - should be enhanced to call user-service gRPC
      const languagePreference = 'en';

      for (attemptCount = 1; attemptCount <= maxRetries; attemptCount++) {
        try {
          await this.emailService.sendPasswordChangedFirstLoginEmail(
            event.data.email,
            event.data.fullName,
            event.data.passwordChangedAt,
            event.data.ipAddress,
            event.data.userAgent,
            languagePreference,
          );

          channel.ack(msg);
          this.logger.log(
            `Successfully sent password changed first login email to ${event.data.email}`,
          );
          return;
        } catch (error) {
          lastError = error as Error;
          this.logger.warn(
            `Attempt ${attemptCount}/${maxRetries} failed for ${event.data.email}: ${error.message}`,
          );

          if (attemptCount < maxRetries) {
            const delay = retryDelay * Math.pow(2, attemptCount - 1);
            await this.sleep(delay);
          }
        }
      }

      // All retries failed - publish failure event
      await this.eventPublisher.publishEmailDeliveryFailed({
        userId: event.data.userId,
        email: event.data.email,
        emailType: 'password_changed_first_login',
        attemptCount,
        lastError: lastError?.message || 'Unknown error',
        originalEventId: event.eventId,
        correlationId: event.correlationId,
      });

      channel.ack(msg);
      this.logger.error(
        `Failed to send password changed first login email to ${event.data.email} after ${attemptCount} attempts`,
      );
    } catch (error) {
      this.logger.error('Error processing password.changed.first.login event:', error);
      channel.nack(msg, false, false);
    }
  }
}
