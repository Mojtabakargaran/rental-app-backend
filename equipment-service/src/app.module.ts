import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { EquipmentCategory } from './entities/equipment-category.entity';
import { Equipment } from './entities/equipment.entity';
import { CategoryService } from './services/category.service';
import { EquipmentService } from './services/equipment.service';
import { EquipmentController } from './controllers/equipment.controller';
import { EventPublisherService } from './events/event-publisher.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [EquipmentCategory, Equipment],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('nodeEnv') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([EquipmentCategory, Equipment]),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('rabbitmq.url')],
            queue: configService.get('rabbitmq.queue'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [EquipmentController],
  providers: [CategoryService, EquipmentService, EventPublisherService],
})
export class AppModule {}
