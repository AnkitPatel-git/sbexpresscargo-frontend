"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FormSection } from "@/components/ui/form-section"
import { FlightForm } from "@/components/masters/flight-form"

export default function CreateFlightPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/flights">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Flight</h1>
                    <p className="text-muted-foreground">
                        Add a new flight to the master list.
                    </p>
                </div>
            </div>

            <FormSection title="Flight Details">
                <FlightForm />
            </FormSection>
        </div>
    )
}
