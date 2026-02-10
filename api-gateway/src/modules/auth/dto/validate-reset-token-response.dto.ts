/**
 * DTO for validate reset token response
 */
export class ValidateResetTokenResponseDto {
  success: boolean;
  message: string;
  data?: {
    valid: boolean;
  };
  requestNewUrl?: string;
}
