import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class DeleteEquipmentQueryDto {
  @ApiProperty({
    description: 'Type of deletion: soft (archive) or permanent',
    enum: ['soft', 'permanent'],
    example: 'soft',
  })
  @IsEnum(['soft', 'permanent'], {
    message: 'error.equipment.deleteTypeInvalid',
  })
  type: 'soft' | 'permanent';
}

export class SoftDeleteEquipmentDto {
  @ApiProperty({
    description: 'Optional reason for archiving equipment',
    required: false,
    example: 'Equipment no longer in use',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'error.equipment.reasonInvalid' })
  @MaxLength(500, { message: 'error.equipment.reasonMaxLength' })
  reason?: string | null;
}

export class PermanentDeleteEquipmentDto {
  @ApiProperty({
    description: 'Confirmation string - must be exactly "DELETE"',
    example: 'DELETE',
  })
  @IsString({ message: 'error.equipment.confirmationRequired' })
  @ValidateIf((o) => o.confirmation !== 'DELETE')
  confirmation: string;
}
