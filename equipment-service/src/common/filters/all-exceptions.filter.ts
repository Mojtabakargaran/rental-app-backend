import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details = {};

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      errorMessage = typeof response === 'string' ? response : (response as any).message || errorMessage;
      errorCode = (response as any).code || 'HTTP_ERROR';
      details = (response as any).details || {};
    } else if (exception instanceof RpcException) {
      const error = exception.getError();
      errorMessage = typeof error === 'string' ? error : (error as any).message || errorMessage;
      errorCode = (error as any).code || 'RPC_ERROR';
      details = (error as any).details || {};
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      errorCode = 'UNKNOWN_ERROR';
    }

    console.error('[AllExceptionsFilter]', {
      errorCode,
      errorMessage,
      details,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      details,
    };
  }
}
