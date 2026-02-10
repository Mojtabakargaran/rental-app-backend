import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomAttributeDto {
  @ApiProperty({ description: 'Attribute key', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({ description: 'Attribute value', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  value: string;

  @ApiPropertyOptional({ description: 'Measurement unit', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;
}

export class UpdateEquipmentRequestDto {
  @ApiProperty({ description: 'Equipment name', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Category ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Equipment description', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Model name', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'Serial number (unique within tenant)', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Year of manufacture (1900 to current year)',
    minimum: 1900,
    maximum: new Date().getFullYear(),
  })
  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(new Date().getFullYear())
  yearOfManufacture?: number;

  @ApiPropertyOptional({ description: 'Purchase price (non-negative)', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Purchase date (ISO 8601 format, cannot be in future)' })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({
    description: 'Equipment status',
    enum: ['Available', 'Rented', 'Maintenance', 'Out of Service'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Available', 'Rented', 'Maintenance', 'Out of Service'])
  status: string;

  @ApiPropertyOptional({
    description: 'Custom attributes (flexible key-value pairs with optional units)',
    type: [CustomAttributeDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomAttributeDto)
  customAttributes?: CustomAttributeDto[];
}
