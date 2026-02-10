import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Get configuration
  const port = configService.get('port');
  const appName = configService.get('app.name');
  const appVersion = configService.get('app.version');

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(port);
  
  logger.log(`${appName} v${appVersion} is running on port ${port}`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
