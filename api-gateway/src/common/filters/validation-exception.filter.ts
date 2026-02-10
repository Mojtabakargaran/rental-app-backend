import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

interface ErrorDetail {
  field: string;
  message: string;
  code: string;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  // Map validation constraint names to error codes from REST contracts
  private readonly constraintToCodeMap: Record<string, string> = {
    isEmail: 'INVALID_EMAIL_FORMAT',
    minLength: 'VALIDATION_ERROR',
    maxLength: 'VALIDATION_ERROR',
    matches: 'VALIDATION_ERROR',
    isString: 'VALIDATION_ERROR',
    isNotEmpty: 'REQUIRED_FIELD_MISSING',
    invalidFullName: 'INVALID_FULL_NAME',
    invalidPhone: 'INVALID_PHONE_FORMAT',
    isInt: 'VALIDATION_ERROR',
    min: 'VALIDATION_ERROR',
    max: 'VALIDATION_ERROR',
    isIn: 'VALIDATION_ERROR',
    isUUID: 'VALIDATION_ERROR',
    isBoolean: 'VALIDATION_ERROR',
  };

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();
    const status = exception.getStatus();

    // Extract validation errors if they exist
    let details: ErrorDetail[] | undefined;
    let errorCode = 'VALIDATION_ERROR';
    let errorMessage = 'error.validationFailed';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, any>;

      // Check if this is a custom error with error and code fields (like EMAIL_ALREADY_EXISTS)
      // Priority check: error + code structure (our custom errors)
      if (responseObj.error && responseObj.code) {
        errorMessage = responseObj.error;
        errorCode = responseObj.code;

        this.logger.warn(
          `Validation failed for ${request.method} ${request.url} - Code: ${errorCode}, Message: ${errorMessage}`,
        );

        response.status(status).json({
          success: false,
          error: errorMessage,
          code: errorCode,
        });
        return;
      }

      // Check if this is a custom error with message and code (alternative structure)
      if (responseObj.message && responseObj.code && !Array.isArray(responseObj.message)) {
        errorMessage = responseObj.message;
        errorCode = responseObj.code;

        this.logger.warn(
          `Validation failed for ${request.method} ${request.url} - Code: ${errorCode}, Message: ${errorMessage}`,
        );

        response.status(status).json({
          success: false,
          error: errorMessage,
          code: errorCode,
        });
        return;
      }

      // Handle class-validator validation errors
      if (Array.isArray(responseObj.message)) {
        details = this.transformValidationErrors(responseObj.message);

        // Set specific error code based on first validation error
        if (details.length > 0) {
          errorCode = details[0].code;
          errorMessage = details[0].message;
        }
      }
    }

    this.logger.warn(`Validation failed for ${request.method} ${request.url} - Code: ${errorCode}`);

    response.status(status).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details,
    });
  }

  private transformValidationErrors(errors: any[]): ErrorDetail[] {
    const details: ErrorDetail[] = [];

    for (const error of errors) {
      if (error.constraints) {
        const field = error.property;
        const constraints = Object.keys(error.constraints);

        for (const constraint of constraints) {
          const message = error.constraints[constraint];
          const code = this.getErrorCode(constraint, field, message);

          details.push({
            field,
            message,
            code,
          });
        }
      }
    }

    return details;
  }

  private getErrorCode(constraint: string, field: string, message: string): string {
    // Check if message already contains error code (custom messages)
    if (message.startsWith('error.')) {
      return this.extractCodeFromMessage(message);
    }

    // Use constraint mapping
    return this.constraintToCodeMap[constraint] || 'VALIDATION_ERROR';
  }

  private extractCodeFromMessage(message: string): string {
    // Convert i18n key to error code
    // e.g., 'error.invalidEmail' -> 'INVALID_EMAIL_FORMAT'
    const matches = message.match(/error\.(\w+)/);
    if (matches && matches[1]) {
      const key = matches[1];
      const codeMap: Record<string, string> = {
        invalidEmail: 'INVALID_EMAIL_FORMAT',
        weakPassword: 'WEAK_PASSWORD',
        invalidPhone: 'INVALID_PHONE_FORMAT',
        emailExists: 'EMAIL_ALREADY_EXISTS',
        passwordMismatch: 'PASSWORD_MISMATCH',
        requiredField: 'REQUIRED_FIELD_MISSING',
        invalidFullName: 'INVALID_FULL_NAME',
        roleNotFound: 'ROLE_NOT_FOUND',
        invalidPage: 'INVALID_PAGE_NUMBER',
        invalidLimit: 'INVALID_LIMIT',
        invalidStatus: 'INVALID_STATUS_FILTER',
        searchTooShort: 'SEARCH_TOO_SHORT',
        passwordTooShort: 'PASSWORD_TOO_SHORT',
        passwordMissingUppercase: 'PASSWORD_MISSING_UPPERCASE',
        passwordMissingLowercase: 'PASSWORD_MISSING_LOWERCASE',
        passwordMissingNumber: 'PASSWORD_MISSING_NUMBER',
        passwordMissingSpecialChar: 'PASSWORD_MISSING_SPECIAL_CHAR',
        passwordsDoNotMatch: 'PASSWORDS_DO_NOT_MATCH',
        passwordReuseNotAllowed: 'PASSWORD_REUSE_NOT_ALLOWED',
        passwordInBlacklist: 'PASSWORD_IN_BLACKLIST',
        passwordTooCommon: 'PASSWORD_TOO_COMMON',
        tempSessionExpired: 'TEMP_SESSION_EXPIRED',
        tempSessionInvalid: 'TEMP_SESSION_INVALID',
        categoryNameExists: 'CATEGORY_NAME_EXISTS',
        invalidCategoryName: 'INVALID_CATEGORY_NAME',
        categoryNameTooShort: 'CATEGORY_NAME_TOO_SHORT',
        categoryNameTooLong: 'CATEGORY_NAME_TOO_LONG',
        descriptionTooLong: 'DESCRIPTION_TOO_LONG',
        parentCategoryNotFound: 'PARENT_CATEGORY_NOT_FOUND',
        parentCategoryInactive: 'PARENT_CATEGORY_INACTIVE',
        maxHierarchyDepthExceeded: 'MAX_HIERARCHY_DEPTH_EXCEEDED',
        circularReferenceDetected: 'CIRCULAR_REFERENCE_DETECTED',
        companyNotFound: 'COMPANY_NOT_FOUND',
        companyInactive: 'COMPANY_INACTIVE',
        accountSuspended: 'ACCOUNT_SUSPENDED',
        tooManyLoginAttempts: 'TOO_MANY_LOGIN_ATTEMPTS',
        tokenInvalidated: 'TOKEN_INVALIDATED',
        databaseError: 'DATABASE_ERROR',
        loadFailed: 'LOAD_FAILED',
      };

      return codeMap[key] || 'VALIDATION_ERROR';
    }

    return 'VALIDATION_ERROR';
  }
}
