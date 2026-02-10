import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { v4 as uuidv4 } from 'uuid';

// Event publisher for RabbitMQ
@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private exchange: string;

  constructor(private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('rabbitmq.exchange') || 'rental_events';
  }

  async onModuleInit() {
    const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
    
    this.connection = amqp.connect([rabbitmqUrl]);
    
    this.channelWrapper = this.connection.createChannel({
      setup: async (channel: any) => {
        await channel.assertExchange(this.exchange, 'topic', { durable: true });
      },
    });

    this.connection.on('connect', () => {
      console.log('[EventPublisher] Connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      console.error('[EventPublisher] Disconnected from RabbitMQ', err);
    });
  }

  async onModuleDestroy() {
    await this.channelWrapper.close();
    await this.connection.close();
  }

  // Publish user.registered event
  async publishUserRegistered(data: {
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
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'user.registered',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        tenantId: data.tenantId,
        companyName: data.companyName,
        languagePreference: data.languagePreference,
        verificationToken: data.verificationToken,
        verificationTokenExpiresAt: data.verificationTokenExpiresAt,
        phoneNumber: data.phoneNumber,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('user.registered', event);
  }

  // Publish user.registrationFailed event
  async publishUserRegistrationFailed(data: {
    email: string;
    companyName: string;
    errorCode: string;
    errorMessage: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'user.registrationFailed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        email: data.email,
        companyName: data.companyName,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('user.registrationFailed', event);
  }

  // Publish verification.email.resent event
  async publishVerificationEmailResent(data: {
    userId: string;
    email: string;
    fullName: string;
    languagePreference: string;
    verificationToken: string;
    verificationTokenExpiresAt: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'verification.email.resent',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        languagePreference: data.languagePreference,
        verificationToken: data.verificationToken,
        verificationTokenExpiresAt: data.verificationTokenExpiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('verification.email.resent', event);
  }

  // Publish email.verified event
  async publishEmailVerified(data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    emailVerifiedAt: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'email.verified',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        tenantId: data.tenantId,
        languagePreference: data.languagePreference,
        emailVerifiedAt: data.emailVerifiedAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('email.verified', event);
  }

  // Publish user.login.success event (P2UC01)
  async publishUserLoginSuccess(data: {
    userId: string;
    email: string;
    tenantId: string;
    sessionId: string;
    rememberMe: boolean;
    sessionExpiresAt: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'user.login.success',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        rememberMe: data.rememberMe,
        sessionExpiresAt: data.sessionExpiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('user.login.success', event);
  }

  // Publish user.login.failed event (P2UC01)
  async publishUserLoginFailed(data: {
    email: string;
    userId?: string;
    tenantId?: string;
    failureReason: string;
    attemptsRemaining?: number;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'user.login.failed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        email: data.email,
        userId: data.userId,
        tenantId: data.tenantId,
        failureReason: data.failureReason,
        attemptsRemaining: data.attemptsRemaining,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('user.login.failed', event);
  }

  // Publish password.reset.requested event (P2UC02)
  async publishPasswordResetRequested(data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    resetToken: string;
    resetTokenExpiresAt: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'password.reset.requested',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        tenantId: data.tenantId,
        languagePreference: data.languagePreference,
        resetToken: data.resetToken,
        resetTokenExpiresAt: data.resetTokenExpiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('password.reset.requested', event);
  }

  // Publish password.reset.token.validated event (P2UC02)
  async publishPasswordResetTokenValidated(data: {
    userId: string;
    email: string;
    tenantId: string;
    tokenId: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'password.reset.token.validated',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        tenantId: data.tenantId,
        tokenId: data.tokenId,
      },
    };

    await this.publishEvent('password.reset.token.validated', event);
  }

  // Publish password.reset.completed event (P2UC02)
  async publishPasswordResetCompleted(data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    passwordChangedAt: string;
    sessionsInvalidated: number;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'password.reset.completed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        tenantId: data.tenantId,
        languagePreference: data.languagePreference,
        passwordChangedAt: data.passwordChangedAt,
        sessionsInvalidated: data.sessionsInvalidated,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('password.reset.completed', event);
  }

  // Publish password.reset.failed event (P2UC02)
  async publishPasswordResetFailed(data: {
    email: string;
    userId?: string;
    tenantId?: string;
    failureReason: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'password.reset.failed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        email: data.email,
        userId: data.userId,
        tenantId: data.tenantId,
        failureReason: data.failureReason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('password.reset.failed', event);
  }

  // Generic publish method
  private async publishEvent(routingKey: string, event: any): Promise<void> {
    try {
      await this.channelWrapper.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
        } as any,
      );
      console.log(`[EventPublisher] Published event: ${routingKey}`, { eventId: event.eventId });
    } catch (error) {
      console.error(`[EventPublisher] Failed to publish event: ${routingKey}`, error);
      throw error;
    }
  }

  // P3UC01: Publish dashboard.accessed event
  async publishDashboardAccessed(data: {
    userId: string;
    tenantId: string;
    sessionId: string;
    email: string;
    fullName: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const eventId = uuidv4();
    const routingKey = 'dashboard.accessed';

    const event = {
      eventType: 'dashboard.accessed',
      eventId,
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        email: data.email,
        fullName: data.fullName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    try {
      await this.channelWrapper.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
        } as any,
      );
      console.log(`[EventPublisher] Published event: ${routingKey}`, { eventId: event.eventId });
    } catch (error) {
      console.error(`[EventPublisher] Failed to publish event: ${routingKey}`, error);
      throw error;
    }
  }

  // P3UC04: Publish user.logout.success event
  async publishUserLogoutSuccess(data: {
    userId: string;
    email: string;
    tenantId: string;
    sessionId: string;
    invalidationReason: string;
    sessionDuration: number;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'user.logout.success',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        invalidationReason: data.invalidationReason,
        sessionDuration: data.sessionDuration,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('user.logout.success', event);
  }

  // P3UC04: Publish session.expired event
  async publishSessionExpired(data: {
    userId: string;
    email: string;
    tenantId: string;
    sessionId: string;
    expirationReason: string;
    sessionDuration: number;
    lastActivityAt: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'session.expired',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        tenantId: data.tenantId,
        sessionId: data.sessionId,
        expirationReason: data.expirationReason,
        sessionDuration: data.sessionDuration,
        lastActivityAt: data.lastActivityAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('session.expired', event);
  }

  // P4UC06: Publish password.changed.first.login event
  async publishPasswordChangedFirstLogin(data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    passwordChangedAt: string;
    sessionId: string;
    sessionExpiresAt: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): Promise<void> {
    const event = {
      eventType: 'password.changed.first.login',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        tenantId: data.tenantId,
        passwordChangedAt: data.passwordChangedAt,
        sessionId: data.sessionId,
        sessionExpiresAt: data.sessionExpiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    };

    await this.publishEvent('password.changed.first.login', event);
  }
}
