import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDataDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ description: 'Email address', example: 'john.smith@example.com' })
  email: string;

  @ApiProperty({ description: 'Full name', example: 'John Smith' })
  fullName: string;
}

export class CreateUserResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'user.created' })
  message: string;

  @ApiProperty({ description: 'Created user data', type: CreateUserDataDto })
  data: CreateUserDataDto;
}
