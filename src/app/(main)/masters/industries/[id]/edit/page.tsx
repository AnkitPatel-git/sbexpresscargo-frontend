"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndustryForm } from "@/components/masters/industry-form"
import { industryService } from "@/services/masters/industry-service"

export default function EditIndustryPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: industryData, isLoading, error } = useQuery({
        queryKey: ["industry", id],
        queryFn: () => industryService.getIndustryById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !industryData) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-destructive">Failed to load industry details.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/industries">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Industry</h1>
                    <p className="text-muted-foreground">
                        Update the details for {industryData.data.industryName}.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Industry Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <IndustryForm initialData={industryData.data} />
                </CardContent>
            </Card>
        </div>
    )
}
