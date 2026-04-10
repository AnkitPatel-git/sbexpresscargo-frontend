export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserRole {
  id: number;
  name: string;
  identifier: string;
  description?: string | null;
}

export interface UserProfile {
  id?: number;
  userGroup?: string | null;
  userType?: string | null;
  origin?: string | null;
  serviceCenterId?: number | null;
  customerId?: number | null;
  groupName?: string | null;
  birthDate?: string | null;
  joiningDate?: string | null;
  applicationType?: string | null;
  allowChangingDate?: boolean;
  addEntryOnManifest?: boolean;
  globalManifest?: boolean;
  allowChangingAwbNo?: boolean;
  mobileAppLens?: boolean;
  manifestBranch?: boolean;
  weightType?: string | null;
  userId?: number;
}

export interface UtilityUser {
  id: number;
  username: string;
  email: string;
  roleId: number;
  mobile?: string | null;
  status: UserStatus;
  role?: UserRole | null;
  profile?: UserProfile | null;
  customerId?: number | null;
  serviceCenterId?: number | null;
  jti?: string;
  platform?: string;
  permissions?: string[];
}

export interface SessionRecord {
  id: number;
  userName: string;
  loginDate: string;
  loginTime: string;
  userType: string | null;
  ipAddress: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: UtilityUser & {
    role: UserRole;
    permissions: string[];
  };
}

export interface UpdateSelfProfilePayload {
  email?: string;
  username?: string;
  mobile?: string;
  profile?: {
    userGroup?: string;
    origin?: string;
    groupName?: string;
    birthDate?: string;
  };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  username?: string;
  email?: string;
  mobile?: string;
  status?: UserStatus;
  roleId?: number;
}
