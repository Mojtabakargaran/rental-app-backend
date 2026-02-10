import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ResendVerificationRequestDto {
  @IsEmail({}, { message: 'error.invalidEmail' })
  @IsNotEmpty({ message: 'error.requiredField' })
  @MaxLength(255, { message: 'error.emailTooLong' })
  email: string;
}
