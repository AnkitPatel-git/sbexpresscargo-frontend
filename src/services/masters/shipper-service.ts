import { apiFetch } from '@/lib/api-fetch'
import { ShipperFormData, ShipperListResponse, ShipperSingleResponse } from '@/types/masters/shipper'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const shipperService = {
    async getShippers(params?: {
        page?: number
        limit?: number
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        shipperCode?: string
        shipperName?: string
        aadhaarNo?: string
    }): Promise<ShipperListResponse> {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        queryParams.append('search', params?.search ?? '')
        queryParams.append('sortBy', params?.sortBy ?? 'shipperCode')
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc')
        if (params?.shipperCode) queryParams.append('shipperCode', params.shipperCode)
        if (params?.shipperName) queryParams.append('shipperName', params.shipperName)
        if (params?.aadhaarNo) queryParams.append('aadhaarNo', params.aadhaarNo)

        const response = await apiFetch(`${API_URL}/shipper-master?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) throw new Error('Failed to fetch shippers')
        return response.json()
    },

    async getShipperById(id: number): Promise<ShipperSingleResponse> {
        const response = await apiFetch(`${API_URL}/shipper-master/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) throw new Error('Failed to fetch shipper')
        return response.json()
    },

    async createShipper(data: ShipperFormData): Promise<ShipperSingleResponse> {
        const response = await apiFetch(`${API_URL}/shipper-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to create shipper')
        }

        return response.json()
    },

    async updateShipper(id: number, data: Partial<ShipperFormData>): Promise<ShipperSingleResponse> {
        const response = await apiFetch(`${API_URL}/shipper-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update shipper')
        }

        return response.json()
    },

    async deleteShipper(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/shipper-master/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to delete shipper')
        }

        return response.json()
    },

    async exportShippers(params?: {
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        shipperCode?: string
        shipperName?: string
        aadhaarNo?: string
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams()
        queryParams.append('search', params?.search ?? '')
        queryParams.append('sortBy', params?.sortBy ?? 'shipperCode')
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc')
        if (params?.shipperCode) queryParams.append('shipperCode', params.shipperCode)
        if (params?.shipperName) queryParams.append('shipperName', params.shipperName)
        if (params?.aadhaarNo) queryParams.append('aadhaarNo', params.aadhaarNo)

        const response = await apiFetch(`${API_URL}/shipper-master/export?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) throw new Error('Failed to export shippers')

        const cd = response.headers.get('content-disposition')
        let filename = 'shippers.csv'
        const match = cd?.match(/filename="?([^";\n]+)"?/i)
        if (match?.[1]) filename = match[1].trim()

        return { blob: await response.blob(), filename }
    },
}
