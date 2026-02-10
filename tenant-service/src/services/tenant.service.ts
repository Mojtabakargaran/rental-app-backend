import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Tenant } from '../entities/tenant.entity';
import { CreateTenantRequestDto, CreateTenantResponseDto, GetCompanyInfoRequestDto, GetCompanyInfoResponseDto } from '../dto/grpc.dto';
import { EventPublisherService } from '../events/event-publisher.service';

interface UserServiceGrpc {
  getOwnerByTenant(data: { tenantId: string; correlationId: string }): any;
}

@Injectable()
export class TenantService implements OnModuleInit {
  private readonly logger = new Logger(TenantService.name);
  private userService: UserServiceGrpc;

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly eventPublisher: EventPublisherService,
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.userServiceClient.getService<UserServiceGrpc>('UserService');
  }

  /**
   * Create a new tenant (company) for P1UC01 registration use case
   */
  async createTenant(dto: CreateTenantRequestDto): Promise<CreateTenantResponseDto> {
    try {
      this.logger.log(`Creating tenant with company name: ${dto.companyName} [${dto.correlationId}]`);

      // Create tenant entity
      const tenant = this.tenantRepository.create({
        companyName: dto.companyName,
        isActive: true,
      });

      // Save to database
      const savedTenant = await this.tenantRepository.save(tenant);

      this.logger.log(`Tenant created successfully with ID: ${savedTenant.id} [${dto.correlationId}]`);

      // Publish TenantCreated event
      await this.eventPublisher.publishTenantCreated({
        tenantId: savedTenant.id,
        companyName: savedTenant.companyName,
        createdAt: savedTenant.createdAt.toISOString(),
        correlationId: dto.correlationId,
      });

      return {
        success: true,
        tenantId: savedTenant.id,
        companyName: savedTenant.companyName,
      };
    } catch (error) {
      this.logger.error(`Failed to create tenant: ${error.message} [${dto.correlationId}]`, error.stack);
      
      return {
        success: false,
        error: 'Failed to create tenant',
        code: 'TENANT_CREATION_FAILED',
      };
    }
  }

  /**
   * Health check - verify database connectivity
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.tenantRepository.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      return false;
    }
  }

  /**
   * Get company information with owner details (P3UC01)
   */
  async getCompanyInfo(dto: GetCompanyInfoRequestDto): Promise<GetCompanyInfoResponseDto> {
    try {
      this.logger.log(`Fetching company info for tenant: ${dto.tenantId} [${dto.correlationId}]`);

      // Get tenant information
      const tenant = await this.tenantRepository.findOne({
        where: { id: dto.tenantId },
      });

      if (!tenant) {
        this.logger.warn(`Tenant not found: ${dto.tenantId} [${dto.correlationId}]`);
        return {
          success: false,
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND',
        };
      }

      // Check if company is inactive
      if (!tenant.isActive) {
        this.logger.warn(`Tenant is inactive: ${dto.tenantId} [${dto.correlationId}]`);
        return {
          success: false,
          error: 'Company is inactive',
          code: 'COMPANY_INACTIVE',
        };
      }

      // Get owner information from user-service
      const ownerResponse: any = await firstValueFrom(
        this.userService.getOwnerByTenant({
          tenantId: dto.tenantId,
          correlationId: dto.correlationId,
        }),
      );

      if (!ownerResponse.success) {
        this.logger.warn(`Owner user not found for tenant: ${dto.tenantId} [${dto.correlationId}]`);
        return {
          success: false,
          error: 'Company owner information not found',
          code: 'COMPANY_NOT_FOUND',
        };
      }

      const owner = ownerResponse.user;

      return {
        success: true,
        company: {
          id: tenant.id,
          companyName: tenant.companyName,
          ownerFullName: owner.fullName,
          ownerEmail: owner.email,
          ownerPhoneNumber: owner.phoneNumber || null,
          registrationDate: tenant.createdAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch company info: ${error.message} [${dto.correlationId}]`, error.stack);
      
      return {
        success: false,
        error: 'Failed to fetch company information',
        code: 'COMPANY_FETCH_FAILED',
      };
    }
  }
}
