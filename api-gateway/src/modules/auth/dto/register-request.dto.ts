import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'error.fullNameTooShort' })
  @MaxLength(100, { message: 'error.fullNameTooLong' })
  fullName: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'error.companyNameTooShort' })
  @MaxLength(100, { message: 'error.companyNameTooLong' })
  companyName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'error.invalidEmail' })
  @MaxLength(255, { message: 'error.emailTooLong' })
  email: string;

  @ApiProperty({
    description:
      'Password (minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'error.weakPassword' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'error.weakPassword',
  })
  password: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'SecurePass123!',
  })
  @IsString()
  passwordConfirmation: string;

  @ApiPropertyOptional({
    description: 'Phone number (optional, international format)',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Language preference',
    example: 'en',
    enum: ['en', 'fa'],
  })
  @IsString()
  @Matches(/^(en|fa)$/, { message: 'error.invalidLanguage' })
  languagePreference: string;
}
