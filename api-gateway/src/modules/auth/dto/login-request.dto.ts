import { IsEmail, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address',
    example: 'owner@company.com',
  })
  @IsEmail({}, { message: 'error.invalidEmail' })
  @IsNotEmpty({ message: 'error.requiredField' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'error.requiredField' })
  password: string;

  @ApiProperty({
    description: 'Remember me option for extended session',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'error.validationError' })
  rememberMe?: boolean;
}
