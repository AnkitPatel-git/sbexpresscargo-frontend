"use client"

import { useEffect, useMemo } from 'react'
import { FieldErrors, Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { VendorFloatingAsyncSelect } from "@/components/masters/floating-master-async-selects"
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { IntegerInput } from "@/components/ui/integer-input"
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
import { ServiceMap } from '@/types/masters/service-map'
import type { Vendor } from '@/types/masters/vendor'

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
    const extraVendor = useMemo(
        () => (initialData?.vendor ? ([initialData.vendor] as unknown as Vendor[]) : undefined),
        [initialData?.vendor],
    )

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
            serviceType: initialData.serviceType,
            minWeight: Number(initialData.minWeight),
            maxWeight: Number(initialData.maxWeight),
            status: initialData.status,
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
                                <FormControl>
                                    <VendorFloatingAsyncSelect
                                        triggerRef={field.ref}
                                        allowClear={false}
                                        value={field.value > 0 ? field.value : undefined}
                                        onChange={(v) => field.onChange(v ?? 0)}
                                        queryKeyScope={isEdit && initialData ? `service-map-${initialData.id}` : 'service-map-new'}
                                        extraVendors={extraVendor}
                                    />
                                </FormControl>
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
                                        <IntegerInput
                                            className={FLOATING_INNER_CONTROL}
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            min={0}
                                        />
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
                                        <IntegerInput
                                            className={FLOATING_INNER_CONTROL}
                                            name={field.name}
                                            ref={field.ref}
                                            onBlur={field.onBlur}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            min={0}
                                        />
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
