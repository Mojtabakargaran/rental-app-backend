import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse: any = exception.getResponse();
    const validationErrors = exceptionResponse.message;

    // Transform validation errors to contract format
    const errorDetails = Array.isArray(validationErrors)
      ? validationErrors.map((error: any) => {
          if (typeof error === 'string') {
            return { field: 'unknown', message: error };
          }
          return {
            field: error.property || 'unknown',
            message: Object.values(error.constraints || {}).join(', '),
          };
        })
      : [{ field: 'unknown', message: validationErrors }];

    this.logger.warn(
      `Validation failed: ${JSON.stringify(errorDetails)} | Path: ${request.url}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: errorDetails,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
