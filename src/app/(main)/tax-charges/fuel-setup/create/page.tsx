"use client"

import { FuelSetupForm } from "@/components/tax-charges/fuel-setup-form"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateFuelSetupPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/tax-charges/fuel-setup">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Fuel Setup</h1>
                    <p className="text-muted-foreground">
                        Add a new fuel setup rule to the system.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <FuelSetupForm />
                </CardContent>
            </Card>
        </div>
    )
}
