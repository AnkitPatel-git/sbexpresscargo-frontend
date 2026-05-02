"use client"

import { CustomerGroupForm } from "@/components/masters/customer-group-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateCustomerGroupPage() {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.push("/masters/customer-groups")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create customer group</h1>
                    <p className="text-muted-foreground">Optional label used to group customers for reports and filters.</p>
                </div>
            </div>
            <CustomerGroupForm />
        </div>
    )
}
