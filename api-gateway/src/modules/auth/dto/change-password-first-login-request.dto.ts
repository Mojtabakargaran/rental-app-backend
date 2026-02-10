import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordFirstLoginRequestDto {
  @ApiProperty({
    description: 'New password',
    example: 'NewSecure123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'error.requiredField' })
  @MinLength(8, { message: 'error.passwordTooShort' })
  @MaxLength(128, { message: 'error.validationError' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'error.weakPassword',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation password (must match newPassword)',
    example: 'NewSecure123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'error.requiredField' })
  confirmPassword: string;
}
