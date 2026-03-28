"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { clientRateService } from '@/services/masters/client-rate-service'
import { customerService } from '@/services/masters/customer-service'
import { productService } from '@/services/masters/product-service'
import { countryService } from '@/services/masters/country-service'
import { vendorService } from '@/services/masters/vendor-service'
import { zoneService } from '@/services/masters/zone-service'
import { ClientRate, ClientRateFormData } from '@/types/masters/client-rate'

const clientRateSchema = z.object({
    fromDate: z.string().min(1, "From date is required"),
    customerCode: z.string().min(1, "Customer is required"),
    origin: z.string().min(1, "Origin is required"),
    vendorCode: z.string().min(1, "Vendor is required"),
    productCode: z.string().min(1, "Product is required"),
    zoneCode: z.string().min(1, "Zone is required"),
    countryCode: z.string().min(1, "Country is required"),
    destination: z.string().min(1, "Destination is required"),
    service: z.enum(['AIR', 'SURFACE', 'EXPRESS', 'STANDARD'], {
        message: "Please select a valid service"
    }),
    contractNo: z.string().min(1, "Contract No is required"),
    rateValue: z.number().min(0, "Rate must be positive"),
})

type ClientRateFormValues = z.infer<typeof clientRateSchema>

interface ClientRateDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    rate?: ClientRate | null
}

export function ClientRateDrawer({ open, onOpenChange, rate }: ClientRateDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!rate
    const [customerOpen, setCustomerOpen] = useState(false)
    const [productOpen, setProductOpen] = useState(false)
    const [countryOpen, setCountryOpen] = useState(false)
    const [vendorOpen, setVendorOpen] = useState(false)
    const [zoneOpen, setZoneOpen] = useState(false)

    const { data: customersData } = useQuery({
        queryKey: ['customers-list'],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
        enabled: open
    })

    const { data: productsData } = useQuery({
        queryKey: ['products-list'],
        queryFn: () => productService.getProducts({ limit: 100 }),
        enabled: open
    })

    const { data: countriesData } = useQuery({
        queryKey: ['countries-list'],
        queryFn: () => countryService.getCountries({ limit: 100 }),
        enabled: open
    })

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
        enabled: open
    })

    const { data: zonesData } = useQuery({
        queryKey: ['zones-list'],
        queryFn: () => zoneService.getZones({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ClientRateFormValues>({
        resolver: zodResolver(clientRateSchema) as any,
        defaultValues: {
            fromDate: '',
            customerCode: '',
            origin: '',
            vendorCode: '',
            productCode: '',
            zoneCode: '',
            countryCode: '',
            destination: '',
            service: 'AIR',
            contractNo: '',
            rateValue: 0,
        }
    })

    useEffect(() => {
        if (rate) {
            form.reset({
                fromDate: rate.fromDate ? new Date(rate.fromDate).toISOString().split('T')[0] : '',
                customerCode: rate.customer?.code || '',
                origin: rate.origin || '',
                vendorCode: rate.vendor?.vendorCode || '',
                productCode: rate.product?.productCode || '',
                zoneCode: rate.zone?.zoneCode || '',
                countryCode: rate.country?.code || '',
                destination: rate.destination || '',
                service: (rate.service as any) || 'AIR',
                contractNo: rate.contractNo || '',
                rateValue: typeof rate.rateValue === 'string' ? parseFloat(rate.rateValue) : rate.rateValue,
            })
        } else {
            form.reset({
                fromDate: new Date().toISOString().split('T')[0],
                customerCode: '',
                origin: '',
                vendorCode: '',
                productCode: '',
                zoneCode: '',
                countryCode: '',
                destination: '',
                service: 'AIR',
                contractNo: '',
                rateValue: 0,
            })
        }
    }, [rate, form, open])

    const mutation = useMutation({
        mutationFn: (data: ClientRateFormValues) => {
            if (isEdit && rate) {
                return clientRateService.updateClientRate(rate.id, data as any)
            }
            return clientRateService.createClientRate(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-rates'] })
            toast.success(`Client rate ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} client rate`)
        }
    })

    function onSubmit(data: ClientRateFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[700px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Client Rate" : "Create Client Rate"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the client rate details below." : "Enter the details for the new client rate."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fromDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contractNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contract No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contract number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="customerCode"
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
                                                    >
                                                        {field.value
                                                            ? customersData?.data?.find(
                                                                (cust) => cust.code === field.value
                                                            )?.name
                                                            : "Select customer"}
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
                                                            {customersData?.data?.map((cust) => (
                                                                <CommandItem
                                                                    value={cust.code}
                                                                    key={cust.id}
                                                                    onSelect={() => {
                                                                        form.setValue("customerCode", cust.code)
                                                                        setCustomerOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            cust.code === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {cust.name} ({cust.code})
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
                                    name="productCode"
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
                                                        >
                                                            {field.value
                                                                ? productsData?.data?.find(
                                                                    (prod) => prod.productCode === field.value
                                                                )?.productName
                                                                : "Select product"}
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
                                                                {productsData?.data?.map((prod) => (
                                                                    <CommandItem
                                                                        value={prod.productCode}
                                                                        key={prod.id}
                                                                        onSelect={() => {
                                                                            form.setValue("productCode", prod.productCode)
                                                                            setProductOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                prod.productCode === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {prod.productName}
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
                                    name="service"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select service type" />
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
                                    name="origin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Origin</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Origin city" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Destination city" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="countryCode"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Country</FormLabel>
                                            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? countriesData?.data?.find(
                                                                    (c) => c.code === field.value
                                                                )?.name
                                                                : "Select country"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search country..." />
                                                        <CommandList>
                                                            <CommandEmpty>No country found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {countriesData?.data?.map((c) => (
                                                                    <CommandItem
                                                                        value={c.code}
                                                                        key={c.id}
                                                                        onSelect={() => {
                                                                            form.setValue("countryCode", c.code)
                                                                            setCountryOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                c.code === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {c.name}
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
                                    name="zoneCode"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Zone</FormLabel>
                                            <Popover open={zoneOpen} onOpenChange={setZoneOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? zonesData?.data?.find(
                                                                    (z) => z.code === field.value
                                                                )?.name
                                                                : "Select zone"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search zone..." />
                                                        <CommandList>
                                                            <CommandEmpty>No zone found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {zonesData?.data?.map((z: any) => (
                                                                    <CommandItem
                                                                        value={z.code}
                                                                        key={z.id}
                                                                        onSelect={() => {
                                                                            form.setValue("zoneCode", z.code)
                                                                            setZoneOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                z.code === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {z.name} ({z.code})
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
                                    name="vendorCode"
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
                                                        >
                                                            {field.value
                                                                ? vendorsData?.data?.find(
                                                                    (v) => v.vendorCode === field.value
                                                                )?.vendorName
                                                                : "Select vendor"}
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
                                                                {vendorsData?.data?.map((v: any) => (
                                                                    <CommandItem
                                                                        value={v.vendorCode}
                                                                        key={v.id}
                                                                        onSelect={() => {
                                                                            form.setValue("vendorCode", v.vendorCode)
                                                                            setVendorOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                v.vendorCode === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {v.vendorName} ({v.vendorCode})
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
                                    name="rateValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rate Value</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Rate" : "Create Rate"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
