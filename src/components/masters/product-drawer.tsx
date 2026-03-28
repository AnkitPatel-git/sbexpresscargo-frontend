"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { productService } from '@/services/masters/product-service'
import { Product } from '@/types/masters/product'

const productSchema = z.object({
    productCode: z.string().min(2, "Product code must be at least 2 characters"),
    productName: z.string().min(3, "Product name must be at least 3 characters"),
    productType: z.string().min(1, "Product type is required"),
    productService: z.string().optional().nullable(),
    fuelCharge: z.boolean(),
    gstReverse: z.boolean(),
    docType: z.string().min(1, "Doc type is required"),
    status: z.string().min(1, "Status is required"),
    groupType: z.string().min(1, "Group type is required"),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: Product | null
}

export function ProductDrawer({ open, onOpenChange, product }: ProductDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!product

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            productCode: "",
            productName: "",
            productType: "DOMESTIC",
            productService: "",
            fuelCharge: true,
            gstReverse: false,
            docType: "DOX",
            status: "ACTIVE",
            groupType: "AIR",
        },
    })

    useEffect(() => {
        if (product) {
            form.reset({
                productCode: product.productCode,
                productName: product.productName,
                productType: product.productType,
                productService: product.productService || "",
                fuelCharge: product.fuelCharge,
                gstReverse: product.gstReverse,
                docType: product.docType,
                status: product.status,
                groupType: product.groupType,
            })
        } else {
            form.reset({
                productCode: "",
                productName: "",
                productType: "DOMESTIC",
                productService: "",
                fuelCharge: true,
                gstReverse: false,
                docType: "DOX",
                status: "ACTIVE",
                groupType: "AIR",
            })
        }
    }, [product, form])

    const mutation = useMutation({
        mutationFn: (data: ProductFormValues) => {
            if (isEdit && product) {
                return productService.updateProduct(product.id, data)
            }
            return productService.createProduct(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success(isEdit ? "Product updated successfully" : "Product created successfully")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} product`)
        },
    })

    function onSubmit(data: ProductFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Product" : "Create Product"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the product details below." : "Enter the details for the new product."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="productCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter product code" {...field} disabled={isEdit} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="productName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter product name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="productType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                                    <SelectItem value="INTERNATIONAL">International</SelectItem>
                                                    <SelectItem value="IMPORT">Import</SelectItem>
                                                    <SelectItem value="LOCAL">Local</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="groupType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Group Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select group" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="AIR">Air</SelectItem>
                                                    <SelectItem value="SURFACE">Surface</SelectItem>
                                                    <SelectItem value="TRAIN">Train</SelectItem>
                                                    <SelectItem value="ALL">All</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="docType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Doc Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select doc type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DOX">DOX</SelectItem>
                                                    <SelectItem value="NDOX">NDOX</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="productService"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Service</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter service name (optional)" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-6 pt-2">
                                <FormField
                                    control={form.control}
                                    name="fuelCharge"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Fuel Charge</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gstReverse"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>GST Reverse</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
