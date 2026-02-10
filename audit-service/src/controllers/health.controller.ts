import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Health check controller
 */
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: this.configService.get('app.name'),
      version: this.configService.get('app.version'),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ready',
      service: this.configService.get('app.name'),
      timestamp: new Date().toISOString(),
    };
  }
}
