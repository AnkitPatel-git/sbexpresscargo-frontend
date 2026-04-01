"use client"

import { ServiceablePincodeForm } from "@/components/utilities/serviceable-pincode-form"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateServiceablePincodePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/utilities/serviceable-pincodes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Serviceable Pincode</h1>
                    <p className="text-muted-foreground">
                        Add a new serviceable pincode to the system.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ServiceablePincodeForm />
                </CardContent>
            </Card>
        </div>
    )
}
