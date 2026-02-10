import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsArray, ValidateNested, IsDateString, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCategoriesRequestDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsBoolean()
  @IsNotEmpty()
  activeOnly: boolean;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class CreateCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class UpdateCategoryRequestDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsUUID()
  @IsOptional()
  parentId?: string | null;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;

  @IsArray()
  @IsOptional()
  clearedFields?: string[];
}

export class DeactivateCategoryRequestDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class ReactivateCategoryRequestDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class DeleteCategoryRequestDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}

export class CustomAttributeDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  unit?: string | null;
}

export class CreateEquipmentRequestDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  manufacturer?: string | null;

  @IsString()
  @IsOptional()
  model?: string | null;

  @IsString()
  @IsOptional()
  serialNumber?: string | null;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear())
  yearOfManufacture?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  purchasePrice?: number | null;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string | null;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Available', 'Rented', 'Maintenance', 'Out of Service'])
  status: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomAttributeDto)
  @IsOptional()
  customAttributes?: CustomAttributeDto[] | null;

  @IsUUID()
  @IsNotEmpty()
  correlationId: string;
}
