"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { ServiceMap } from '@/types/masters/service-map'

const serviceMapSchema = z.object({
    vendorId: z.coerce.number().min(1, "Vendor is required"),
    serviceType: z.enum(['AIR', 'SURFACE', 'EXPRESS']),
    minWeight: z.coerce.number().min(0, "Min weight must be at least 0"),
    maxWeight: z.coerce.number().min(0, "Max weight must be at least 0"),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    vendorLink: z.string().optional().or(z.literal('')),
    isSinglePiece: z.boolean(),
})

type ServiceMapFormValues = z.infer<typeof serviceMapSchema>
type ServiceMapPayload = ServiceMapFormValues

interface ServiceMapFormProps {
    initialData?: ServiceMap | null
}

export function ServiceMapForm({ initialData }: ServiceMapFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [vendorOpen, setVendorOpen] = useState(false)

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const form = useForm<ServiceMapFormValues>({
        resolver: zodResolver(serviceMapSchema) as Resolver<ServiceMapFormValues>,
        defaultValues: {
            vendorId: 0,
            serviceType: 'EXPRESS',
            minWeight: 0,
            maxWeight: 0,
            status: 'ACTIVE',
            vendorLink: '',
            isSinglePiece: false,
        },
        values: initialData ? {
            vendorId: initialData.vendorId || 0,
            serviceType: initialData.serviceType as any,
            minWeight: Number(initialData.minWeight),
            maxWeight: Number(initialData.maxWeight),
            status: initialData.status as any,
            vendorLink: initialData.vendorLink || '',
            isSinglePiece: initialData.isSinglePiece,
        } : undefined
    })

    const mutation = useMutation({
        mutationFn: (data: ServiceMapPayload) => {
            if (isEdit && initialData) {
                return serviceMapService.updateServiceMap(initialData.id, data)
            }
            return serviceMapService.createServiceMap(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-maps'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['service-map', initialData.id] })
            }
            toast.success(`Service Map ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/service-map')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} service map`)
        }
    })

    function onSubmit(data: ServiceMapFormValues) {
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
                        name="vendorId"
                        render={({ field }) => (
                            <FloatingFormItem label="Vendor" itemClassName="flex flex-col">
                                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    (!field.value || field.value <= 0) && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {field.value && field.value > 0
                                                        ? vendorsData?.data?.find(
                                                            (vendor) => vendor.id === field.value
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
                                                                form.setValue("vendorId", vendor.id)
                                                                setVendorOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    vendor.id === field.value
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
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => (
                            <FloatingFormItem label="Service Type">
                                <Select
                                    key={field.value}
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select service" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="EXPRESS">EXPRESS</SelectItem>
                                        <SelectItem value="SURFACE">SURFACE</SelectItem>
                                        <SelectItem value="AIR">AIR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <FormField
                            control={form.control}
                            name="minWeight"
                            render={({ field }) => (
                                <FloatingFormItem label="Min Weight (kg)">
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="maxWeight"
                            render={({ field }) => (
                                <FloatingFormItem label="Max Weight (kg)">
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="vendorLink"
                        render={({ field }) => (
                            <FloatingFormItem label="Vendor Tracking Link">
                                <FormControl>
                                    <Input
                                        placeholder="https://vendor.com/track"
                                        {...field}
                                        className={FLOATING_INNER_CONTROL}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FloatingFormItem label="Status">
                                    <Select
                                        key={field.value}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isSinglePiece"
                            render={({ field }) => (
                                <FloatingFormItem label="Single Piece Only">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/service-map')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Service Map" : "Create Service Map"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
