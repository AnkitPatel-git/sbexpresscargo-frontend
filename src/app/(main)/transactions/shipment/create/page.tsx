"use client"

import { ShipmentForm } from "@/components/transactions/shipment-form"

export default function CreateShipmentPage() {
    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-3">
                <h1 className="text-base font-semibold tracking-tight">Shipment Booking</h1>
                <p className="text-xs text-muted-foreground">
                    Create shipment booking using the latest shipment API payload fields.
                </p>
            </div>

            <ShipmentForm />
        </div>
    )
}
