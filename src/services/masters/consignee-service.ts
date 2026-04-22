import { apiFetch } from '@/lib/api-fetch'
import { ConsigneeFormData, ConsigneeListResponse, ConsigneeSingleResponse } from '@/types/masters/consignee'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const consigneeService = {
    async getConsignees(params?: {
        page?: number
        limit?: number
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        code?: string
        name?: string
    }): Promise<ConsigneeListResponse> {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', String(params.page))
        if (params?.limit) queryParams.append('limit', String(params.limit))
        queryParams.append('search', params?.search ?? '')
        queryParams.append('sortBy', params?.sortBy ?? 'code')
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc')
        if (params?.code) queryParams.append('code', params.code)
        if (params?.name) queryParams.append('name', params.name)

        const response = await apiFetch(`${API_URL}/consignee-master?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) throw new Error('Failed to fetch consignees')
        return response.json()
    },

    async getConsigneeById(id: number): Promise<ConsigneeSingleResponse> {
        const response = await apiFetch(`${API_URL}/consignee-master/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) throw new Error('Failed to fetch consignee')
        return response.json()
    },

    async createConsignee(data: ConsigneeFormData): Promise<ConsigneeSingleResponse> {
        const response = await apiFetch(`${API_URL}/consignee-master`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to create consignee')
        }

        return response.json()
    },

    async updateConsignee(id: number, data: Partial<ConsigneeFormData>): Promise<ConsigneeSingleResponse> {
        const response = await apiFetch(`${API_URL}/consignee-master/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update consignee')
        }

        return response.json()
    },

    async deleteConsignee(id: number): Promise<{ success: boolean; message: string }> {
        const response = await apiFetch(`${API_URL}/consignee-master/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to delete consignee')
        }

        return response.json()
    },

    async exportConsignees(params?: {
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
        code?: string
        name?: string
    }): Promise<{ blob: Blob; filename: string }> {
        const queryParams = new URLSearchParams()
        queryParams.append('search', params?.search ?? '')
        queryParams.append('sortBy', params?.sortBy ?? 'code')
        queryParams.append('sortOrder', params?.sortOrder ?? 'asc')
        if (params?.code) queryParams.append('code', params.code)
        if (params?.name) queryParams.append('name', params.name)

        const response = await apiFetch(`${API_URL}/consignee-master/export?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        })

        if (!response.ok) throw new Error('Failed to export consignees')

        const cd = response.headers.get('content-disposition')
        let filename = 'consignees.csv'
        const match = cd?.match(/filename="?([^";\n]+)"?/i)
        if (match?.[1]) filename = match[1].trim()

        return { blob: await response.blob(), filename }
    },
}
