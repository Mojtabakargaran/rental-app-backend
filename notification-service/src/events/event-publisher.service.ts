import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { v4 as uuidv4 } from 'uuid';
import { EmailDeliveryFailedEventData } from '../interfaces/events.interface';

@Injectable()
export class EventPublisherService implements OnModuleInit {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
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
      this.logger.log('Publisher connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.error('Publisher disconnected from RabbitMQ', err);
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
   * Publish email.deliveryFailed event
   */
  async publishEmailDeliveryFailed(
    data: EmailDeliveryFailedEventData,
  ): Promise<void> {
    const event = {
      eventType: 'email.deliveryFailed',
      eventId: uuidv4(),
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId,
      data: {
        userId: data.userId,
        email: data.email,
        emailType: data.emailType,
        attemptCount: data.attemptCount,
        lastError: data.lastError,
        originalEventId: data.originalEventId,
      },
    };

    try {
      const exchange = this.configService.get('rabbitmq.exchange');
      const routingKey = 'email.deliveryFailed';

      await this.channelWrapper.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
        } as any,
      );

      this.logger.log(
        `Published email.deliveryFailed event: ${event.eventId} for user: ${data.email}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish email.deliveryFailed event:', error);
      throw error;
    }
  }
}
