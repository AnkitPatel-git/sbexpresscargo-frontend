"use client"

import { CourierForm } from "@/components/masters/courier-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateCourierPage() {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/masters/courier")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Courier</h1>
                    <p className="text-muted-foreground">Add a courier linked to a portal user.</p>
                </div>
            </div>
            <CourierForm />
        </div>
    )
}
