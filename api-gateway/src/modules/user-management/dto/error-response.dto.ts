import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiProperty({ description: 'Field name', example: 'email' })
  field: string;

  @ApiProperty({ description: 'Error message (i18n key)', example: 'error.invalidEmail' })
  message: string;

  @ApiProperty({ description: 'Error code', example: 'INVALID_EMAIL_FORMAT' })
  code: string;
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Success status', example: false })
  success: boolean;

  @ApiProperty({ description: 'Error message (i18n key)', example: 'error.validationFailed' })
  error: string;

  @ApiProperty({ description: 'Error code', example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ description: 'Error details', type: [ErrorDetailDto], required: false })
  details?: ErrorDetailDto[];
}
