"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { serviceCenterService } from "@/services/masters/service-center-service"
import { ServiceCenterForm } from "@/components/masters/service-center-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EditServiceCenterPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: scResponse, isLoading, error } = useQuery({
        queryKey: ['service-center', id],
        queryFn: () => serviceCenterService.getServiceCenterById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !scResponse?.success) {
        return (
            <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg">
                <p>Failed to load service center. It may have been deleted or doesn't exist.</p>
                <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/masters/service-centers')}
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
                    onClick={() => router.push('/masters/service-centers')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Service Center</h1>
                    <p className="text-muted-foreground">
                        Update the details for: {scResponse.data.name}.
                    </p>
                </div>
            </div>

            <ServiceCenterForm key={id} initialData={scResponse.data} />
        </div>
    )
}
