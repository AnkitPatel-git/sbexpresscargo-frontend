"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { FormSection } from "@/components/ui/form-section"
import { CountryForm } from "@/components/masters/country-form"
import { countryService } from "@/services/masters/country-service"

export default function EditCountryPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: countryData, isLoading, error } = useQuery({
        queryKey: ["country", id],
        queryFn: () => countryService.getCountryById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !countryData) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-destructive">Failed to load country details.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/countries">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Country</h1>
                    <p className="text-muted-foreground">
                        Update the details for {countryData.data.name}.
                    </p>
                </div>
            </div>

            <FormSection title="Country Details">
                <CountryForm initialData={countryData.data} />
            </FormSection>
        </div>
    )
}
