import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ErrorDetailDto {
  @ApiProperty({ description: 'Field name that failed validation' })
  field: string;

  @ApiProperty({ description: 'Error message (i18n key)' })
  message: string;

  @ApiProperty({ description: 'Error code' })
  code: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message (i18n key)',
    example: 'error.emailExists',
  })
  error: string;

  @ApiProperty({
    description: 'Error code',
    example: 'EMAIL_ALREADY_EXISTS',
  })
  code: string;

  @ApiPropertyOptional({
    description: 'Detailed error information (for validation errors)',
    type: [ErrorDetailDto],
  })
  details?: ErrorDetailDto[];

  @ApiPropertyOptional({
    description: 'Retry after (in seconds, for rate limit errors)',
    example: 3600,
  })
  retryAfter?: number;

  @ApiPropertyOptional({
    description: 'URL for resending verification (for verification errors)',
    example: '/resend-verification',
  })
  resendUrl?: string;
}
