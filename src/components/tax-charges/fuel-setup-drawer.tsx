import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

import { fuelSetupService } from "@/services/tax-charges/fuel-setup-service"
import { customerService } from "@/services/masters/customer-service"
import { vendorService } from "@/services/masters/vendor-service"
import { productService } from "@/services/masters/product-service"
import { FuelSetup, FuelSetupFormData, FuelServiceType } from "@/types/tax-charges/fuel-setup"

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

interface FuelSetupDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    fuelSetup?: FuelSetup | null
}

export function FuelSetupDrawer({
    open,
    onOpenChange,
    fuelSetup,
}: FuelSetupDrawerProps) {
    const queryClient = useQueryClient()
    const isEditing = !!fuelSetup

    const [customerOpen, setCustomerOpen] = useState(false)
    const [vendorOpen, setVendorOpen] = useState(false)
    const [productOpen, setProductOpen] = useState(false)

    // Data Fetching
    const { data: customers } = useQuery({
        queryKey: ["customers-list"],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
        enabled: open,
    })

    const { data: vendors } = useQuery({
        queryKey: ["vendors-list"],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
        enabled: open,
    })

    const { data: products } = useQuery({
        queryKey: ["products-list"],
        queryFn: () => productService.getProducts({ limit: 100 }),
        enabled: open,
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
    })

    useEffect(() => {
        if (fuelSetup && open) {
            form.reset({
                entryCode: Number(fuelSetup.entryCode) || 0,
                customer: fuelSetup.customer,
                vendor: fuelSetup.vendor,
                product: fuelSetup.product,
                destination: fuelSetup.destination,
                service: fuelSetup.service,
                fromDate: fuelSetup.fromDate ? format(new Date(fuelSetup.fromDate), "yyyy-MM-dd") : "",
                toDate: fuelSetup.toDate ? format(new Date(fuelSetup.toDate), "yyyy-MM-dd") : "",
                percentage: Number(fuelSetup.percentage) || 0,
            })
        } else if (!open) {
            form.reset({
                entryCode: 0,
                customer: "CARD",
                vendor: "CARD",
                product: "CARD",
                destination: "CARD",
                service: "SURFACE",
                fromDate: format(new Date(), "yyyy-MM-dd"),
                toDate: format(new Date("2050-12-31"), "yyyy-MM-dd"),
                percentage: 0,
            })
        }
    }, [fuelSetup, open, form])

    const createMutation = useMutation({
        mutationFn: (data: FuelSetupFormData) => fuelSetupService.createFuelSetup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fuel-setups"] })
            toast.success("Fuel setup created successfully")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create fuel setup")
        },
    })

    const updateMutation = useMutation({
        mutationFn: (data: FuelSetupFormData) => {
            if (!fuelSetup) throw new Error("No fuel setup selected")
            return fuelSetupService.updateFuelSetup(fuelSetup.id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fuel-setups"] })
            toast.success("Fuel setup updated successfully")
            onOpenChange(false)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update fuel setup")
        },
    })

    const onSubmit = (data: FuelSetupFormData) => {
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
                    <SheetTitle>{isEditing ? "Edit Fuel Setup" : "Create Fuel Setup"}</SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? "Update the details of the fuel setup here."
                            : "Add a new fuel setup to the system."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                        <div className="space-y-4 px-6 pb-6">
                            <FormField
                                control={form.control}
                                name="entryCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Entry Code</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Entry Code" {...field} disabled={isEditing} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="customer"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Customer</FormLabel>
                                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal",
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vendor"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Vendor</FormLabel>
                                            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="product"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Product</FormLabel>
                                            <Popover open={productOpen} onOpenChange={setProductOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Destination Code" {...field} disabled={isEditing} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="service"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                                                <FormControl>
                                                    <SelectTrigger>
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
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fromDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} disabled={isEditing} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="toDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} disabled={isEditing} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="percentage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Percentage (%)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
