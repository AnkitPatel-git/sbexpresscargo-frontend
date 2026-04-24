/** Shipper Master — Bruno `docs/bruno/master/shipper/*`. */

export interface ShipperCountryRef {
    id: number
    code?: string
    name?: string
}

export interface ShipperStateRef {
    id: number
    stateName: string
    stateCode?: string
    countryId?: number
}

export interface ShipperBankRef {
    id: number
    bankCode?: string
    bankName: string
    status?: string
}

export interface ShipperServiceablePincode {
    id: number
    countryId?: number
    stateId?: number
    pinCode: string
    cityName: string
    areaName?: string
    serviceable?: boolean
    oda?: boolean
}

export interface Shipper {
    id: number
    shipperCode: string
    shipperName: string
    contactPerson: string | null
    address1: string | null
    address2: string | null
    pinCodeId: number | null
    countryId: number | null
    stateId: number | null
    zoneId: number | null
    telephone: string | null
    email: string | null
    mobile: string | null
    aadhaarNo: string | null
    panNo: string | null
    bankId: number | null
    bankAccount: string | null
    bankIfsc: string | null
    firmType: 'GOV' | 'NON_GOV' | string | null
    createdAt?: string
    updatedAt?: string
    createdById?: number | null
    updatedById?: number | null
    deletedAt?: string | null
    deletedById?: number | null
    country?: ShipperCountryRef | null
    state?: ShipperStateRef | null
    bank?: ShipperBankRef | null
    serviceablePincode?: ShipperServiceablePincode | null
}

export interface ShipperFormData {
    shipperCode?: string
    shipperName: string
    contactPerson?: string
    address1?: string
    address2?: string
    pinCodeId?: string
    telephone?: string
    email?: string
    mobile?: string
    aadhaarNo?: string
    panNo?: string
    bankId?: number
    bankAccount?: string
    bankIfsc?: string
    firmType?: 'GOV' | 'NON_GOV' | string
}

export interface ShipperListResponse {
    success: boolean
    message?: string
    data: Shipper[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface ShipperSingleResponse {
    success: boolean
    message?: string
    data: Shipper
}
