"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { customerService } from "@/services/masters/customer-service"
import { CustomerForm } from "@/components/masters/customer-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EditCustomerPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: customerResponse, isLoading, error } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => customerService.getCustomerById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !customerResponse?.success) {
        return (
            <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg">
                <p>Failed to load customer details. It may have been deleted or doesn't exist.</p>
                <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/masters/customers')}
                >
                    Back to List
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/masters/customers')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Customer</h1>
                    <p className="text-muted-foreground">
                        Update the details for: {customerResponse.data.name}.
                    </p>
                </div>
            </div>

            <CustomerForm key={id} initialData={customerResponse.data} />
        </div>
    )
}
