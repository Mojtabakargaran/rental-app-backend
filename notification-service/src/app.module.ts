import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { EmailService } from './services/email.service';
import { EventConsumerService } from './events/event-consumer.service';
import { EventPublisherService } from './events/event-publisher.service';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  ],
  controllers: [HealthController],
  providers: [
    EmailService,
    EventConsumerService,
    EventPublisherService,
  ],
})
export class AppModule {}
