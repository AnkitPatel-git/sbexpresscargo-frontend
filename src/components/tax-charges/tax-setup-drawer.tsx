import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import { FloatingFormItem, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

import { taxSetupService } from "@/services/tax-charges/tax-setup-service"
import { TaxSetup, TaxSetupFormData } from "@/types/tax-charges/tax-setup"

const taxSetupSchema = z.object({
    customer: z.string().min(1, "Customer is required"),
    product: z.string().min(1, "Product is required"),
    fromDate: z.string().min(1, "From Date is required"),
    toDate: z.string().min(1, "To Date is required"),
    igst: z.preprocess((val) => Number(val), z.number().min(0, "IGST must be a positive number")),
    cgst: z.preprocess((val) => Number(val), z.number().min(0, "CGST must be a positive number")),
    sgst: z.preprocess((val) => Number(val), z.number().min(0, "SGST must be a positive number")),
})

interface TaxSetupDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    taxSetup?: TaxSetup | null
}

export function TaxSetupDrawer({
    open,
    onOpenChange,
    taxSetup,
}: TaxSetupDrawerProps) {
    const queryClient = useQueryClient()
    const isEditing = !!taxSetup

    const form = useForm<TaxSetupFormData>({
        resolver: zodResolver(taxSetupSchema) as any,
        defaultValues: {
            customer: "",
            product: "",
            fromDate: format(new Date(), "yyyy-MM-dd"),
            toDate: format(new Date("2050-12-31"), "yyyy-MM-dd"),
            igst: 0,
            cgst: 0,
            sgst: 0,
        },
    })

    useEffect(() => {
        if (taxSetup && open) {
            form.reset({
                customer: taxSetup.customer,
                product: taxSetup.product,
                fromDate: taxSetup.fromDate ? format(new Date(taxSetup.fromDate), "yyyy-MM-dd") : "",
                toDate: taxSetup.toDate ? format(new Date(taxSetup.toDate), "yyyy-MM-dd") : "",
                igst: Number(taxSetup.igst) || 0,
                cgst: Number(taxSetup.cgst) || 0,
                sgst: Number(taxSetup.sgst) || 0,
            })
        } else if (!open) {
            form.reset({
                customer: "",
                product: "",
                fromDate: format(new Date(), "yyyy-MM-dd"),
                toDate: format(new Date("2050-12-31"), "yyyy-MM-dd"),
                igst: 0,
                cgst: 0,
                sgst: 0,
            })
        }
    }, [taxSetup, open, form])

    const createMutation = useMutation({
        mutationFn: (data: TaxSetupFormData) => taxSetupService.createTaxSetup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tax-setups"] })
            toast.success("Tax setup created successfully")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create tax setup")
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: TaxSetupFormData) => {
            if (!taxSetup) throw new Error("No tax setup selected")
            return taxSetupService.updateTaxSetup(taxSetup.id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tax-setups"] })
            toast.success("Tax setup updated successfully")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update tax setup")
        },
    })

    const onSubmit = (data: TaxSetupFormData) => {
        if (isEditing) {
            updateMutation.mutate(data)
        } else {
            createMutation.mutate(data)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle>{isEditing ? "Edit Tax Setup" : "Create Tax Setup"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Update the details of the tax setup here."
                            : "Add a new tax setup to the system."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                        <div className="space-y-4 px-6 pb-6">
                            <FormField
                                control={form.control}
                                name="customer"
                                render={({ field }) => (
                                    <FloatingFormItem label="Customer">
                                        <FormControl>
                                            <Input placeholder="e.g. CARD" {...field} disabled={isEditing} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="product"
                                render={({ field }) => (
                                    <FloatingFormItem label="Product">
                                        <FormControl>
                                            <Input placeholder="e.g. CARD" {...field} disabled={isEditing} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fromDate"
                                    render={({ field }) => (
                                        <FloatingFormItem label="From Date">
                                            <FormControl>
                                                <Input type="date" {...field} disabled={isEditing} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="toDate"
                                    render={({ field }) => (
                                        <FloatingFormItem label="To Date">
                                            <FormControl>
                                                <Input type="date" {...field} disabled={isEditing} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="igst"
                                    render={({ field }) => (
                                        <FloatingFormItem label="IGST (%)">
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cgst"
                                    render={({ field }) => (
                                        <FloatingFormItem label="CGST (%)">
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sgst"
                                    render={({ field }) => (
                                        <FloatingFormItem label="SGST (%)">
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
