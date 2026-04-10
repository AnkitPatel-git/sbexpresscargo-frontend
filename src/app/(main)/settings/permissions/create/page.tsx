"use client"

import { PermissionForm } from "@/components/settings/permissions/permission-form"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreatePermissionPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/utilities/permissions">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Permission</h1>
                    <p className="text-muted-foreground">
                        Add a new permission rule to the system.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                    <PermissionForm />
                </CardContent>
            </Card>
        </div>
    )
}
