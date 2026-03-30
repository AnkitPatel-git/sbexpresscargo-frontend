"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { areaService } from "@/services/masters/area-service"
import { AreaForm } from "@/components/masters/area-form"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditAreaPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: areaResponse, isLoading, error } = useQuery({
        queryKey: ['area', id],
        queryFn: () => areaService.getAreaById(id),
        enabled: !!id
    })

    if (isLoading) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !areaResponse?.data) {
        return (
            <div className="flex h-[450px] flex-col items-center justify-center gap-2">
                <h3 className="text-xl font-semibold">Error loading area</h3>
                <p className="text-muted-foreground">The area could not be found or there was an error fetching the data.</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/masters/area">
                        Back to List
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/area">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Area</h1>
                    <p className="text-muted-foreground">
                        Update the area details for {areaResponse.data.areaName}.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <AreaForm initialData={areaResponse.data} />
                </CardContent>
            </Card>
        </div>
    )
}
