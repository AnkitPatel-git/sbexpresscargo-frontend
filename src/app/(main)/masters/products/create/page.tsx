"use client"

import { ProductForm } from "@/components/masters/product-form"
import { FormSection } from "@/components/ui/form-section"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateProductPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-muted-foreground">
                        Add a new shipping product to the master list.
                    </p>
                </div>
            </div>

            <FormSection title="Product Details">
                <ProductForm />
            </FormSection>
        </div>
    )
}
