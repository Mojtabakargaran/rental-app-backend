import { ApiProperty } from '@nestjs/swagger';

class RoleInfo {
  @ApiProperty({ example: 'MANAGER' })
  code: string;

  @ApiProperty({ example: 'Manager' })
  name: string;
}

class UpdateUserRoleData {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ type: RoleInfo })
  oldRole: RoleInfo;

  @ApiProperty({ type: RoleInfo })
  newRole: RoleInfo;

  @ApiProperty({ example: '2025-12-06T10:30:00.000Z' })
  updatedAt: string;
}

export class UpdateUserRoleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'role.updated' })
  message: string;

  @ApiProperty({ type: UpdateUserRoleData })
  data: UpdateUserRoleData;
}
