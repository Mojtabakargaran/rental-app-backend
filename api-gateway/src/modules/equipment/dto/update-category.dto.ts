import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateCategoryRequestDto {
  @ApiProperty({
    description: 'Category name (2-100 characters, letters, numbers, spaces, hyphens, underscores)',
    example: 'Heavy Equipment',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  @Matches(/^[\p{L}\p{N}\s\-_]+$/u, {
    message: 'Category name can only contain letters, numbers, spaces, hyphens, and underscores',
  })
  name: string;

  @ApiProperty({
    description: 'Category description (max 500 characters)',
    example: 'Large construction and industrial equipment',
    required: false,
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({
    description: 'UUID of parent category or null for top-level category',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({
    description: 'Active/inactive status',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
