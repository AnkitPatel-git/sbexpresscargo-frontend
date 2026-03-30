"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { serviceablePincodeService } from "@/services/utilities/serviceable-pincode-service"
import { ServiceablePincodeForm } from "@/components/utilities/serviceable-pincode-form"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditServiceablePincodePage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['serviceable-pincode', id],
        queryFn: () => serviceablePincodeService.getServiceablePincodeById(id),
        enabled: !!id
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
                <h3 className="text-xl font-semibold">Error loading pincode</h3>
                <p className="text-muted-foreground text-center px-6">The serviceable pincode could not be found or there was an error fetching the data.</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/utilities/serviceable-pincodes">
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
                    <Link href="/utilities/serviceable-pincodes">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Serviceable Pincode</h1>
                    <p className="text-muted-foreground">
                        Update the details for pincode {response.data.pinCode}.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ServiceablePincodeForm initialData={response.data} />
                </CardContent>
            </Card>
        </div>
    )
}
