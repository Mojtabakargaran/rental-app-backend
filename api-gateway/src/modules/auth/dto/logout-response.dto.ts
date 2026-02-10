import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message key for i18n',
    example: 'logout.success',
  })
  message: string;

  @ApiProperty({
    description: 'Warning message if backend cleanup failed',
    example: 'logout.cleanupFailed',
    required: false,
  })
  warning?: string;

  @ApiProperty({
    description: 'Warning code',
    example: 'LOGOUT_CLEANUP_FAILED',
    required: false,
  })
  code?: string;
}
