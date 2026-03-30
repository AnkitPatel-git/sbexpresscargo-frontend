"use client"

import { CourierForm } from "@/components/masters/courier-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateCourierPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/courier">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Courier</h1>
                    <p className="text-muted-foreground">
                        Enter the details for the new courier.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Courier Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <CourierForm />
                </CardContent>
            </Card>
        </div>
    )
}
