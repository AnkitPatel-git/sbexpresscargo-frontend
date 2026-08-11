"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { vendorServiceablePincodeService } from "@/services/utilities/vendor-serviceable-pincode-service"
import { VendorServiceablePincodeForm } from "@/components/utilities/vendor-serviceable-pincode-form"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditVendorServiceablePincodePage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['vendor-serviceable-pincode', id],
        queryFn: () => vendorServiceablePincodeService.getVendorServiceablePincodeById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !response?.data) {
        return (
            <div className="flex h-[450px] flex-col items-center justify-center gap-2">
                <h3 className="text-xl font-semibold">Error loading vendor pincode</h3>
                <p className="text-muted-foreground text-center px-6">
                    The vendor pincode mapping could not be found or there was an error fetching the data.
                </p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/utilities/vendor-serviceable-pincodes">
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
                    <Link href="/utilities/vendor-serviceable-pincodes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Vendor Pincode</h1>
                    <p className="text-muted-foreground">
                        Update mapping for {response.data.vendor?.vendorName ?? 'vendor'} — pincode {response.data.pinCode ?? response.data.serviceablePincode?.pinCode}.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <VendorServiceablePincodeForm initialData={response.data} />
                </CardContent>
            </Card>
        </div>
    )
}
