import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// HTTP controller for health checks
@Controller()
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('health')
  health() {
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
    };
  }
}
