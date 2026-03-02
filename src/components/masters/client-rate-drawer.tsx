"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { clientRateService } from '@/services/masters/client-rate-service'
import { customerService } from '@/services/masters/customer-service'
import { productService } from '@/services/masters/product-service'
import { countryService } from '@/services/masters/country-service'
import { ClientRate, ClientRateFormData } from '@/types/masters/client-rate'

const clientRateSchema = z.object({
    fromDate: z.string().min(1, "From date is required"),
    customer: z.string().min(1, "Customer is required"),
    origin: z.string().min(1, "Origin is required"),
    vendor: z.string().min(1, "Vendor is required"),
    product: z.string().min(1, "Product is required"),
    zone: z.string().min(1, "Zone is required"),
    country: z.string().min(1, "Country is required"),
    destination: z.string().min(1, "Destination is required"),
    service: z.string().min(1, "Service is required"),
    contractNo: z.string().min(1, "Contract No is required"),
    rateValue: z.number().min(0, "Rate must be positive"),
})

interface ClientRateDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    rate?: ClientRate | null
}

export function ClientRateDrawer({ open, onOpenChange, rate }: ClientRateDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!rate

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

    const form = useForm<ClientRateFormData>({
        resolver: zodResolver(clientRateSchema),
        defaultValues: {
            fromDate: '',
            customer: '',
            origin: '',
            vendor: '',
            product: '',
            zone: '',
            country: '',
            destination: '',
            service: '',
            contractNo: '',
            rateValue: 0,
        }
    })

    useEffect(() => {
        if (rate) {
            form.reset({
                fromDate: rate.fromDate || '',
                customer: rate.customer || '',
                origin: rate.origin || '',
                vendor: rate.vendor || '',
                product: rate.product || '',
                zone: rate.zone || '',
                country: rate.country || '',
                destination: rate.destination || '',
                service: rate.service || '',
                contractNo: rate.contractNo || '',
                rateValue: typeof rate.rateValue === 'string' ? parseFloat(rate.rateValue) : rate.rateValue,
            })
        } else {
            form.reset({
                fromDate: new Date().toISOString().split('T')[0],
                customer: '',
                origin: '',
                vendor: '',
                product: '',
                zone: '',
                country: '',
                destination: '',
                service: '',
                contractNo: '',
                rateValue: 0,
            })
        }
    }, [rate, form])

    const mutation = useMutation({
        mutationFn: (data: ClientRateFormData) => {
            if (isEdit && rate) {
                return clientRateService.updateClientRate(rate.id, data)
            }
            return clientRateService.createClientRate(data)
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

    function onSubmit(data: ClientRateFormData) {
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
                                name="customer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {customersData?.data?.map((cust) => (
                                                    <SelectItem key={cust.id} value={cust.name}>
                                                        {cust.name} ({cust.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    name="product"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {productsData?.data?.map((prod) => (
                                                        <SelectItem key={prod.id} value={prod.productName}>
                                                            {prod.productName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="service"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Express, Economy" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
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
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select country" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {countriesData?.data?.map((c) => (
                                                        <SelectItem key={c.id} value={c.name}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="zone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. USA East, UK South" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    name="vendor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Vendor name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
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
