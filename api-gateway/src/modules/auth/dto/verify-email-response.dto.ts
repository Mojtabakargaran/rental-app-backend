import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Internationalization message key',
    example: 'verifyEmail.success',
  })
  message: string;

  @ApiProperty({
    description: 'URL to redirect user after verification',
    example: '/login',
  })
  redirectUrl: string;

  @ApiProperty({
    description: 'Indicates if account was already activated',
    required: false,
    example: false,
  })
  alreadyActivated?: boolean;
}
