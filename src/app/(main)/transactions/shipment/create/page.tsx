"use client"

import { ShipmentForm } from "@/components/transactions/shipment-form"

export default function CreateShipmentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Shipment</h1>
                <p className="text-muted-foreground">
                    Add a new shipment AWB to the system.
                </p>
            </div>

            <ShipmentForm />
        </div>
    )
}
