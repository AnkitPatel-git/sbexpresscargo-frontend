export interface CountryPincode {
  id: number;
  countryId: number | null;
  pinCode: string;
  cityName: string;
  stateName: string;
  country?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface CountryPincodeFormData {
  countryId?: number;
  countryCode?: string;
  pinCode: string;
  cityName: string;
  stateName: string;
  version?: number;
}

export interface CountryPincodeListResponse {
  success: boolean;
  data: CountryPincode[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CountryPincodeSingleResponse {
  success: boolean;
  data: CountryPincode;
}
