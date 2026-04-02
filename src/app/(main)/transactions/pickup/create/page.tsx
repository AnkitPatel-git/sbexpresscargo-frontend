"use client";

"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PickupForm } from "@/components/transactions/pickup-form"

export default function CreatePickupPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-gray-200">
                        <Link href="/transactions/pickup">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Pickup</h1>
                        <p className="text-muted-foreground">
                            Fill in the details below to schedule a new shipment pickup.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <PickupForm />
            </div>
        </div>
    )
}
