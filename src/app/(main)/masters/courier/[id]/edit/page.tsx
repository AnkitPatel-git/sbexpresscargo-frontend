"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { courierService } from "@/services/masters/courier-service"
import { CourierForm } from "@/components/masters/courier-form"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditCourierPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: courierResponse, isLoading, error } = useQuery({
        queryKey: ['courier', id],
        queryFn: () => courierService.getCourierById(id),
        enabled: !!id
    })

    if (isLoading) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !courierResponse?.data) {
        return (
            <div className="flex h-[450px] flex-col items-center justify-center gap-2">
                <h3 className="text-xl font-semibold">Error loading courier</h3>
                <p className="text-muted-foreground">The courier could not be found or there was an error fetching the data.</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/masters/courier text-blue-600">
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
                    <Link href="/masters/courier">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Courier</h1>
                    <p className="text-muted-foreground">
                        Update the courier details for {courierResponse.data.name}.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Courier Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <CourierForm initialData={courierResponse.data} />
                </CardContent>
            </Card>
        </div>
    )
}
