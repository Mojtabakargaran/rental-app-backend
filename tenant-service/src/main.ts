import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create HTTP application
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Connect gRPC microservice
  const grpcPort = configService.get<number>('grpcPort');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'tenant',
      protoPath: join(__dirname, '../proto/tenant.proto'),
      url: `0.0.0.0:${grpcPort}`,
      maxReceiveMessageLength: 1024 * 1024 * 10, // 10MB
      maxSendMessageLength: 1024 * 1024 * 10, // 10MB
    },
  });

  await app.startAllMicroservices();
  logger.log(`gRPC microservice listening on port ${grpcPort}`);

  // Start HTTP server
  const port = configService.get<number>('port') || 3003;
  await app.listen(port);
  logger.log(`HTTP server listening on port ${port}`);
  logger.log(`Tenant Service is running`);
}

bootstrap();
