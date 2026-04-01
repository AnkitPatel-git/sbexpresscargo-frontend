"use client"

import { CustomerForm } from "@/components/masters/customer-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateCustomerPage() {
    const router = useRouter()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/masters/customers')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Customer</h1>
                    <p className="text-muted-foreground">
                        Add a new customer, vendor, or agent to the system.
                    </p>
                </div>
            </div>

            <CustomerForm />
        </div>
    )
}
