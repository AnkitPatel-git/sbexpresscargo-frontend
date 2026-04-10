"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CourierForm } from "@/components/masters/courier-form"
import { courierService } from "@/services/masters/courier-service"

export default function EditCourierPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: courierResponse, isLoading, error } = useQuery({
        queryKey: ["courier", id],
        queryFn: () => courierService.getCourierById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !courierResponse?.data?.id) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-destructive">Failed to load courier details.</p>
                <Button variant="outline" onClick={() => router.push("/masters/courier")}>
                    Back to Couriers
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/masters/courier")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Courier</h1>
                    <p className="text-muted-foreground">Update courier: {courierResponse.data.code}.</p>
                </div>
            </div>
            <CourierForm key={id} initialData={courierResponse.data} />
        </div>
    )
}
