"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FlightForm } from "@/components/masters/flight-form"
import { flightService } from "@/services/masters/flight-service"

export default function EditFlightPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: flightData, isLoading, error } = useQuery({
        queryKey: ["flight", id],
        queryFn: () => flightService.getFlightById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !flightData) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-destructive">Failed to load flight details.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/flights">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Flight</h1>
                    <p className="text-muted-foreground">
                        Update the details for {flightData.data.flightName}.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Flight Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <FlightForm initialData={flightData.data} />
                </CardContent>
            </Card>
        </div>
    )
}
