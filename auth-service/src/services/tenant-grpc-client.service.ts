import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import {
  CreateTenantRequestDto,
  CreateTenantSuccessResponseDto,
  CreateTenantErrorResponseDto,
} from '../dto/grpc.dto';

// gRPC client for tenant-service communication
@Injectable()
export class TenantGrpcClientService implements OnModuleInit {
  private tenantServiceClient: any;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const packageDefinition = protoLoader.loadSync(
      join(__dirname, '..', '..', 'proto', 'tenant.proto'),
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    );

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const tenantServiceUrl = this.configService.get<string>('grpcServices.tenantService');

    this.tenantServiceClient = new protoDescriptor.tenant.TenantService(
      tenantServiceUrl,
      grpc.credentials.createInsecure(),
    );
  }

  async createTenant(
    request: CreateTenantRequestDto,
  ): Promise<CreateTenantSuccessResponseDto | CreateTenantErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.tenantServiceClient.CreateTenant(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}
