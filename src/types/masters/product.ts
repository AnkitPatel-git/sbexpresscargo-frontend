/** Product Master — Bruno `docs/bruno/Masters/Product Master/*`. */

export interface Product {
    id: number;
    productCode: string;
    productName: string;
    version: number;
    productType: 'DOMESTIC' | 'INTERNATIONAL' | 'LOCAL' | string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ProductFormData {
    productCode?: string;
    productName: string;
    productType: string;
    status: string;
    /** Required on update; omit on create. */
    version?: number;
}

export type ProductUpdateData = Partial<Omit<ProductFormData, 'version'>> & {
    version: number;
}

export interface ProductListResponse {
    success: boolean;
    message?: string;
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ProductSingleResponse {
    success: boolean;
    message?: string;
    data: Product;
}
