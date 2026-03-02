export interface Permission {
    id: number;
    name: string;
    identifier: string;
    underMenu: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface PermissionAction {
    id: number;
    identifier: string;
    name: string;
    granted?: boolean;
}

export interface PermissionResource {
    resource: string;
    resourceKey: string;
    actions: PermissionAction[];
}

export interface GroupedPermission {
    underMenu: string;
    resources: PermissionResource[];
}

export interface CreatePermissionDto {
    name: string;
    underMenu: string;
    description: string;
}

export interface UpdatePermissionDto {
    name?: string;
    underMenu?: string;
    description?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
