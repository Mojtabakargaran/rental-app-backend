import { IsOptional, IsInt, IsString, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListEquipmentQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'status', 'createdAt', 'purchaseDate'],
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['name', 'status', 'createdAt', 'purchaseDate'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (multi-select)',
    type: [String],
    enum: ['Available', 'Rented', 'Maintenance', 'Out of Service'],
    example: ['Available', 'Maintenance'],
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({
    description: 'Filter by category IDs (multi-select)',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  categoryId?: string[];

  @ApiPropertyOptional({
    description: 'Filter by manufacturer (partial match, case-insensitive)',
    example: 'Caterpillar',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({
    description:
      'Free text search across name, serial number, model, description (case-insensitive)',
    example: 'excavator',
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({
    description: 'Filter by purchase date range start (ISO 8601 date)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  purchaseDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by purchase date range end (ISO 8601 date)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  purchaseDateTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range start (ISO 8601 date)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  createdDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date range end (ISO 8601 date)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  createdDateTo?: string;
}
