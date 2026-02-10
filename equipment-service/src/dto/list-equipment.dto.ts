import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class FiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryId?: string[];

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  purchaseDateFrom?: string;

  @IsOptional()
  @IsString()
  purchaseDateTo?: string;

  @IsOptional()
  @IsString()
  createdDateFrom?: string;

  @IsOptional()
  @IsString()
  createdDateTo?: string;
}

export class ListEquipmentRequestDto {
  @IsString()
  tenantId: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(['name', 'status', 'createdAt', 'purchaseDate'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltersDto)
  filters?: FiltersDto;
}
