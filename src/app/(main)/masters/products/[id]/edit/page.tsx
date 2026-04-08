"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ProductForm } from "@/components/masters/product-form"
import { productService } from "@/services/masters/product-service"
import { FormSection } from "@/components/ui/form-section"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditProductPage() {
    const params = useParams()
    const id = params.id as string

    const { data, isLoading, error } = useQuery({
        queryKey: ["product", id],
        queryFn: () => productService.getProductById(parseInt(id)),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">Failed to load product details</p>
                <Button variant="link" asChild>
                    <Link href="/masters/products">Go back to list</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                    <p className="text-muted-foreground">
                        Update shipping product details.
                    </p>
                </div>
            </div>

            <FormSection title="Product Details">
                <ProductForm key={data.data.id} initialData={data.data} />
            </FormSection>
        </div>
    )
}
