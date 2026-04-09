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
        // Bruno: .../shipment?page=1&limit=20&sortBy=id&sortOrder=desc&search=
        const queryParams = new URLSearchParams({
            page: String(params?.page ?? 1),
            limit: String(params?.limit ?? 20),
            sortBy: params?.sortBy ?? 'id',
            sortOrder: params?.sortOrder ?? 'desc',
            search: params?.search ?? '',
        });

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
            method: 'PATCH',
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

    exportShipmentsCsv: async (): Promise<Blob> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/export`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to export shipments');
        }
        return response.blob();
    },

    upsertForwarding: async (
        shipmentId: number,
        data: {
            version: number
            deliveryAwb?: string
            forwardingAwb?: string
            deliveryVendorId?: number
            deliveryServiceMapId?: number
            totalAmount?: number
        }
    ): Promise<any> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/forwarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save forwarding details');
        }
        return response.json();
    },

    uploadKyc: async (
        shipmentId: number,
        payload: {
            type: string
            file: File
            entryType?: string
            entryDate?: string
        }
    ): Promise<any> => {
        const formData = new FormData();
        formData.append('type', payload.type);
        formData.append('file', payload.file);
        if (payload.entryType) formData.append('entryType', payload.entryType);
        if (payload.entryDate) formData.append('entryDate', payload.entryDate);

        const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/kyc`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: formData,
        });
        if (!response.ok) {
            let message = 'Failed to upload KYC';
            try {
                const error = await response.json();
                message = error.message || message;
            } catch {
                // ignore non-json response bodies
            }
            throw new Error(message);
        }
        return response.json();
    },

    listVendorMappings: async (shipmentId: number): Promise<any> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/vendor-mapping`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to load vendor mappings');
        }
        return response.json();
    },

    upsertVendorMapping: async (
        shipmentId: number,
        data: {
            version: number
            vendorId: number
            externalAwb?: string
            externalOrderId?: string
            status?: 'CREATED' | 'AWB_ASSIGNED' | 'FAILED' | 'RETRYING' | 'SYNCED'
            requestPayload?: Record<string, unknown>
            responsePayload?: Record<string, unknown>
            errorMessage?: string
        }
    ): Promise<any> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/vendor-mapping`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save vendor mapping');
        }
        return response.json();
    },

    addPod: async (shipmentId: number, data: { podFilePath: string; remark?: string }): Promise<any> => {
        const response = await apiFetch(`${API_URL}/transaction/shipment/${shipmentId}/pod`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add POD');
        }
        return response.json();
    },
};
