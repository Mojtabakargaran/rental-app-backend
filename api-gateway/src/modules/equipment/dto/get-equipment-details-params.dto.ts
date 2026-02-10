import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetEquipmentDetailsParamsDto {
  @ApiProperty({ description: 'Equipment ID (UUID)' })
  @IsUUID()
  equipmentId: string;
}
