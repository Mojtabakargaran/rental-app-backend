import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message (i18n key)',
    example: 'register.success',
  })
  message: string;

  @ApiProperty({
    description: 'User data',
    type: 'object',
  })
  data: {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
  };
}
