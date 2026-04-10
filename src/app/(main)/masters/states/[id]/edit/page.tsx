"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { FormSection } from "@/components/ui/form-section"
import { StateForm } from "@/components/masters/state-form"
import { stateService } from "@/services/masters/state-service"

export default function EditStatePage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: stateData, isLoading, error } = useQuery({
        queryKey: ["state", id],
        queryFn: () => stateService.getStateById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !stateData) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-destructive">Failed to load state details.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/states">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit State</h1>
                    <p className="text-muted-foreground">
                        Update the details for {stateData.data.stateName}.
                    </p>
                </div>
            </div>

            <FormSection title="State Details">
                <StateForm initialData={stateData.data} />
            </FormSection>
        </div>
    )
}
