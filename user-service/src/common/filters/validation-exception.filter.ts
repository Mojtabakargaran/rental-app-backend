import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  // Map validation constraints to error codes
  private readonly constraintToCodeMap: Record<string, string> = {
    isEmail: 'INVALID_EMAIL',
    isNotEmpty: 'FIELD_REQUIRED',
    minLength: 'MIN_LENGTH',
    maxLength: 'MAX_LENGTH',
    isString: 'INVALID_TYPE',
    isUUID: 'INVALID_UUID',
    isPhoneNumber: 'INVALID_PHONE',
    matches: 'INVALID_FORMAT',
  };

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const exceptionResponse: any = exception.getResponse();
    const validationErrors = exceptionResponse.message;

    // Transform validation errors to contract format
    const errors: Array<{
      field: string;
      message: string;
      code: string;
    }> = [];

    if (Array.isArray(validationErrors)) {
      validationErrors.forEach((error: any) => {
        if (typeof error === 'object' && error.constraints) {
          const field = error.property;
          const constraints = error.constraints;

          Object.keys(constraints).forEach((constraint) => {
            errors.push({
              field,
              message: constraints[constraint],
              code: this.constraintToCodeMap[constraint] || 'VALIDATION_ERROR',
            });
          });
        } else if (typeof error === 'string') {
          errors.push({
            field: 'unknown',
            message: error,
            code: 'VALIDATION_ERROR',
          });
        }
      });
    }

    this.logger.warn(
      `Validation failed for ${request.method} ${request.url}: ${JSON.stringify(errors)}`,
    );

    response.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
