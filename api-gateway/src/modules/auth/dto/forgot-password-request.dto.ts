import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * DTO for requesting password reset
 */
export class ForgotPasswordRequestDto {
  @IsNotEmpty({ message: 'error.emailRequired' })
  @IsEmail({}, { message: 'error.invalidEmailFormat' })
  @MaxLength(255, { message: 'error.emailTooLong' })
  email: string;
}
