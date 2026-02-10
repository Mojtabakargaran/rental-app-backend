import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { RedisService } from './services/redis.service';
import { UserGrpcController } from './controllers/user-grpc.controller';
import { HealthController } from './controllers/health.controller';
import { EventPublisherService } from './events/event-publisher.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    // TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('app.database.host'),
        port: configService.get('app.database.port'),
        username: configService.get('app.database.username'),
        password: configService.get('app.database.password'),
        database: configService.get('app.database.database'),
        entities: [User, Role, UserRole],
        synchronize: configService.get('app.database.synchronize'),
        logging: configService.get('app.database.logging'),
      }),
    }),

    // Feature modules
    TypeOrmModule.forFeature([User, Role, UserRole]),
  ],
  controllers: [UserGrpcController, HealthController],
  providers: [
    UserService,
    RoleService,
    RedisService,
    EventPublisherService,
    // Global exception filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
})
export class AppModule {}
