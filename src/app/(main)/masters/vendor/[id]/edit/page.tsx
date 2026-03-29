"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { VendorForm } from "@/components/masters/vendor-form"
import { vendorService } from "@/services/masters/vendor-service"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditVendorPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: vendorResponse, isLoading } = useQuery({
        queryKey: ["vendor", id],
        queryFn: () => vendorService.getVendorById(id),
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const vendor = vendorResponse?.data

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/masters/vendor">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Vendor</h1>
                    <p className="text-muted-foreground">Modify the vendor details</p>
                </div>
            </div>

            <VendorForm initialData={vendor} />
        </div>
    )
}
