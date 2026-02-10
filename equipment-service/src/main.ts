import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { join } from 'path';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const grpcPort = configService.get<number>('grpcPort') || 50056;
  const httpPort = configService.get<number>('port') || 3006;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'equipment',
      protoPath: join(__dirname, '..', 'proto', 'equipment.proto'),
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(), new ValidationExceptionFilter());

  await app.startAllMicroservices();
  await app.listen(httpPort);

  console.log(`[Equipment Service] gRPC server listening on port ${grpcPort}`);
  console.log(`[Equipment Service] HTTP server listening on port ${httpPort}`);
}

bootstrap();
