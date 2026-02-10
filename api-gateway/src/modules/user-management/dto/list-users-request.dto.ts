import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, MinLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersRequestDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'error.invalidPage' })
  @Min(1, { message: 'error.invalidPage' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'error.invalidLimit' })
  @Min(1, { message: 'error.invalidLimit' })
  @Max(100, { message: 'error.invalidLimit' })
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Search query for full name or email (min 2 characters)',
    example: 'john',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'error.searchTooShort' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    example: 'all',
    enum: ['active', 'inactive', 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'all'], { message: 'error.invalidStatus' })
  status?: 'active' | 'inactive' | 'all' = 'all';

  @ApiPropertyOptional({
    description: 'Filter by role code',
    example: 'MANAGER',
  })
  @IsOptional()
  @IsString()
  roleCode?: string;
}
