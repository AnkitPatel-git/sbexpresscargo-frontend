"use client"

import { ClientRateForm } from "@/components/masters/client-rate-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateClientRatePage() {
    const router = useRouter()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/masters/client-rates')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Client Rate</h1>
                    <p className="text-muted-foreground">
                        Define a new shipping rate for a specific customer and product combination.
                    </p>
                </div>
            </div>

            <ClientRateForm />
        </div>
    )
}
