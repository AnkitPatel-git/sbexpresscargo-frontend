import { apiFetch } from '@/lib/api-fetch';
import {
    ProductListResponse,
    ProductSingleResponse,
    ProductFormData,
    ProductUpdateData,
} from '@/types/masters/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const productService = {
    async getProducts(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        productCode?: string;
        productName?: string;
        productType?: string;
        status?: string;
    }): Promise<ProductListResponse> {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'productCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.productCode) queryParams.append('productCode', params.productCode);
        if (params?.productName) queryParams.append('productName', params.productName);
        if (params?.productType) queryParams.append('productType', params.productType);
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/product-master?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        return response.json();
    },

    async getProductById(id: number): Promise<ProductSingleResponse> {
        const response = await apiFetch(`${API_URL}/product-master/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch product');
        }

        return response.json();
    },

    async createProduct(data: ProductFormData): Promise<ProductSingleResponse> {
        const response = await apiFetch(`${API_URL}/product-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create product');
        }

        return response.json();
    },

    async updateProduct(id: number, data: ProductUpdateData): Promise<ProductSingleResponse> {
        const response = await apiFetch(`${API_URL}/product-master/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update product');
        }

        return response.json();
    },

    async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/product-master/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete product');
        }

        return response.json();
    },

    /** Bruno: `GET /product-master/export` — CSV; optional list-style query params. */
    async exportProducts(params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        productCode?: string;
        productName?: string;
        productType?: string;
        status?: string;
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams();
        if (params?.page !== undefined) queryParams.append('page', params.page.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        queryParams.append('search', params?.search ?? '');
        queryParams.append('sortBy', params?.sortBy ?? 'productCode');
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc');
        if (params?.productCode) queryParams.append('productCode', params.productCode);
        if (params?.productName) queryParams.append('productName', params.productName);
        if (params?.productType) queryParams.append('productType', params.productType);
        if (params?.status) queryParams.append('status', params.status);

        const response = await apiFetch(`${API_URL}/product-master/export?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to export products');
        }

        const cd = response.headers.get('content-disposition');
        let filename = 'products.csv';
        const match = cd?.match(/filename="?([^";\n]+)"?/i);
        if (match?.[1]) filename = match[1].trim();

        const blob = await response.blob();
        return { blob, filename };
    },
};
