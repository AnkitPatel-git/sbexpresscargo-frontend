export interface Product {
    id: number;
    productCode: string;
    productName: string;
    productType: 'domestic' | 'international' | string;
    productService: string | null;
    fuelCharge: boolean;
    gstReverse: boolean;
    docType: 'DOX' | 'NON-DOX' | string;
    status: 'ACTIVE' | 'INACTIVE' | string;
    groupType: 'air' | 'surface' | 'sea' | string;
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
    message: string;
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ProductSingleResponse {
    success: boolean;
    message: string;
    data: Product;
}
