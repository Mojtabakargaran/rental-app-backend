import { IsEmail, IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

// CheckEmailExists DTOs
export class CheckEmailExistsRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class CheckEmailExistsResponseDto {
  success: boolean;
  exists?: boolean;
  error?: string;
  code?: string;
}

// CreateUser DTOs
export class CreateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  passwordHash: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  languagePreference: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class CreateUserResponseDto {
  success: boolean;
  userId?: string;
  email?: string;
  fullName?: string;
  error?: string;
  code?: string;
}

// AssignRole DTOs
export class AssignRoleRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class AssignRoleResponseDto {
  success: boolean;
  userId?: string;
  roleCode?: string;
  error?: string;
  code?: string;
}

// FindByEmail DTOs
export class FindByEmailRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class UserDataDto {
  userId: string;
  email: string;
  isActive: boolean;
  languagePreference: string;
  fullName: string;
  tenantId: string;
  passwordHash?: string;
  emailVerifiedAt?: string | null;
  passwordChangedAt?: string | null;
  deactivatedAt?: string | null;
}

export class FindByEmailResponseDto {
  success: boolean;
  user?: UserDataDto | null;
  error?: string;
  code?: string;
}

// FindById DTOs
export class FindByIdRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class FindByIdResponseDto {
  success: boolean;
  user?: UserDataDto | null;
  error?: string;
  code?: string;
}

// ActivateUser DTOs
export class ActivateUserRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  emailVerifiedAt: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class ActivateUserResponseDto {
  success: boolean;
  userId?: string;
  email?: string;
  isActive?: boolean;
  emailVerifiedAt?: string;
  error?: string;
  code?: string;
}

// UpdatePassword DTOs (P2UC02)
export class UpdatePasswordRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  newPasswordHash: string;

  @IsString()
  @IsNotEmpty()
  passwordChangedAt: string; // ISO 8601 UTC

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class UpdatePasswordResponseDto {
  success: boolean;
  userId?: string;
  passwordChangedAt?: string;
  error?: string;
  code?: string;
}

// GetUserProfile DTOs (P3UC01)
export class GetUserProfileRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class UserRoleDto {
  code: string;
  name: string;
}

export class UserProfileDto {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  languagePreference: string;
  isActive: boolean;
  role: UserRoleDto;
}

export class GetUserProfileResponseDto {
  success: boolean;
  user?: UserProfileDto;
  error?: string;
  code?: string;
}

// GetOwnerByTenant DTOs (P3UC01)
export class GetOwnerByTenantRequestDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class GetOwnerByTenantResponseDto {
  success: boolean;
  user?: UserProfileDto;
  error?: string;
  code?: string;
}

// UpdateLanguagePreference DTOs (P3UC02)
export class UpdateLanguagePreferenceRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  languagePreference: 'en' | 'fa';

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class UpdatedUserDto {
  userId: string;
  languagePreference: 'en' | 'fa';
  updatedAt: string;
}

export class UpdateLanguagePreferenceResponseDto {
  success: boolean;
  user?: UpdatedUserDto;
  error?: string;
  code?: string;
}

// GetRoles DTOs (P4UC01)
export class GetRolesRequestDto {
  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class RoleDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export class GetRolesResponseDto {
  success: boolean;
  roles?: RoleDto[];
  error?: string;
  code?: string;
}

// CreateUserByOwner DTOs (P4UC01)
export class CreateUserByOwnerRequestDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  createdByLanguage: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class CreateUserByOwnerResponseDto {
  success: boolean;
  userId?: string;
  email?: string;
  fullName?: string;
  error?: string;
  code?: string;
}

// ListUsers DTOs (P4UC02)
export class ListUsersRequestDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  limit: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  roleCode?: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class ListedUserDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRoleDto;
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export class PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ListUsersResponseDto {
  success: boolean;
  users?: ListedUserDto[];
  pagination?: PaginationDto;
  error?: string;
  code?: string;
}

// GetUserDetails DTOs (P4UC02)
export class GetUserDetailsRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class UserRoleDetailDto {
  code: string;
  name: string;
  description: string | null;
}

export class UserDetailsDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  languagePreference: string;
  role: UserRoleDetailDto;
  isActive: boolean;
  emailVerifiedAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class GetUserDetailsResponseDto {
  success: boolean;
  user?: UserDetailsDto;
  error?: string;
  code?: string;
}

// UpdateUserRole DTOs (P4UC03)
export class UpdateUserRoleRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  newRoleCode: string;

  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class RoleInfoDto {
  code: string;
  name: string;
}

export class UpdateUserRoleResponseDto {
  success: boolean;
  userId?: string;
  fullName?: string;
  email?: string;
  oldRole?: RoleInfoDto;
  newRole?: RoleInfoDto;
  updatedAt?: string;
  error?: string;
  code?: string;
}

// UpdateUserProfile DTOs (P4UC04)
export class UpdateUserProfileRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class OldNewValuesDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string | null;
}

export class UpdateUserProfileResponseDto {
  success: boolean;
  userId?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string | null;
  languagePreference?: string;
  changedFields?: string[];
  oldValues?: OldNewValuesDto;
  newValues?: OldNewValuesDto;
  emailChanged?: boolean;
  updatedAt?: string;
  error?: string;
  code?: string;
}

// DeactivateUser DTOs
export class DeactivateUserRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class DeactivateUserResponseDto {
  success: boolean;
  userId?: string;
  fullName?: string;
  email?: string;
  languagePreference?: string;
  isActive?: boolean;
  deactivatedAt?: string;
  deactivatedBy?: string;
  reason?: string;
  error?: string;
  code?: string;
}

// ReactivateUser DTOs
export class ReactivateUserRequestDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class ReactivateUserResponseDto {
  success: boolean;
  userId?: string;
  fullName?: string;
  email?: string;
  languagePreference?: string;
  isActive?: boolean;
  reactivatedAt?: string;
  reactivatedBy?: string;
  error?: string;
  code?: string;
}

// GetUserNames DTOs
export class GetUserNamesRequestDto {
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  userIds: string[];

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  correlationId: string;
}

export class UserNameItemDto {
  id: string;
  fullName: string;
}

export class GetUserNamesResponseDto {
  success: boolean;
  users?: UserNameItemDto[];
  error?: string;
  code?: string;
}
