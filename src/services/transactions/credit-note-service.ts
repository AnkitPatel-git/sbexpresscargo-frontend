import { apiFetch } from '@/lib/api-fetch';
import { CreditNoteListResponse, CreditNoteSingleResponse, CreditNoteFormValues } from '@/types/transactions/credit-note';

const getAuthHeaders = (isFormData = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

class CreditNoteService {
    private readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/transaction/receipt-expenses/credit-note`;

    async getCreditNotes(page: number, limit: number, search: string = ''): Promise<CreditNoteListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy: 'noteNo',
            sortOrder: 'desc',
        });

        if (search) {
            queryParams.append('search', search);
        }

        const response = await apiFetch(`${this.baseUrl}?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch credit notes');
        }
        return response.json();
    }

    async getCreditNoteById(id: number): Promise<CreditNoteSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error('Failed to fetch credit note');
        }
        return response.json();
    }

    async createCreditNote(data: CreditNoteFormValues): Promise<CreditNoteSingleResponse> {
        const response = await apiFetch(this.baseUrl, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create credit note');
        }
        return response.json();
    }

    async updateCreditNote(id: number, data: Partial<CreditNoteFormValues>): Promise<CreditNoteSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update credit note');
        }
        return response.json();
    }

    async deleteCreditNote(id: number): Promise<void> {
        const response = await apiFetch(`${this.baseUrl}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(true),
        });
        if (!response.ok) {
            throw new Error('Failed to delete credit note');
        }
    }

    async postCreditNote(id: number): Promise<CreditNoteSingleResponse> {
        const response = await apiFetch(`${this.baseUrl}/${id}/post`, {
            method: 'POST',
            headers: getAuthHeaders(true),
        });
        if (!response.ok) {
            throw new Error('Failed to post credit note');
        }
        return response.json();
    }
}

export const creditNoteService = new CreditNoteService();
