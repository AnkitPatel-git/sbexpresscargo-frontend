"use client"

import { ZoneForm } from "@/components/masters/zone-form"
import { FormSection } from "@/components/ui/form-section"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateZonePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/zones">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Zone</h1>
                    <p className="text-muted-foreground">
                        Add a new shipping zone to the master list.
                    </p>
                </div>
            </div>

            <FormSection title="Zone Details">
                <ZoneForm />
            </FormSection>
        </div>
    )
}
