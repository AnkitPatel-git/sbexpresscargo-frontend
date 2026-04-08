"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { Check, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import { FloatingFormItem, FLOATING_INNER_COMBO, FLOATING_INNER_CONTROL, FLOATING_INNER_SELECT_TRIGGER } from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { fuelSetupService } from "@/services/tax-charges/fuel-setup-service"
import { customerService } from "@/services/masters/customer-service"
import { vendorService } from "@/services/masters/vendor-service"
import { productService } from "@/services/masters/product-service"
import { FuelSetup, FuelSetupFormData } from "@/types/tax-charges/fuel-setup"

const fuelSetupSchema = z.object({
    entryCode: z.preprocess((val) => Number(val), z.number().min(1, "Entry Code is required")),
    customer: z.string().min(1, "Customer is required"),
    vendor: z.string().min(1, "Vendor is required"),
    product: z.string().min(1, "Product is required"),
    destination: z.string().min(1, "Destination is required"),
    service: z.enum(['AIR', 'SURFACE', 'EXPRESS', 'STANDARD']),
    fromDate: z.string().min(1, "From Date is required"),
    toDate: z.string().min(1, "To Date is required"),
    percentage: z.preprocess((val) => Number(val), z.number().min(0, "Percentage must be a positive number")),
})

interface FuelSetupFormProps {
    initialData?: FuelSetup | null
}

export function FuelSetupForm({ initialData }: FuelSetupFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEditing = !!initialData

    const [customerOpen, setCustomerOpen] = useState(false)
    const [vendorOpen, setVendorOpen] = useState(false)
    const [productOpen, setProductOpen] = useState(false)

    // Data Fetching
    const { data: customers } = useQuery({
        queryKey: ["customers-list"],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
    })

    const { data: vendors } = useQuery({
        queryKey: ["vendors-list"],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const { data: products } = useQuery({
        queryKey: ["products-list"],
        queryFn: () => productService.getProducts({ limit: 100 }),
    })

    const form = useForm<FuelSetupFormData>({
        resolver: zodResolver(fuelSetupSchema) as any,
        defaultValues: {
            entryCode: 0,
            customer: "CARD",
            vendor: "CARD",
            product: "CARD",
            destination: "CARD",
            service: "SURFACE",
            fromDate: format(new Date(), "yyyy-MM-dd"),
            toDate: format(new Date("2050-12-31"), "yyyy-MM-dd"),
            percentage: 0,
        },
        values: initialData ? {
            entryCode: Number(initialData.entryCode) || 0,
            customer: initialData.customer,
            vendor: initialData.vendor,
            product: initialData.product,
            destination: initialData.destination,
            service: initialData.service,
            fromDate: initialData.fromDate ? format(new Date(initialData.fromDate), "yyyy-MM-dd") : "",
            toDate: initialData.toDate ? format(new Date(initialData.toDate), "yyyy-MM-dd") : "",
            percentage: Number(initialData.percentage) || 0,
        } : undefined
    })

    const mutation = useMutation({
        mutationFn: (data: FuelSetupFormData) => {
            if (isEditing && initialData) {
                return fuelSetupService.updateFuelSetup(initialData.id, data)
            }
            return fuelSetupService.createFuelSetup(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fuel-setups"] })
            if (isEditing && initialData) {
                queryClient.invalidateQueries({ queryKey: ["fuel-setup", Number(initialData.id)] })
            }
            toast.success(`Fuel setup ${isEditing ? "updated" : "created"} successfully`)
            router.push("/tax-charges/fuel-setup")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEditing ? "update" : "create"} fuel setup`)
        },
    })

    const onSubmit = (data: FuelSetupFormData) => {
        mutation.mutate(data)
    }

    const onInvalid = (errors: any) => {
        console.error("Form Validation Errors:", errors)
        const errorMessages = Object.entries(errors)
            .map(([field, error]: [string, any]) => `${field}: ${error.message}`)
            .join(", ")
        toast.error(`Validation Error: ${errorMessages || "Please check the form"}`)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="entryCode"
                        render={({ field }) => (
                            <FloatingFormItem label="Entry Code">
                                <FormControl>
                                    <Input type="number" placeholder="Entry Code" {...field} disabled={isEditing} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="customer"
                        render={({ field }) => (
                            <FloatingFormItem label="Customer">
                                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={isEditing}
                                            >
                                                {field.value || "Select customer"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search customer..." />
                                            <CommandList>
                                                <CommandEmpty>No customer found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="CARD"
                                                        onSelect={() => {
                                                            form.setValue("customer", "CARD")
                                                            setCustomerOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value === "CARD" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        CARD
                                                    </CommandItem>
                                                    {customers?.data?.map((item) => (
                                                        <CommandItem
                                                            key={item.id}
                                                            value={item.code}
                                                            onSelect={() => {
                                                                form.setValue("customer", item.code)
                                                                setCustomerOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === item.code ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {item.name} ({item.code})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="vendor"
                        render={({ field }) => (
                            <FloatingFormItem label="Vendor">
                                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={isEditing}
                                            >
                                                {field.value || "Select vendor"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search vendor..." />
                                            <CommandList>
                                                <CommandEmpty>No vendor found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="CARD"
                                                        onSelect={() => {
                                                            form.setValue("vendor", "CARD")
                                                            setVendorOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value === "CARD" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        CARD
                                                    </CommandItem>
                                                    {vendors?.data?.map((item) => (
                                                        <CommandItem
                                                            key={item.id}
                                                            value={item.vendorCode}
                                                            onSelect={() => {
                                                                form.setValue("vendor", item.vendorCode)
                                                                setVendorOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === item.vendorCode ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {item.vendorName} ({item.vendorCode})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="product"
                        render={({ field }) => (
                            <FloatingFormItem label="Product">
                                <Popover open={productOpen} onOpenChange={setProductOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={isEditing}
                                            >
                                                {field.value || "Select product"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search product..." />
                                            <CommandList>
                                                <CommandEmpty>No product found.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="CARD"
                                                        onSelect={() => {
                                                            form.setValue("product", "CARD")
                                                            setProductOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value === "CARD" ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        CARD
                                                    </CommandItem>
                                                    {products?.data?.map((item) => (
                                                        <CommandItem
                                                            key={item.id}
                                                            value={item.productCode}
                                                            onSelect={() => {
                                                                form.setValue("product", item.productCode)
                                                                setProductOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === item.productCode ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {item.productName} ({item.productCode})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                            <FloatingFormItem label="Destination">
                                <FormControl>
                                    <Input placeholder="Destination Code" {...field} disabled={isEditing} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="service"
                        render={({ field }) => (
                            <FloatingFormItem label="Service">
                                <Select 
                                    key={field.value}
                                    onValueChange={field.onChange} 
                                    value={field.value} 
                                    disabled={isEditing}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select service" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="AIR">AIR</SelectItem>
                                        <SelectItem value="SURFACE">SURFACE</SelectItem>
                                        <SelectItem value="EXPRESS">EXPRESS</SelectItem>
                                        <SelectItem value="STANDARD">STANDARD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />

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

                    <FormField
                        control={form.control}
                        name="percentage"
                        render={({ field }) => (
                            <FloatingFormItem label="Percentage (%)">
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push("/tax-charges/fuel-setup")}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
