import { apiClient } from '@/lib/api-client';
import {
    Permission,
    GroupedPermission,
    CreatePermissionDto,
    UpdatePermissionDto,
    ApiResponse,
    PaginatedResponse
} from '@/types/permission';

export const permissionService = {
    // Get all permissions (paginated)
    getPermissions: (params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; search?: string } = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.search) query.append('search', params.search);

        return apiClient<PaginatedResponse<Permission>>(`/permissions?${query.toString()}`);
    },

    // Get permissions grouped by menu and resource
    getGroupedPermissions: () => {
        return apiClient<ApiResponse<GroupedPermission[]>>('/permissions/grouped');
    },

    // Get grouped permissions for a specific role
    getPermissionsForRole: (roleId: number) => {
        return apiClient<ApiResponse<GroupedPermission[]>>(`/permissions/for-role/${roleId}`);
    },

    // Get specific permission by ID
    getPermissionById: (id: number | string) => {
        return apiClient<ApiResponse<Permission>>(`/permissions/${id}`);
    },

    // Create a new permission
    createPermission: (data: CreatePermissionDto) => {
        return apiClient<ApiResponse<Permission>>('/permissions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update an existing permission
    updatePermission: (id: number | string, data: UpdatePermissionDto) => {
        return apiClient<ApiResponse<Permission>>(`/permissions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Soft-delete a permission
    deletePermission: (id: number | string) => {
        return apiClient<ApiResponse<{ id: number; deletedAt: string }>>(`/permissions/${id}`, {
            method: 'DELETE',
        });
    },

    // Assign permission to role
    assignPermissionToRole: (roleId: number, permissionId: number) => {
        return apiClient<ApiResponse<any>>('/permissions/assign', {
            method: 'POST',
            body: JSON.stringify({ roleId, permissionId }),
        });
    },

    // Remove permission from role
    removePermissionFromRole: (roleId: number, permissionId: number) => {
        return apiClient<ApiResponse<any>>('/permissions/remove', {
            method: 'DELETE',
            body: JSON.stringify({ roleId, permissionId }),
        });
    }
};
