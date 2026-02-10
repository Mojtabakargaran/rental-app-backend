/**
 * DTO for reset password response
 */
export class ResetPasswordResponseDto {
  success: boolean;
  message: string;
  data?: {
    redirectUrl: string;
  };
  requestNewUrl?: string;
}
