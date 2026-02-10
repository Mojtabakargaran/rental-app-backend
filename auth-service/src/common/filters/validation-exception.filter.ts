import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

// Map validation constraint names to error codes
const constraintToErrorCode: Record<string, string> = {
  isEmail: 'INVALID_EMAIL',
  isNotEmpty: 'FIELD_REQUIRED',
  minLength: 'MIN_LENGTH_VIOLATION',
  maxLength: 'MAX_LENGTH_VIOLATION',
  isString: 'INVALID_TYPE',
  isUUID: 'INVALID_UUID',
  isPhoneNumber: 'INVALID_PHONE',
};

// Transform class-validator errors to gRPC contract format
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const response = exception.getResponse() as any;
    
    let details = [];
    
    // Extract validation errors
    if (response.message && Array.isArray(response.message)) {
      details = response.message.map((error: any) => {
        if (typeof error === 'object' && error.constraints) {
          const constraintKey = Object.keys(error.constraints)[0];
          const errorCode = constraintToErrorCode[constraintKey] || 'VALIDATION_ERROR';
          
          return {
            field: error.property,
            code: errorCode,
            message: error.constraints[constraintKey],
          };
        }
        return {
          field: 'unknown',
          code: 'VALIDATION_ERROR',
          message: typeof error === 'string' ? error : 'Validation failed',
        };
      });
    }

    console.error('[ValidationExceptionFilter]', {
      details,
    });

    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: { fields: details },
    };
  }
}
