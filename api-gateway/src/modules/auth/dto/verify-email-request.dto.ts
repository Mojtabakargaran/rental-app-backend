import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({
    description: 'Verification token from email link',
    example: '1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
