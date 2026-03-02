"use client"

import { useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
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
import { Checkbox } from "@/components/ui/checkbox"
import { serviceMapService } from '@/services/masters/service-map-service'
import { vendorService } from '@/services/masters/vendor-service'
import { ServiceMap, ServiceMapFormData } from '@/types/masters/service-map'

const serviceMapSchema = z.object({
    vendor: z.string().min(1, "Vendor is required"),
    serviceType: z.string().min(1, "Service type is required"),
    billingVendor: z.string().min(1, "Billing vendor is required"),
    minWeight: z.coerce.number().min(0, "Min weight must be at least 0"),
    maxWeight: z.coerce.number().min(0, "Max weight must be at least 0"),
    status: z.string().min(1, "Status is required"),
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

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ServiceMapFormValues>({
        resolver: zodResolver(serviceMapSchema) as Resolver<ServiceMapFormValues>,
        defaultValues: {
            vendor: '',
            serviceType: 'Express',
            billingVendor: '',
            minWeight: 0,
            maxWeight: 0,
            status: 'Active',
            vendorLink: '',
            isSinglePiece: false,
        }
    })

    useEffect(() => {
        if (serviceMap) {
            form.reset({
                vendor: serviceMap.vendor,
                serviceType: serviceMap.serviceType,
                billingVendor: serviceMap.billingVendor,
                minWeight: Number(serviceMap.minWeight),
                maxWeight: Number(serviceMap.maxWeight),
                status: serviceMap.status,
                vendorLink: serviceMap.vendorLink || '',
                isSinglePiece: serviceMap.isSinglePiece,
            })
        } else {
            form.reset({
                vendor: '',
                serviceType: 'Express',
                billingVendor: '',
                minWeight: 0,
                maxWeight: 0,
                status: 'Active',
                vendorLink: '',
                isSinglePiece: false,
            })
        }
    }, [serviceMap, form])

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
                                    name="vendor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select vendor" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {vendorsData?.data?.map((vendor) => (
                                                        <SelectItem key={vendor.id} value={vendor.vendorName}>
                                                            {vendor.vendorName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                                    <SelectItem value="Express">Express</SelectItem>
                                                    <SelectItem value="Surface">Surface</SelectItem>
                                                    <SelectItem value="Air">Air</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="billingVendor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Billing Vendor</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select billing vendor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {vendorsData?.data?.map((vendor) => (
                                                    <SelectItem key={vendor.id} value={vendor.vendorName}>
                                                        {vendor.vendorName}
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
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Inactive">Inactive</SelectItem>
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
