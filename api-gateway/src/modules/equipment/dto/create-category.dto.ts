import {
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryRequestDto {
  @ApiProperty({
    description: 'Category name',
    minLength: 2,
    maxLength: 100,
    example: 'Heavy Equipment',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\p{L}\p{N}\s\-_]+$/u, {
    message: 'Category name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    maxLength: 500,
    example: 'Large construction and industrial equipment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical classification',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @ApiProperty({
    description: 'Category status',
    type: Boolean,
    default: true,
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
