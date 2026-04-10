export type VehicleType =
    | 'TWO_WHEELER'
    | 'THREE_WHEELER'
    | 'PICKUP_TRUCK'
    | 'LCV'
    | 'HCV'
    | 'TRAILER'
    | 'CONTAINER'
    | 'TANKER'
    | 'OTHER';

export interface VehicleDriver {
    id: number;
    username: string;
    email: string;
}

export interface Vehicle {
    id: number;
    vehicleNo: string;
    vehicleType: VehicleType;
    ownerName: string | null;
    driverName: string | null;
    driverUserId: number | null;
    capacityKg: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    createdById: number | null;
    updatedById: number | null;
    deletedAt: string | null;
    deletedById: number | null;
    driver: VehicleDriver | null;
}

export interface VehicleFormData {
    vehicleNo: string;
    vehicleType: VehicleType;
    ownerName?: string;
    driverName?: string;
    driverUserId?: number | null;
    capacityKg?: number | null;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface VehicleListResponse {
    success: boolean;
    data: Vehicle[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface VehicleSingleResponse {
    success: boolean;
    data: Vehicle;
}
