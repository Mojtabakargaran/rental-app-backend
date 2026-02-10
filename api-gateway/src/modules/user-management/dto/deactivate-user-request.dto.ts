import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeactivateUserRequestDto {
  @ApiPropertyOptional({
    description: 'Optional reason for deactivation',
    example: 'Employee left the company',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'error.reasonTooLong',
  })
  reason?: string;
}
