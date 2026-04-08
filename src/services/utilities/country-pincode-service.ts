import { apiFetch } from '@/lib/api-fetch';
import {
  CountryPincodeFormData,
  CountryPincodeListResponse,
  CountryPincodeSingleResponse,
} from '@/types/utilities/country-pincode';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const countryPincodeService = {
  async getCountryPincodes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CountryPincodeListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiFetch(`${API_URL}/utilities/country-pincodes?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch country pincodes');
    }

    return response.json();
  },

  async getCountryPincodeById(id: number): Promise<CountryPincodeSingleResponse> {
    const response = await apiFetch(`${API_URL}/utilities/country-pincodes/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch country pincode details');
    }

    return response.json();
  },

  async createCountryPincode(data: CountryPincodeFormData): Promise<CountryPincodeSingleResponse> {
    const response = await apiFetch(`${API_URL}/utilities/country-pincodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create country pincode');
    }

    return response.json();
  },

  async updateCountryPincode(
    id: number,
    data: Partial<CountryPincodeFormData> & { version?: number },
  ): Promise<CountryPincodeSingleResponse> {
    if (!data.version) {
      throw new Error('Country pincode version is required for update');
    }

    const response = await apiFetch(`${API_URL}/utilities/country-pincodes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update country pincode');
    }

    return response.json();
  },

  async deleteCountryPincode(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch(`${API_URL}/utilities/country-pincodes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete country pincode');
    }

    return response.json();
  },
};
