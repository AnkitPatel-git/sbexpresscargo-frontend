"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, Pencil, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { shipmentService } from "@/services/transactions/shipment-service"

const fallbackText = (value?: string | number | null) => {
    if (value === null || value === undefined || value === "") return "—"
    return String(value)
}

export default function ShipmentDetailsPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: shipmentResponse, isLoading } = useQuery({
        queryKey: ["shipment", id],
        queryFn: () => shipmentService.getShipmentById(id),
        enabled: Number.isFinite(id) && id > 0,
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
                <p className="text-muted-foreground">Shipment not found.</p>
            </div>
        )
    }

    const shipment = shipmentResponse.data

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
                <div>
                    <h1 className="text-base font-semibold tracking-tight">Shipment Details</h1>
                    <p className="text-xs text-muted-foreground">AWB: {shipment.awbNo}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild type="button" variant="outline" size="sm">
                        <Link href="/transactions/shipment">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                    <Button asChild type="button" size="sm">
                        <Link href={`/transactions/shipment/${shipment.id}/edit`}>
                            <Pencil className="mr-1 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Core Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">AWB No:</span> {fallbackText(shipment.awbNo)}</p>
                        <p>
                            <span className="text-muted-foreground">Book Date:</span>{" "}
                            {shipment.bookDate ? format(new Date(shipment.bookDate), "dd/MM/yyyy") : "—"}
                        </p>
                        <p><span className="text-muted-foreground">Book Time:</span> {fallbackText(shipment.bookTime)}</p>
                        <p><span className="text-muted-foreground">Reference No:</span> {fallbackText(shipment.referenceNo)}</p>
                        <p><span className="text-muted-foreground">Status:</span> {fallbackText(shipment.currentStatus)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Party & Route</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Customer:</span> {fallbackText(shipment.customer?.name)}</p>
                        <p><span className="text-muted-foreground">Shipper:</span> {fallbackText(shipment.shipper?.shipperName || shipment.shipper?.name)}</p>
                        <p><span className="text-muted-foreground">Consignee:</span> {fallbackText(shipment.consignee?.consigneeName || shipment.consignee?.name)}</p>
                        <p><span className="text-muted-foreground">Origin:</span> {fallbackText(shipment.origin)}</p>
                        <p><span className="text-muted-foreground">Destination:</span> {fallbackText(shipment.destination)}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Service & Billing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Product:</span> {fallbackText(shipment.product?.productName || shipment.product?.name)}</p>
                        <p><span className="text-muted-foreground">Vendor:</span> {fallbackText(shipment.vendor?.vendorName || shipment.vendor?.name)}</p>
                        <p><span className="text-muted-foreground">Payment Type:</span> {fallbackText(shipment.paymentType)}</p>
                        <p><span className="text-muted-foreground">Currency:</span> {fallbackText(shipment.currency)}</p>
                        <p><span className="text-muted-foreground">COD:</span> {shipment.isCod ? `Yes (${fallbackText(shipment.codAmount)})` : "No"}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Weight & Pieces</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Pieces:</span> {fallbackText(shipment.pieces)}</p>
                        <p><span className="text-muted-foreground">Declared Weight:</span> {fallbackText(shipment.declaredWeight)}</p>
                        <p><span className="text-muted-foreground">Actual Weight:</span> {fallbackText(shipment.actualWeight)}</p>
                        <p><span className="text-muted-foreground">Volumetric Weight:</span> {fallbackText(shipment.volumetricWeight)}</p>
                        <p><span className="text-muted-foreground">Charge Weight:</span> {fallbackText(shipment.chargeWeight)}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
