import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'error.sessionExpired' })
  error: string;

  @ApiProperty({
    example: 'SESSION_EXPIRED',
    enum: [
      'SESSION_EXPIRED',
      'UNAUTHORIZED',
      'ACCOUNT_INACTIVE',
      'USER_NOT_FOUND',
      'COMPANY_NOT_FOUND',
      'SERVICE_UNAVAILABLE',
      'DASHBOARD_LOAD_FAILED',
    ],
  })
  code: string;
}
