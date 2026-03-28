export interface Product {
    id: number;
    productCode: string;
    productName: string;
    productType: 'DOMESTIC' | 'INTERNATIONAL' | 'IMPORT' | 'LOCAL' | string;
    productService: string | null;
    fuelCharge: boolean;
    gstReverse: boolean;
    docType: 'DOX' | 'NDOX' | string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    groupType: 'AIR' | 'SURFACE' | 'TRAIN' | 'ALL' | string;
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
    productService?: string | null;
    fuelCharge: boolean;
    gstReverse: boolean;
    docType: string;
    status: string;
    groupType: string;
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
