export interface Product {
    id: number;
    productCode: string;
    productName: string;
    productType: 'DOMESTIC' | 'INTERNATIONAL' | 'LOCAL' | string;
    fuelCharge: boolean;
    gstReverse: boolean;
    docType: 'DOX' | 'NDOX' | string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
}

export interface ProductFormData {
    productCode: string;
    productName: string;
    productType: string;
    fuelCharge: boolean;
    gstReverse: boolean;
    docType: string;
    status: string;
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
    message: string;
    data: Product;
}
