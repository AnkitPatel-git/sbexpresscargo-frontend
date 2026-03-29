"use client"

import { ServiceCenterForm } from "@/components/masters/service-center-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateServiceCenterPage() {
    const router = useRouter()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/masters/service-centers')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Service Center</h1>
                    <p className="text-muted-foreground">
                        Add a new regional service center to the network.
                    </p>
                </div>
            </div>

            <ServiceCenterForm />
        </div>
    )
}
