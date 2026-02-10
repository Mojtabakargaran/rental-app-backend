import { ApiProperty } from '@nestjs/swagger';

class UserDataDto {
  @ApiProperty({ example: 'c89f4f73-2f4e-4b5b-9f4e-3e9f4f732f4e' })
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-12-08T10:35:00.000Z' })
  reactivatedAt: string;
}

export class ReactivateUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'user.reactivate.success' })
  message: string;

  @ApiProperty({ type: UserDataDto })
  data: UserDataDto;
}
