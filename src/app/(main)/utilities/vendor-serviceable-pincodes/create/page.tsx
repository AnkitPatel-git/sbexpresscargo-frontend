"use client"

import { VendorServiceablePincodeForm } from "@/components/utilities/vendor-serviceable-pincode-form"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateVendorServiceablePincodePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/utilities/vendor-serviceable-pincodes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Vendor Pincode</h1>
                    <p className="text-muted-foreground">
                        Map a vendor to a master serviceable pincode and zone.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <VendorServiceablePincodeForm />
                </CardContent>
            </Card>
        </div>
    )
}
