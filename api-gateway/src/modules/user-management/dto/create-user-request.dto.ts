import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Smith',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'error.requiredField' })
  @MinLength(2, { message: 'error.invalidFullName' })
  @MaxLength(100, { message: 'error.invalidFullName' })
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.smith@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'error.invalidEmail' })
  @IsNotEmpty({ message: 'error.requiredField' })
  @MaxLength(255, { message: 'error.invalidEmail' })
  email: string;

  @ApiProperty({
    description: 'Phone number (optional)',
    example: '+989123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Role code to assign to the user',
    example: 'MANAGER',
    enum: ['MANAGER', 'STAFF', 'MAINTENANCE', 'READ_ONLY'],
  })
  @IsString()
  @IsNotEmpty({ message: 'error.requiredField' })
  roleCode: string;
}
