import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { UserCreatedEvent, UserRoleModifiedEvent } from '../interfaces/events.interface';

@Injectable()
export class EventPublisherService implements OnModuleInit {
  private readonly logger = new Logger(EventPublisherService.name);
  private channelWrapper: ChannelWrapper;
  private connection: amqp.AmqpConnectionManager;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const rabbitmqUrl = this.configService.get<string>('app.rabbitmq.url');
      const exchange = this.configService.get<string>('app.rabbitmq.exchange');

      // Create connection
      this.connection = amqp.connect([rabbitmqUrl]);

      // Create channel wrapper
      this.channelWrapper = this.connection.createChannel({
        setup: async (channel: any) => {
          // Declare exchange
          await channel.assertExchange(exchange, 'topic', { durable: true });
          this.logger.log(`RabbitMQ exchange '${exchange}' declared`);
        },
      });

      this.connection.on('connect', () => {
        this.logger.log('Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.error('Disconnected from RabbitMQ', err);
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize RabbitMQ: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Publish an event to RabbitMQ
   */
  async publishEvent(
    routingKey: string,
    payload: any,
    correlationId?: string,
  ): Promise<void> {
    try {
      const exchange = this.configService.get<string>('app.rabbitmq.exchange') || 'rental_events';
      const message = {
        ...payload,
        timestamp: new Date().toISOString(),
        correlationId: correlationId || payload.correlationId,
      };

      await this.channelWrapper.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          correlationId: correlationId || payload.correlationId,
        } as any,
      );

      this.logger.log(
        `Event published: ${routingKey} [${correlationId || 'no-correlation-id'}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${routingKey}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Close connection on module destroy
   */
  async onModuleDestroy() {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error(
        `Error closing RabbitMQ connection: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Publish user.created event (P4UC01)
   */
  async publishUserCreated(event: UserCreatedEvent): Promise<void> {
    try {
      await this.publishEvent('user.created', event, event.correlationId);
      this.logger.log(
        `Published user.created event for user: ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish user.created event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Publish user.roleModified event (P4UC03)
   */
  async publishUserRoleModified(event: UserRoleModifiedEvent): Promise<void> {
    try {
      await this.publishEvent('user.role.modified', event, event.correlationId);
      this.logger.log(
        `Published user.roleModified event for user: ${event.data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish user.roleModified event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
