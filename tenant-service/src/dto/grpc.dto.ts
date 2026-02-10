// gRPC DTOs for tenant service

// P1UC01: Create Tenant
export class CreateTenantRequestDto {
  companyName: string;
  correlationId: string;
}

export class CreateTenantResponseDto {
  success: boolean;
  tenantId?: string;
  companyName?: string;
  error?: string;
  code?: string;
}

// P3UC01: Get Company Info
export class GetCompanyInfoRequestDto {
  tenantId: string;
  correlationId: string;
}

export class CompanyInfoDto {
  id: string;
  companyName: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhoneNumber: string | null;
  registrationDate: string;
}

export class GetCompanyInfoResponseDto {
  success: boolean;
  company?: CompanyInfoDto;
  error?: string;
  code?: string;
}
