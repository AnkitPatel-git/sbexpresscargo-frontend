"use client"

import { ContentForm } from "@/components/masters/content-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateContentPage() {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/masters/contents')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Content</h1>
                    <p className="text-muted-foreground">
                        Add a new shipment content to the system.
                    </p>
                </div>
            </div>

            <ContentForm />
        </div>
    )
}
