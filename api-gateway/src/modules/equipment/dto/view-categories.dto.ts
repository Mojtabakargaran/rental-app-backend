import { IsNumber, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ViewCategoriesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    type: Number,
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: 'Case-insensitive search on category name',
    type: String,
    example: 'Heavy',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category status',
    enum: ['active', 'inactive', 'all'],
    default: 'all',
    example: 'all',
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'all'])
  status?: 'active' | 'inactive' | 'all' = 'all';

  @ApiPropertyOptional({
    description: 'Filter by hierarchy level',
    enum: ['top-level', 'sub-categories', 'all'],
    default: 'all',
    example: 'all',
  })
  @IsOptional()
  @IsEnum(['top-level', 'sub-categories', 'all'])
  hierarchyLevel?: 'top-level' | 'sub-categories' | 'all' = 'all';
}
