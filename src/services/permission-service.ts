import { apiClient } from '@/lib/api-client';
import {
    Permission,
    GroupedPermission,
    CreatePermissionDto,
    UpdatePermissionDto,
    ApiResponse,
    PaginatedResponse
} from '@/types/permission';

const PERMISSIONS = '/utilities/permissions';

export const permissionService = {
    // Get all permissions (paginated)
    getPermissions: (params: { page?: number; limit?: number; sortBy?: string; sortOrder?: string; search?: string } = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.sortBy) query.append('sortBy', params.sortBy);
        if (params.sortOrder) query.append('sortOrder', params.sortOrder);
        if (params.search) query.append('search', params.search);

        return apiClient<PaginatedResponse<Permission>>(`${PERMISSIONS}?${query.toString()}`);
    },

    // Get permissions grouped by menu and resource
    getGroupedPermissions: () => {
        return apiClient<ApiResponse<GroupedPermission[]>>(`${PERMISSIONS}/grouped`);
    },

    // Get grouped permissions for a specific role
    getPermissionsForRole: (roleId: number) => {
        return apiClient<ApiResponse<GroupedPermission[]>>(`${PERMISSIONS}/for-role/${roleId}`);
    },

    // Get specific permission by ID
    getPermissionById: (id: number | string) => {
        return apiClient<ApiResponse<Permission>>(`${PERMISSIONS}/${id}`);
    },

    // Create a new permission
    createPermission: (data: CreatePermissionDto) => {
        return apiClient<ApiResponse<Permission>>(PERMISSIONS, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update an existing permission
    updatePermission: (id: number | string, data: UpdatePermissionDto) => {
        return apiClient<ApiResponse<Permission>>(`${PERMISSIONS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Soft-delete a permission
    deletePermission: (id: number | string) => {
        return apiClient<ApiResponse<{ id: number; deletedAt: string }>>(`${PERMISSIONS}/${id}`, {
            method: 'DELETE',
        });
    },

    // Assign permission to role
    assignPermissionToRole: (roleId: number, permissionId: number) => {
        return apiClient<ApiResponse<any>>(`${PERMISSIONS}/assign`, {
            method: 'POST',
            body: JSON.stringify({ roleId, permissionId }),
        });
    },

    // Remove permission from role
    removePermissionFromRole: (roleId: number, permissionId: number) => {
        return apiClient<ApiResponse<any>>(`${PERMISSIONS}/remove`, {
            method: 'DELETE',
            body: JSON.stringify({ roleId, permissionId }),
        });
    }
};
