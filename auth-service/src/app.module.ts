import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { VerificationToken } from './entities/verification-token.entity';
import { Session } from './entities/session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { AuthService } from './services/auth.service';
import { UserGrpcClientService } from './services/user-grpc-client.service';
import { TenantGrpcClientService } from './services/tenant-grpc-client.service';
import { EventPublisherService } from './events/event-publisher.service';
import { RedisService } from './services/redis.service';

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
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [VerificationToken, Session, PasswordResetToken],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
      }),
    }),

    // Feature modules
    TypeOrmModule.forFeature([VerificationToken, Session, PasswordResetToken]),
  ],
  controllers: [AuthController, HealthController],
  providers: [
    AuthService,
    UserGrpcClientService,
    TenantGrpcClientService,
    EventPublisherService,
    RedisService,
  ],
})
export class AppModule {}
