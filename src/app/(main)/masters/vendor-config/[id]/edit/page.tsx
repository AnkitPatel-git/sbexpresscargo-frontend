"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { VendorConfigForm } from "@/components/masters/vendor-config-form"
import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditVendorConfigPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: configResponse, isLoading } = useQuery({
        queryKey: ["vendor-config", id],
        queryFn: () => vendorConfigService.getVendorConfigById(id),
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const config = configResponse?.data

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/masters/vendor-config">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Vendor Config</h1>
                    <p className="text-muted-foreground">Modify the vendor integration configuration</p>
                </div>
            </div>

            <VendorConfigForm initialData={config} />
        </div>
    )
}
