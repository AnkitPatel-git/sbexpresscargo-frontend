"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"
import { serviceMapService } from '@/services/masters/service-map-service'
import { vendorService } from '@/services/masters/vendor-service'
import { ServiceMap, ServiceMapFormData } from '@/types/masters/service-map'

const serviceMapSchema = z.object({
    vendorCode: z.string().min(1, "Vendor is required"),
    serviceType: z.enum(['AIR', 'SURFACE', 'EXPRESS']),
    billingVendorCode: z.string().min(1, "Billing vendor is required"),
    minWeight: z.coerce.number().min(0, "Min weight must be at least 0"),
    maxWeight: z.coerce.number().min(0, "Max weight must be at least 0"),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    vendorLink: z.string().optional().or(z.literal('')),
    isSinglePiece: z.boolean(),
})

type ServiceMapFormValues = z.infer<typeof serviceMapSchema>

interface ServiceMapDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    serviceMap?: ServiceMap | null
}

export function ServiceMapDrawer({ open, onOpenChange, serviceMap }: ServiceMapDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!serviceMap
    const [vendorOpen, setVendorOpen] = useState(false)
    const [billingVendorOpen, setBillingVendorOpen] = useState(false)

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ServiceMapFormValues>({
        resolver: zodResolver(serviceMapSchema) as Resolver<ServiceMapFormValues>,
        defaultValues: {
            vendorCode: '',
            serviceType: 'EXPRESS',
            billingVendorCode: '',
            minWeight: 0,
            maxWeight: 0,
            status: 'ACTIVE',
            vendorLink: '',
            isSinglePiece: false,
        }
    })

    useEffect(() => {
        if (serviceMap) {
            // Find vendor codes by ID from the vendors list
            const vendor = vendorsData?.data?.find(v => v.id === serviceMap.vendorId)
            const billingVendor = vendorsData?.data?.find(v => v.id === serviceMap.billingVendorId)

            form.reset({
                vendorCode: vendor?.vendorCode || '',
                serviceType: serviceMap.serviceType,
                billingVendorCode: billingVendor?.vendorCode || '',
                minWeight: Number(serviceMap.minWeight),
                maxWeight: Number(serviceMap.maxWeight),
                status: serviceMap.status,
                vendorLink: serviceMap.vendorLink || '',
                isSinglePiece: serviceMap.isSinglePiece,
            })
        } else {
            form.reset({
                vendorCode: '',
                serviceType: 'EXPRESS',
                billingVendorCode: '',
                minWeight: 0,
                maxWeight: 0,
                status: 'ACTIVE',
                vendorLink: '',
                isSinglePiece: false,
            })
        }
    }, [serviceMap, form, vendorsData])

    const mutation = useMutation({
        mutationFn: (data: ServiceMapFormValues) => {
            if (isEdit && serviceMap) {
                return serviceMapService.updateServiceMap(serviceMap.id, data)
            }
            return serviceMapService.createServiceMap(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-maps'] })
            toast.success(`Service Map ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} service map`)
        }
    })

    function onSubmit(data: ServiceMapFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Service Map" : "Create Service Map"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the service map details below." : "Enter the details for the new service map."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-10">
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
                                                            <span className="truncate">
                                                                {field.value
                                                                    ? vendorsData?.data?.find(
                                                                        (vendor) => vendor.vendorCode === field.value
                                                                    )?.vendorName
                                                                    : "Select vendor"}
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
                                                                {vendorsData?.data?.map((vendor) => (
                                                                    <CommandItem
                                                                        key={vendor.id}
                                                                        value={vendor.vendorName}
                                                                        onSelect={() => {
                                                                            form.setValue("vendorCode", vendor.vendorCode)
                                                                            setVendorOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                vendor.vendorCode === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {vendor.vendorName} ({vendor.vendorCode})
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
                                    name="serviceType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select service" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="EXPRESS">EXPRESS</SelectItem>
                                                    <SelectItem value="SURFACE">SURFACE</SelectItem>
                                                    <SelectItem value="AIR">AIR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="billingVendorCode"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Billing Vendor</FormLabel>
                                        <Popover open={billingVendorOpen} onOpenChange={setBillingVendorOpen}>
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
                                                        <span className="truncate">
                                                            {field.value
                                                                ? vendorsData?.data?.find(
                                                                    (vendor) => vendor.vendorCode === field.value
                                                                )?.vendorName
                                                                : "Select billing vendor"}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search billing vendor..." />
                                                    <CommandList>
                                                        <CommandEmpty>No vendor found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {vendorsData?.data?.map((vendor) => (
                                                                <CommandItem
                                                                    key={vendor.id}
                                                                    value={vendor.vendorName}
                                                                    onSelect={() => {
                                                                        form.setValue("billingVendorCode", vendor.vendorCode)
                                                                        setBillingVendorOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            vendor.vendorCode === field.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {vendor.vendorName} ({vendor.vendorCode})
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
                                    name="minWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="vendorLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendor Tracking Link</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://vendor.com/track" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="isSinglePiece"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 mt-8 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Single Piece Only</FormLabel>
                                            </div>
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Service Map" : "Create Service Map"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
