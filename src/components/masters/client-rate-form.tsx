"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_COMBO,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormSection } from "@/components/ui/form-section"
import { clientRateService } from '@/services/masters/client-rate-service'
import { customerService } from '@/services/masters/customer-service'
import { productService } from '@/services/masters/product-service'
import { countryService } from '@/services/masters/country-service'
import { vendorService } from '@/services/masters/vendor-service'
import { zoneService } from '@/services/masters/zone-service'
import { ClientRate } from '@/types/masters/client-rate'

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

interface ClientRateFormProps {
    initialData?: ClientRate | null
}

export function ClientRateForm({ initialData }: ClientRateFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const [customerOpen, setCustomerOpen] = useState(false)
    const [productOpen, setProductOpen] = useState(false)
    const [countryOpen, setCountryOpen] = useState(false)
    const [vendorOpen, setVendorOpen] = useState(false)
    const [zoneOpen, setZoneOpen] = useState(false)

    // Data fetching for ComboBoxes
    const { data: customersData } = useQuery({
        queryKey: ['customers-list'],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
    })
    const { data: productsData } = useQuery({
        queryKey: ['products-list'],
        queryFn: () => productService.getProducts({ limit: 100 }),
    })
    const { data: countriesData } = useQuery({
        queryKey: ['countries-list'],
        queryFn: () => countryService.getCountries({ limit: 100 }),
    })
    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })
    const { data: zonesData } = useQuery({
        queryKey: ['zones-list'],
        queryFn: () => zoneService.getZones({ limit: 100 }),
    })

    const form = useForm<ClientRateFormValues>({
        resolver: zodResolver(clientRateSchema) as Resolver<ClientRateFormValues>,
        defaultValues: {
            fromDate: initialData?.fromDate ? new Date(initialData.fromDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            customerCode: initialData?.customer?.code || '',
            origin: initialData?.origin || '',
            vendorCode: initialData?.vendor?.vendorCode || '',
            productCode: initialData?.product?.productCode || '',
            zoneCode: initialData?.zone?.zoneCode || '',
            countryCode: initialData?.country?.code || '',
            destination: initialData?.destination || '',
            service: (initialData?.service as any) || 'AIR',
            contractNo: initialData?.contractNo || '',
            rateValue: initialData?.rateValue ? (typeof initialData.rateValue === 'string' ? parseFloat(initialData.rateValue) : initialData.rateValue) : 0,
        }
    })

    useEffect(() => {
        if (initialData && customersData?.data && productsData?.data && countriesData?.data && vendorsData?.data && zonesData?.data) {
            // Map IDs to codes from the fetched lists if nested objects are missing
            // Note: Different entities use different field names for their 'code' (code vs productCode vs vendorCode)
            const getCustomerCode = () => initialData.customer?.code || customersData.data.find(c => c.id === initialData.customerId)?.code || '';
            const getVendorCode = () => initialData.vendor?.vendorCode || vendorsData.data.find(v => v.id === initialData.vendorId)?.vendorCode || '';
            const getProductCode = () => initialData.product?.productCode || productsData.data.find(p => p.id === initialData.productId)?.productCode || '';
            const getZoneCode = () => initialData.zone?.zoneCode || zonesData.data.find(z => z.id === initialData.zoneId)?.code || '';
            const getCountryCode = () => initialData.country?.code || countriesData.data.find(c => c.id === initialData.countryId)?.code || '';

            form.reset({
                fromDate: initialData.fromDate ? new Date(initialData.fromDate).toISOString().split('T')[0] : '',
                customerCode: getCustomerCode(),
                origin: initialData.origin || '',
                vendorCode: getVendorCode(),
                productCode: getProductCode(),
                zoneCode: getZoneCode(),
                countryCode: getCountryCode(),
                destination: initialData.destination || '',
                service: (initialData.service as any) || 'AIR',
                contractNo: initialData.contractNo || '',
                rateValue: typeof initialData.rateValue === 'string' ? parseFloat(initialData.rateValue) : initialData.rateValue,
            })
        }
    }, [initialData, form, customersData, productsData, countriesData, vendorsData, zonesData])

    const mutation = useMutation({
        mutationFn: (values: ClientRateFormValues) =>
            isEdit
                ? clientRateService.updateClientRate(initialData!.id, values as any)
                : clientRateService.createClientRate(values as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client-rates'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['client-rate', initialData.id] })
            }
            toast.success(`Client rate ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/client-rates')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} client rate`)
        }
    })

    const onSubmit = (values: ClientRateFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contract & Agreement Information */}
                    <FormSection title="Contract & Agreement" contentClassName="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fromDate"
                                    render={({ field }) => (
                                        <FloatingFormItem label="From Date">
                                            <FormControl>
                                                <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contractNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Contract No">
                                            <FormControl>
                                                <Input placeholder="Agreement #" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="customerCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Customer" itemClassName="flex flex-col">
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
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? customersData?.data?.find(c => c.code === field.value)?.name
                                                                : "Select customer..."}
                                                        </span>
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
                                                                    key={cust.id}
                                                                    value={cust.code}
                                                                    onSelect={() => {
                                                                        form.setValue("customerCode", cust.code)
                                                                        setCustomerOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === cust.code ? "opacity-100" : "opacity-0")} />
                                                                    {cust.name} ({cust.code})
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
                    </FormSection>

                    {/* Commercials Information */}
                    <FormSection title="Commercials" contentClassName="space-y-4">
                            <FormField
                                control={form.control}
                                name="vendorCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Vendor / Carrier" itemClassName="flex flex-col">
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
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? vendorsData?.data?.find((v: any) => v.vendorCode === field.value)?.vendorName
                                                                : "Select vendor..."}
                                                        </span>
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
                                                                    key={v.id}
                                                                    value={v.vendorCode}
                                                                    onSelect={() => {
                                                                        form.setValue("vendorCode", v.vendorCode)
                                                                        setVendorOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === v.vendorCode ? "opacity-100" : "opacity-0")} />
                                                                    {v.vendorName} ({v.vendorCode})
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
                                name="rateValue"
                                render={({ field }) => (
                                    <FloatingFormItem label="Rate Value">
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className={FLOATING_INNER_CONTROL}
                                                {...field}
                                                value={field.value === undefined || field.value === null ? "" : field.value}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value === "" ? undefined : parseFloat(e.target.value)
                                                    )
                                                }
                                            />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* Routing & Service Matrix */}
                    <FormSection
                        className="md:col-span-2"
                        title="Routing & Service Matrix"
                        contentClassName="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                            <FormField
                                control={form.control}
                                name="productCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Product" itemClassName="flex flex-col">
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
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? productsData?.data?.find(p => p.productCode === field.value)?.productName
                                                                : "Select product..."}
                                                        </span>
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
                                                                    key={prod.id}
                                                                    value={prod.productCode}
                                                                    onSelect={() => {
                                                                        form.setValue("productCode", prod.productCode)
                                                                        setProductOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === prod.productCode ? "opacity-100" : "opacity-0")} />
                                                                    {prod.productName}
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
                                name="service"
                                render={({ field }) => (
                                    <FloatingFormItem label="Service Mode">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select mode" />
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
                                name="zoneCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Zone" itemClassName="flex flex-col">
                                        <Popover open={zoneOpen} onOpenChange={setZoneOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            FLOATING_INNER_COMBO,
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? zonesData?.data?.find((z: any) => z.code === field.value)?.name
                                                                : "Select zone..."}
                                                        </span>
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
                                                                    key={z.id}
                                                                    value={z.code}
                                                                    onSelect={() => {
                                                                        form.setValue("zoneCode", z.code)
                                                                        setZoneOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === z.code ? "opacity-100" : "opacity-0")} />
                                                                    {z.name} ({z.code})
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
                                name="countryCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Country" itemClassName="flex flex-col">
                                        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            FLOATING_INNER_COMBO,
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? countriesData?.data?.find(c => c.code === field.value)?.name
                                                                : "Select country..."}
                                                        </span>
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
                                                                    key={c.id}
                                                                    value={c.code}
                                                                    onSelect={() => {
                                                                        form.setValue("countryCode", c.code)
                                                                        setCountryOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === c.code ? "opacity-100" : "opacity-0")} />
                                                                    {c.name}
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
                                name="origin"
                                render={({ field }) => (
                                    <FloatingFormItem label="Origin City">
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Mumbai" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="destination"
                                render={({ field }) => (
                                    <FloatingFormItem label="Destination City">
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. New York" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/client-rates')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Rate' : 'Create Rate'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
