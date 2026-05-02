"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CustomerGroupForm } from "@/components/masters/customer-group-form"
import { customerGroupService } from "@/services/masters/customer-group-service"

export default function EditCustomerGroupPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: groupResponse, isLoading, error } = useQuery({
        queryKey: ["customer-group", id],
        queryFn: () => customerGroupService.getCustomerGroupById(id),
        enabled: Number.isFinite(id) && id > 0,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !groupResponse?.data) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-destructive">Failed to load customer group.</p>
                <Button type="button" variant="outline" onClick={() => router.push("/masters/customer-groups")}>
                    Back to customer groups
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.push("/masters/customer-groups")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit customer group</h1>
                    <p className="text-muted-foreground">Update group: {groupResponse.data.code}.</p>
                </div>
            </div>
            <CustomerGroupForm key={id} initialData={groupResponse.data} />
        </div>
    )
}
