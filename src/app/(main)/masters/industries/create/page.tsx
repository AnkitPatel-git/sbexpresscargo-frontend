"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndustryForm } from "@/components/masters/industry-form"

export default function CreateIndustryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/industries">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Industry</h1>
                    <p className="text-muted-foreground">
                        Add a new industry to the master list.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Industry Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <IndustryForm />
                </CardContent>
            </Card>
        </div>
    )
}
