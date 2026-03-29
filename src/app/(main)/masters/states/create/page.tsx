"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StateForm } from "@/components/masters/state-form"

export default function CreateStatePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/states">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create State</h1>
                    <p className="text-muted-foreground">
                        Add a new state to the master list.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>State Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <StateForm />
                </CardContent>
            </Card>
        </div>
    )
}
