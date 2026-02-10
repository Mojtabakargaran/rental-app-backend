import { Controller, Get, HttpStatus } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';

@Controller('health')
export class HealthController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  async check() {
    const isHealthy = await this.tenantService.checkHealth();
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'tenant-service',
      timestamp: new Date().toISOString(),
      httpStatus: isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    };
  }
}
