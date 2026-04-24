"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { ShipmentForm } from "@/components/transactions/shipment-form"
import { shipmentService } from "@/services/transactions/shipment-service"

export default function EditShipmentPage() {
    const params = useParams()
    const id = parseInt(params.id as string)

    const { data: shipmentResponse, isLoading } = useQuery({
        queryKey: ["shipment", id],
        queryFn: () => shipmentService.getShipmentById(id),
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!shipmentResponse?.data) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Shipment booking not found.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Edit Shipment Booking</h1>
                <p className="text-muted-foreground">
                    Update details for AWB: {shipmentResponse.data.awbNo}
                </p>
            </div>

            <ShipmentForm initialData={shipmentResponse.data} />
        </div>
    )
}
