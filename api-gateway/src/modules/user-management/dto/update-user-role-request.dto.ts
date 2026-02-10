import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleRequestDto {
  @ApiProperty({
    description: 'New role code for the user',
    example: 'MANAGER',
    enum: ['MANAGER', 'STAFF', 'MAINTENANCE', 'READ_ONLY'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['MANAGER', 'STAFF', 'MAINTENANCE', 'READ_ONLY'], {
    message: 'INVALID_ROLE_CODE',
  })
  roleCode: string;
}
