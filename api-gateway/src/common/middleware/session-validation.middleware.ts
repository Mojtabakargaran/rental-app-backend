import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Inject,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Request, Response, NextFunction } from 'express';
import { firstValueFrom } from 'rxjs';
import { generateCorrelationId } from '../utils/request.util';

interface ValidateSessionResponse {
  success: boolean;
  userId?: string;
  tenantId?: string;
  email?: string;
  isActive?: boolean;
  error?: string;
  code?: string;
}

interface IAuthServiceGrpc {
  validateSession(data: any): any;
}

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware, OnModuleInit {
  private readonly logger = new Logger(SessionValidationMiddleware.name);
  private authServiceGrpc: IAuthServiceGrpc;

  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.authServiceGrpc = this.client.getService<IAuthServiceGrpc>('AuthService');
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const sessionToken = req.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const correlationId = generateCorrelationId();

    try {
      const response = (await firstValueFrom(
        this.authServiceGrpc.validateSession({
          sessionToken,
          correlationId,
        }),
      )) as ValidateSessionResponse;

      if (!response.success) {
        const errorCodeMap: Record<string, { message: string; code: string }> = {
          SESSION_EXPIRED: {
            message: 'error.sessionExpired',
            code: 'SESSION_EXPIRED',
          },
          SESSION_NOT_FOUND: {
            message: 'error.unauthorized',
            code: 'UNAUTHORIZED',
          },
          INVALID_SESSION: {
            message: 'error.sessionExpired',
            code: 'SESSION_EXPIRED',
          },
        };

        const errorInfo = errorCodeMap[response.code || ''] || {
          message: 'error.unauthorized',
          code: 'UNAUTHORIZED',
        };

        throw new UnauthorizedException({
          success: false,
          error: errorInfo.message,
          code: errorInfo.code,
        });
      }

      // Attach session data to request for downstream use
      (req as any).session = {
        userId: response.userId,
        tenantId: response.tenantId,
        email: response.email,
        isActive: response.isActive,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Session validation failed: ${error.message}`, error.stack);

      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }
  }
}
