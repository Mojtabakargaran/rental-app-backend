import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserProfileDataDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Updated full name',
    example: 'John Smith',
  })
  fullName: string;

  @ApiProperty({
    description: 'Updated email address',
    example: 'john.smith@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Updated phone number',
    example: '+989123456789',
    nullable: true,
  })
  phoneNumber: string | null;

  @ApiProperty({
    description: 'Array of field names that were modified',
    example: ['fullName', 'email'],
    type: [String],
  })
  changedFields: string[];

  @ApiProperty({
    description: 'Whether email address was changed',
    example: true,
  })
  emailChanged: boolean;

  @ApiProperty({
    description: 'Whether email verification is required',
    example: true,
    required: false,
  })
  emailVerificationRequired?: boolean;

  @ApiProperty({
    description: 'Timestamp of the update',
    example: '2025-12-08T12:00:00.000Z',
  })
  updatedAt: string;
}

export class UpdateUserProfileResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'user.profile.updated',
  })
  message: string;

  @ApiProperty({
    description: 'Updated user profile data',
    type: UpdateUserProfileDataDto,
  })
  data: UpdateUserProfileDataDto;
}
