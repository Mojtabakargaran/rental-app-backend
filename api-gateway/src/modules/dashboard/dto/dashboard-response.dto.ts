import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto {
  @ApiProperty({ example: 'COMPANY_OWNER' })
  code: string;

  @ApiProperty({ example: 'Company Owner' })
  name: string;
}

export class UserDataDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: 'en', enum: ['en', 'fa'] })
  languagePreference: string;

  @ApiProperty({ type: UserRoleDto })
  role: UserRoleDto;

  @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
  lastLoginAt: string;
}

export class CompanyDataDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'ABC Equipment Rentals' })
  companyName: string;

  @ApiProperty({ example: 'John Doe' })
  ownerFullName: string;

  @ApiProperty({ example: 'john@example.com' })
  ownerEmail: string;

  @ApiProperty({ example: '+1234567890', nullable: true })
  ownerPhoneNumber: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  registrationDate: string;
}

export class DashboardDataDto {
  @ApiProperty({ type: UserDataDto })
  user: UserDataDto;

  @ApiProperty({ type: CompanyDataDto })
  company: CompanyDataDto;
}

export class DashboardResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'dashboard.loaded' })
  message: string;

  @ApiProperty({ type: DashboardDataDto })
  data: DashboardDataDto;
}
