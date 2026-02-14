import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';
import { DataSource } from 'typeorm';

async function runMigrations() {
  const logger = new Logger('Migrations');
  
  try {
    // Import the DataSource configuration
    const { default: AppDataSource } = await import('./config/typeorm.config');
    
    // Initialize the DataSource
    await AppDataSource.initialize();
    logger.log('Database connection established');
    
    // Run pending migrations
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      logger.log('No pending migrations');
    } else {
      logger.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        logger.log(`  - ${migration.name}`);
      });
    }
    
    // Close the connection
    await AppDataSource.destroy();
    logger.log('Migration process completed');
  } catch (error) {
    logger.error('Migration failed:', error.message);
    logger.error(error.stack);
    throw error;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Run migrations before starting the application
  await runMigrations(); 

  // Create HTTP application for health checks
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  const httpPort = configService.get<number>('app.port') || 3002;
  await app.listen(httpPort);
  logger.log(`HTTP server listening on port ${httpPort}`);

  // Connect gRPC microservice
  const grpcPort = configService.get<number>('app.grpcPort') || 50052;
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(__dirname, '../proto/user.proto'),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  await app.startAllMicroservices();
  logger.log(`gRPC server listening on port ${grpcPort}`);
}

bootstrap();
