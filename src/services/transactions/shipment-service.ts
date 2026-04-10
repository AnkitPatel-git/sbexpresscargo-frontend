import { apiFetch } from '@/lib/api-fetch';
import { Shipment, ShipmentListResponse, ShipmentSingleResponse, ShipmentFormValues } from '@/types/transactions/shipment';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const shipmentService = {
    getShipments: async (params?: { 
        page?: number; 
        limit?: number; 
        search?: string; 
        sortBy?: string; 
        sortOrder?: string;
    }): Promise<ShipmentListResponse> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const response = await apiFetch(`${API_URL}/transaction/shipment?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch shipments');
        }
        return response.json();
    },

    getShipmentById: async (id: number): Promise<ShipmentSingleResponse> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch shipment');
        }
        return response.json();
    },

    createShipment: async (data: ShipmentFormValues): Promise<ShipmentSingleResponse> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create shipment');
        }
        return response.json();
    },

    updateShipment: async (id: number, data: ShipmentFormValues): Promise<ShipmentSingleResponse> => {
        if (!data.version) {
            throw new Error('Shipment version is required for update')
        }
        const response = await apiFetch(`${API_URL}/transaction/shipment/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update shipment');
        }
        return response.json();
    },

    downloadPiecesTemplate: async (): Promise<Blob> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/pieces-template`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to download pieces template');
        }
        return response.blob();
    },

    deleteShipment: async (id: number): Promise<{ success: boolean; message?: string }> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete shipment');
        }
        return response.json();
    },
};
