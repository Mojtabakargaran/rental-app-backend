import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserProfileRequestDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Smith',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.smith@example.com',
    maxLength: 255,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Phone number of the user (international format)',
    example: '+989123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
