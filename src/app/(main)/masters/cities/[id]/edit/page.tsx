"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, Loader2 } from "lucide-react"
import { CityForm } from "@/components/masters/city-form"
import { cityService } from "@/services/masters/city-service"

export default function EditCityPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["city", id],
        queryFn: () => cityService.getCityById(id),
        enabled: Number.isFinite(id) && id > 0,
    })

    const city = data?.data

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Link href="/masters/cities" className="inline-flex items-center text-sm text-[var(--express-link)] hover:underline">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to City Master
                </Link>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-4 lg:p-5">
                <h1 className="mb-4 text-lg font-semibold text-foreground">Edit City</h1>
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Loading...
                    </div>
                ) : isError || !city ? (
                    <p className="text-destructive">City not found.</p>
                ) : (
                    <CityForm initialData={city} />
                )}
            </div>
        </div>
    )
}
