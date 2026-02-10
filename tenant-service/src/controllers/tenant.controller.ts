import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TenantService } from '../services/tenant.service';
import { CreateTenantRequestDto, CreateTenantResponseDto, GetCompanyInfoRequestDto, GetCompanyInfoResponseDto } from '../dto/grpc.dto';

@Controller()
export class TenantController {
  private readonly logger = new Logger(TenantController.name);

  constructor(private readonly tenantService: TenantService) {}

  /**
   * gRPC handler: Create tenant (called from auth-service during P1UC01 registration)
   */
  @GrpcMethod('TenantService', 'CreateTenant')
  async createTenant(data: CreateTenantRequestDto): Promise<CreateTenantResponseDto> {
    this.logger.log(`Received CreateTenant gRPC request [${data.correlationId}]`);
    return await this.tenantService.createTenant(data);
  }

  /**
   * gRPC handler: Get company info (called from api-gateway during P3UC01 dashboard)
   */
  @GrpcMethod('TenantService', 'GetCompanyInfo')
  async getCompanyInfo(data: GetCompanyInfoRequestDto): Promise<GetCompanyInfoResponseDto> {
    this.logger.log(`Received GetCompanyInfo gRPC request [${data.correlationId}]`);
    return await this.tenantService.getCompanyInfo(data);
  }
}
