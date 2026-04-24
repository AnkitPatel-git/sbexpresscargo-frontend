"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { productService } from '@/services/masters/product-service'
import {
    Product,
    type ProductFormData,
    type ProductUpdateData,
} from '@/types/masters/product'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const productSchema = z.object({
    productCode: optionalMasterCode(2),
    productName: z.string().trim().min(3, "Product name must be at least 3 characters"),
    productType: z.string().min(1, "Product type is required"),
    status: z.string().min(1, "Status is required"),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
    initialData?: Product | null
}

export function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productCode: initialData?.productCode || "",
            productName: initialData?.productName || "",
            productType: initialData?.productType || "DOMESTIC",
            status: initialData?.status || "ACTIVE",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                productCode: initialData.productCode,
                productName: initialData.productName,
                productType: initialData.productType,
                status: initialData.status,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: ProductFormValues) => {
            const payload = omitEmptyCodeFields({
                ...data,
                productName: data.productName.trim(),
            }, ['productCode']) as ProductFormValues
            if (isEdit && initialData) {
                const updateBody: ProductUpdateData = {
                    ...payload,
                    version: initialData.version ?? 1,
                }
                return productService.updateProduct(initialData.id, updateBody)
            }
            return productService.createProduct(payload as ProductFormData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['product', initialData.id] })
            }
            toast.success(isEdit ? "Product updated successfully" : "Product created successfully")
            router.push('/masters/products')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} product`)
        },
    })

    function onSubmit(data: ProductFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="productCode"
                        render={({ field }) => (
                            <FloatingFormItem label="Product Code (optional)">
                                <FormControl>
                                    <Input
                                        placeholder={isEdit ? "Enter product code" : "Leave blank to auto-generate"}
                                        {...field}
                                        className={FLOATING_INNER_CONTROL}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                            <FloatingFormItem label="Product Name">
                                <FormControl>
                                    <Input
                                        placeholder="Enter product name"
                                        {...field}
                                        className={FLOATING_INNER_CONTROL}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="productType"
                        render={({ field }) => (
                            <FloatingFormItem label="Product Type">
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                        <SelectItem value="INTERNATIONAL">International</SelectItem>
                                        <SelectItem value="LOCAL">Local</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FloatingFormItem label="Status">
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="outline" onClick={() => router.push('/masters/products')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
