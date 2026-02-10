import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

/**
 * DTO for resetting password
 */
export class ResetPasswordRequestDto {
  @IsNotEmpty({ message: 'error.tokenRequired' })
  @IsString({ message: 'error.invalidTokenFormat' })
  token: string;

  @IsNotEmpty({ message: 'error.passwordRequired' })
  @MinLength(8, { message: 'error.passwordTooShort' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'error.weakPassword',
  })
  newPassword: string;

  @IsNotEmpty({ message: 'error.confirmPasswordRequired' })
  @IsString()
  confirmPassword: string;
}
