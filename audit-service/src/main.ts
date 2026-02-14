import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function runMigrations() {
  const logger = new Logger('Migrations');
  
  try {
    const { default: AppDataSource } = await import('./config/typeorm.config');
    await AppDataSource.initialize();
    logger.log('Database connection established');
    
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      logger.log('No pending migrations');
    } else {
      logger.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        logger.log(`  - ${migration.name}`);
      });
    }
    
    await AppDataSource.destroy();
    logger.log('Migration process completed');
  } catch (error) {
    logger.error('Migration failed:', error.message);
    logger.error(error.stack);
    throw error;
  }
}

async function bootstrap() {
  await runMigrations();
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration
  const httpPort = configService.get<number>('port') || 3005;

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Start HTTP server for health checks
  await app.listen(httpPort);

  console.log(`[Audit Service] HTTP server listening on port ${httpPort}`);
  console.log(`[Audit Service] Event consumers initialized`);
}

bootstrap();
