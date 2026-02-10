import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto {
  @ApiProperty({ description: 'Role code', example: 'COMPANY_OWNER' })
  code: string;

  @ApiProperty({ description: 'Role name', example: 'Company Owner' })
  name: string;
}

export class UserListItemDto {
  @ApiProperty({ description: 'User ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  fullName: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ description: 'User role', type: UserRoleDto })
  role: UserRoleDto;

  @ApiProperty({ description: 'Account status', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Email verification timestamp',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  emailVerifiedAt: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T08:00:00.000Z',
  })
  createdAt: string;
}

export class PaginationDto {
  @ApiProperty({ description: 'Total users matching filters', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 50 })
  limit: number;

  @ApiProperty({ description: 'Total pages available', example: 3 })
  totalPages: number;

  @ApiProperty({ description: 'Whether next page exists', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether previous page exists', example: false })
  hasPrev: boolean;
}

export class ListUsersResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message (i18n key)', example: 'users.retrieved' })
  message: string;

  @ApiProperty({
    description: 'Response data',
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: { type: 'object' },
      },
      pagination: { type: 'object' },
    },
  })
  data: {
    users: UserListItemDto[];
    pagination: PaginationDto;
  };
}
