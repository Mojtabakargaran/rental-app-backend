import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDetailDto {
  @ApiProperty({ description: 'Role code', example: 'MANAGER' })
  code: string;

  @ApiProperty({ description: 'Role name', example: 'Manager' })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Can manage staff and operations',
    nullable: true,
  })
  description: string | null;
}

export class UserDetailsDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  fullName: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ description: 'Language preference', example: 'en', enum: ['en', 'fa'] })
  languagePreference: string;

  @ApiProperty({ description: 'User role with description', type: UserRoleDetailDto })
  role: UserRoleDetailDto;

  @ApiProperty({ description: 'Account active status', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Email verification timestamp',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  emailVerifiedAt: string | null;

  @ApiProperty({
    description: 'Password last changed timestamp',
    example: '2024-01-20T14:45:00.000Z',
    nullable: true,
  })
  passwordChangedAt: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T08:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Account last update timestamp',
    example: '2024-01-25T16:20:00.000Z',
  })
  updatedAt: string;
}

export class GetUserDetailsResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message (i18n key)', example: 'user.details.retrieved' })
  message: string;

  @ApiProperty({
    description: 'User details',
    type: 'object',
    properties: {
      user: { type: 'object' },
    },
  })
  data: {
    user: UserDetailsDto;
  };
}
