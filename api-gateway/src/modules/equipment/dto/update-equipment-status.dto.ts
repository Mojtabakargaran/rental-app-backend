import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEquipmentStatusDto {
  @ApiProperty({
    description: 'New status for the equipment',
    enum: ['Available', 'Rented', 'Maintenance', 'Out of Service'],
    example: 'Maintenance',
  })
  @IsEnum(['Available', 'Rented', 'Maintenance', 'Out of Service'], {
    message: 'error.equipment.statusInvalid',
  })
  status: 'Available' | 'Rented' | 'Maintenance' | 'Out of Service';

  @ApiProperty({
    description: 'Optional reason for status change',
    required: false,
    example: 'Scheduled maintenance required',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'error.equipment.reasonInvalid' })
  @MaxLength(500, { message: 'error.equipment.reasonMaxLength' })
  reason?: string | null;
}
