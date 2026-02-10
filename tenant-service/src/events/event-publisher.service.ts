import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly exchange: string;

  constructor(private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('rabbitmq.exchange') || 'rental_events';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
      
      this.connection = amqp.connect([rabbitmqUrl], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 2,
      });

      this.connection.on('connect', () => {
        this.logger.log('Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (params: { err: Error }) => {
        this.logger.warn('Disconnected from RabbitMQ', params?.err?.message);
      });

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: any) => {
          await channel.assertExchange(this.exchange, 'topic', { durable: true });
          this.logger.log(`Exchange ${this.exchange} asserted`);
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('Event publisher initialized');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      throw error;
    }
  }

  private async disconnect() {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error.stack);
    }
  }

  /**
   * Publish TenantCreated event for P1UC01
   */
  async publishTenantCreated(payload: {
    tenantId: string;
    companyName: string;
    createdAt: string;
    correlationId: string;
  }): Promise<void> {
    const routingKey = 'tenant.created';
    
    try {
      await this.channelWrapper.publish(
        this.exchange,
        routingKey,
        {
          eventType: 'TenantCreated',
          timestamp: new Date().toISOString(),
          ...payload,
        },
        {
          persistent: true,
        } as any,
      );

      this.logger.log(
        `Published TenantCreated event for tenant ${payload.tenantId} [${payload.correlationId}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish TenantCreated event: ${error.message} [${payload.correlationId}]`,
        error.stack,
      );
      throw error;
    }
  }
}
