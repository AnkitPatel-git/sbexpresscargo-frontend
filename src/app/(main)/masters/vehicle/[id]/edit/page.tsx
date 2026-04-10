"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { VehicleForm } from "@/components/masters/vehicle-form"
import { vehicleService } from "@/services/masters/vehicle-service"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditVehiclePage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: vehicleResponse, isLoading } = useQuery({
        queryKey: ["vehicle", id],
        queryFn: () => vehicleService.getVehicleById(id),
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const vehicle = vehicleResponse?.data

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/masters/vehicle">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Vehicle</h1>
                    <p className="text-muted-foreground">Modify the vehicle details</p>
                </div>
            </div>

            <VehicleForm initialData={vehicle} />
        </div>
    )
}
