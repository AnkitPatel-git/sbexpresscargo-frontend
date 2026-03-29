"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BankForm } from "@/components/masters/bank-form"
import { bankService } from "@/services/masters/bank-service"

export default function EditBankPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: bankResponse, isLoading, error } = useQuery({
        queryKey: ['bank', id],
        queryFn: () => bankService.getBankById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !bankResponse) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-destructive">Failed to load bank details.</p>
                <Button variant="outline" onClick={() => router.push('/masters/banks')}>
                    Back to Banks
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/masters/banks')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Bank</h1>
                    <p className="text-muted-foreground">
                        Update the details for Bank: {bankResponse.data.bankCode}.
                    </p>
                </div>
            </div>

            <BankForm key={id} initialData={bankResponse.data} />
        </div>
    )
}
