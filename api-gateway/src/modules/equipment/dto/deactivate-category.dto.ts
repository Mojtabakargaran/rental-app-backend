import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class DeactivateCategoryRequestDto {
  @ApiProperty({
    description: 'Optional reason for deactivating the category',
    example: 'No longer needed for operations',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'error.reasonTooLong',
  })
  reason?: string;
}
