"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PickupForm } from "@/components/transactions/pickup-form"
import { pickupService } from "@/services/transactions/pickup-service"

export default function EditPickupPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data, isLoading, error } = useQuery({
        queryKey: ['pickup', id],
        queryFn: () => pickupService.getPickupById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-destructive font-medium">Failed to load pickup record.</p>
                <Button asChild variant="outline">
                    <Link href="/transactions/pickup">Back to List</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-gray-200">
                        <Link href="/transactions/pickup">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Pickup</h1>
                        <p className="text-muted-foreground">
                            Update the shipment pickup details.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <PickupForm initialData={data?.data} />
            </div>
        </div>
    )
}
