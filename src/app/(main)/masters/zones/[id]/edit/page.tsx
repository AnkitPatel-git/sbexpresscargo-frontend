"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ZoneForm } from "@/components/masters/zone-form"
import { zoneService } from "@/services/masters/zone-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditZonePage() {
    const params = useParams()
    const id = params.id as string

    const { data, isLoading, error } = useQuery({
        queryKey: ["zone", id],
        queryFn: () => zoneService.getZoneById(parseInt(id)),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">Failed to load zone details</p>
                <Button variant="link" asChild>
                    <Link href="/masters/zones">Go back to list</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/zones">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Zone</h1>
                    <p className="text-muted-foreground">
                        Update shipping zone details.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Zone Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ZoneForm key={data.data.id} initialData={data.data} />
                </CardContent>
            </Card>
        </div>
    )
}
