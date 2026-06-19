"use client"

import { useState, useMemo } from 'react'
import { FieldErrors, Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
import { optionLabelForSelect, SERVICE_MAP_STATUS_OPTIONS } from "@/lib/select-closed-label"
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
import { serviceMapService } from '@/services/masters/service-map-service'
import { vendorService } from '@/services/masters/vendor-service'
import { ServiceMap } from '@/types/masters/service-map'

const serviceMapSchema = z.object({
    vendorId: z.coerce.number().min(1, "Vendor is required"),
    serviceType: z.string().trim().min(1, "Service type is required").max(255),
    weightUnit: z.enum(['G', 'KG']),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    vendorLink: z.string().optional().or(z.literal('')),
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
    const [pickedVendor, setPickedVendor] = useState<{
        id: number
        vendorName: string
        vendorCode: string
    } | null>(() =>
        initialData?.vendorId && initialData.vendor
            ? {
                  id: initialData.vendorId,
                  vendorName: initialData.vendor.vendorName,
                  vendorCode: initialData.vendor.vendorCode,
              }
            : null,
    )

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const form = useForm<ServiceMapFormValues>({
        resolver: zodResolver(serviceMapSchema) as Resolver<ServiceMapFormValues>,
        defaultValues: {
            vendorId: 0,
            serviceType: '',
            weightUnit: 'KG',
            status: 'ACTIVE',
            vendorLink: '',
        },
        values: initialData ? {
            vendorId: initialData.vendorId || 0,
            serviceType: initialData.serviceType,
            weightUnit: initialData.weightUnit ?? 'KG',
            status: initialData.status,
            vendorLink: initialData.vendorLink || '',
        } : undefined
    })

    const selectedVendorId = form.watch('vendorId')

    const selectedVendorLabel = useMemo(() => {
        if (pickedVendor && pickedVendor.id === selectedVendorId) {
            return `${pickedVendor.vendorName} (${pickedVendor.vendorCode})`
        }
        const fromList = vendorsData?.data?.find((v) => v.id === selectedVendorId)
        if (fromList) {
            return `${fromList.vendorName} (${fromList.vendorCode})`
        }
        return null
    }, [pickedVendor, selectedVendorId, vendorsData?.data])

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
        mutation.mutate({
            ...data,
            serviceType: data.serviceType.trim(),
        })
    }

    const onInvalid = (errors: FieldErrors<ServiceMapFormValues>) => {
        const errorMessages = Object.entries(errors)
            .map(([field, error]) => `${field}: ${error?.message ?? 'Invalid value'}`)
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
                                                        ? selectedVendorLabel ?? "Select vendor"
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
                                                                setPickedVendor({
                                                                    id: vendor.id,
                                                                    vendorName: vendor.vendorName,
                                                                    vendorCode: vendor.vendorCode,
                                                                })
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
                                <FormControl>
                                    <Input
                                        placeholder="e.g. Express Delhi"
                                        {...field}
                                        className={FLOATING_INNER_CONTROL}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="weightUnit"
                        render={({ field }) => (
                            <FloatingFormItem label="Booking Weight Unit">
                                <Select
                                    key={`weightUnit-${field.value}`}
                                    onValueChange={field.onChange}
                                    value={field.value || "KG"}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select unit">
                                                {field.value === "G" ? "Grams (g)" : "Kilograms (kg)"}
                                            </SelectValue>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="KG">Kilograms (kg)</SelectItem>
                                        <SelectItem value="G">Grams (g)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />

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
                                            <SelectValue placeholder="Select status">
                                                {optionLabelForSelect(field.value, SERVICE_MAP_STATUS_OPTIONS)}
                                            </SelectValue>
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
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="expressDanger"
                        onClick={() => router.push('/masters/service-map')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Service Map" : "Create Service Map"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
