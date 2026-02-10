import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordFirstLoginResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message key for i18n',
    example: 'passwordChange.firstLogin.success',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'User data returned after password change',
    required: false,
  })
  data?: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
  };
}
