import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for validating reset token
 */
export class ValidateResetTokenRequestDto {
  @IsNotEmpty({ message: 'error.tokenRequired' })
  @IsString({ message: 'error.invalidTokenFormat' })
  token: string;
}
