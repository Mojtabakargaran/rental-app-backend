import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message key for i18n',
    example: 'login.success',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'User data returned on successful login',
    required: false,
  })
  data?: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    languagePreference: string;
    requirePasswordChange?: boolean;
  };
}
