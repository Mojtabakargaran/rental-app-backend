export interface IUserServiceGrpc {
  getRoles(data: { correlationId: string }): any;
  createUserByOwner(data: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    roleCode: string;
    tenantId: string;
    createdBy: string;
    createdByLanguage: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): any;
  getUserProfile(data: { userId: string; correlationId: string }): any;
  listUsers(data: {
    tenantId: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
    roleCode?: string;
    correlationId: string;
  }): any;
  getUserDetails(data: { userId: string; tenantId: string; correlationId: string }): any;
  updateUserRole(data: {
    userId: string;
    newRoleCode: string;
    actorId: string;
    tenantId: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): any;
  updateUserProfile(data: {
    userId: string;
    tenantId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    actorId: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): any;
  deactivateUser(data: {
    userId: string;
    actorId: string;
    tenantId: string;
    reason?: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): any;
  reactivateUser(data: {
    userId: string;
    actorId: string;
    tenantId: string;
    ipAddress: string;
    userAgent: string;
    correlationId: string;
  }): any;
  getUserNames(data: { userIds: string[]; tenantId: string; correlationId: string }): any;
}

export interface IAuthServiceGrpc {
  validateSession(data: { token: string; correlationId: string }): any;
  invalidateUserSessions(data: {
    userId: string;
    reason: string;
    invalidatedBy: string;
    correlationId: string;
  }): any;
}

export interface ValidateSessionResponse {
  success: boolean;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  createdAt?: string;
  error?: string;
  code?: string;
}

export interface GetRolesResponse {
  success: boolean;
  roles?: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
  }>;
  error?: string;
  code?: string;
}

export interface CreateUserByOwnerResponse {
  success: boolean;
  userId?: string;
  email?: string;
  fullName?: string;
  error?: string;
  code?: string;
}

export interface GetUserProfileResponse {
  success: boolean;
  user?: {
    id: string;
    tenantId: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    languagePreference: string;
    isActive: boolean;
    role: {
      code: string;
      name: string;
    };
  };
  error?: string;
  code?: string;
}

export interface ListUsersResponse {
  success: boolean;
  users?: Array<{
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: {
      code: string;
      name: string;
    };
    isActive: boolean;
    emailVerifiedAt: string | null;
    createdAt: string;
  }>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
  code?: string;
}

export interface GetUserDetailsResponse {
  success: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    languagePreference: string;
    role: {
      code: string;
      name: string;
      description: string | null;
    };
    isActive: boolean;
    emailVerifiedAt: string | null;
    passwordChangedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
  code?: string;
}

export interface UpdateUserRoleResponse {
  success: boolean;
  userId?: string;
  fullName?: string;
  email?: string;
  oldRole?: {
    code: string;
    name: string;
  };
  newRole?: {
    code: string;
    name: string;
  };
  updatedAt?: string;
  error?: string;
  code?: string;
  retryAfter?: number;
}

export interface UpdateUserProfileResponse {
  success: boolean;
  userId?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string | null;
  languagePreference?: string;
  changedFields?: string[];
  oldValues?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string | null;
  };
  newValues?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string | null;
  };
  emailChanged?: boolean;
  updatedAt?: string;
  error?: string;
  code?: string;
}

export interface DeactivateUserResponse {
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

export interface ReactivateUserResponse {
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

export interface GetUserNamesResponse {
  success: boolean;
  data?: {
    users: Array<{
      id: string;
      fullName: string;
    }>;
  };
  error?: string;
  code?: string;
}
