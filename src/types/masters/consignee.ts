/** Consignee Master — Bruno `docs/bruno/master/consignee/*`. */

export interface ConsigneeCountryRef {
    id: number
    code?: string
    name?: string
}

export interface ConsigneeStateRef {
    id: number
    stateName: string
    stateCode?: string
    countryId?: number
}

export interface ConsigneeStateMasterRef {
    id: number
    stateName: string
    stateCode?: string
    countryId?: number
    gstAlias?: string
    unionTerritory?: boolean
}

export interface ConsigneeServiceablePincode {
    id: number
    countryId?: number
    stateId?: number
    pinCode: string
    cityName: string
    areaName?: string
    serviceable?: boolean
    oda?: boolean
}

export interface Consignee {
    id: number
    code: string
    name: string
    contactPerson: string | null
    address1: string | null
    address2: string | null
    pinCodeId: number | null
    countryId: number | null
    stateId: number | null
    telephone: string | null
    email: string | null
    mobile: string | null
    createdAt?: string
    updatedAt?: string
    createdById?: number | null
    updatedById?: number | null
    deletedAt?: string | null
    deletedById?: number | null
    country?: ConsigneeCountryRef | null
    stateMaster?: ConsigneeStateMasterRef | null
    state?: ConsigneeStateRef | null
    serviceablePincode?: ConsigneeServiceablePincode | null
}

export interface ConsigneeFormData {
    code?: string
    name: string
    contactPerson?: string
    address1?: string
    address2?: string
    pinCodeId?: number
    telephone?: string
    email?: string
    mobile?: string
}

export interface ConsigneeListResponse {
    success: boolean
    message?: string
    data: Consignee[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface ConsigneeSingleResponse {
    success: boolean
    message?: string
    data: Consignee
}
