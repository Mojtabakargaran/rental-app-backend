import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
  @ApiProperty({ description: 'Role ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Role code', example: 'MANAGER' })
  code: string;

  @ApiProperty({ description: 'Role name', example: 'Manager' })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Manages staff and operations',
    nullable: true,
  })
  description: string | null;
}

export class GetRolesDataDto {
  @ApiProperty({ description: 'List of available roles', type: [RoleDto] })
  roles: RoleDto[];
}

export class GetRolesResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'roles.retrieved' })
  message: string;

  @ApiProperty({ description: 'Roles data', type: GetRolesDataDto })
  data: GetRolesDataDto;
}
