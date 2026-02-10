import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
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
