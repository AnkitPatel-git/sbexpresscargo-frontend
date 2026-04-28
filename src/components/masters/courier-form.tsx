"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSection } from "@/components/ui/form-section"
import { courierService } from '@/services/masters/courier-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { userService } from '@/services/user-service'
import { Courier, type CourierFormData } from '@/types/masters/courier'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'
import { useDebounce } from '@/hooks/use-debounce'

const courierSchema = z.object({
    code: optionalMasterCode(2),
    userId: z.coerce.number().min(1, "Linked user is required"),
    serviceCenterId: z.preprocess(
        (v) => {
            if (v === '' || v === null || v === undefined || v === '__none__') return undefined
            const n = Number(v)
            return Number.isFinite(n) && n > 0 ? n : undefined
        },
        z.number().positive().optional(),
    ),
    pickupCharge: z.coerce.number().min(0, "Pickup charge must be at least 0"),
    deliveryCharge: z.coerce.number().min(0, "Delivery charge must be at least 0"),
    inActive: z.boolean(),
})

type CourierFormValues = z.infer<typeof courierSchema>

interface CourierFormProps {
    initialData?: Courier | null
}

export function CourierForm({ initialData }: CourierFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [userSearch, setUserSearch] = useState('')
    const [serviceCenterSearch, setServiceCenterSearch] = useState('')

    const debouncedUserSearch = useDebounce(userSearch, 400)
    const debouncedServiceCenterSearch = useDebounce(serviceCenterSearch, 400)

    const { data: usersResp } = useQuery({
        queryKey: ['users-for-courier', debouncedUserSearch],
        queryFn: () => userService.listUsers({ page: 1, limit: 100, status: 'ACTIVE', search: debouncedUserSearch }),
    })

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list-courier', debouncedServiceCenterSearch],
        queryFn: () => serviceCenterService.getServiceCenters({
            page: 1,
            limit: 100,
            search: debouncedServiceCenterSearch,
        }),
    })

    const users = useMemo(() => {
        const list = [...((usersResp?.data ?? []) as { id: number; username: string; email?: string }[])]
        if (initialData?.user && !list.some((user) => user.id === initialData.userId)) {
            list.unshift({
                id: initialData.user.id,
                username: initialData.user.username,
                email: initialData.user.email ?? undefined,
            })
        }
        return list
    }, [initialData, usersResp?.data])

    const serviceCenters = useMemo(() => {
        const list = [...(scData?.data ?? [])]
        if (initialData?.serviceCenter && !list.some((serviceCenter) => serviceCenter.id === initialData.serviceCenterId)) {
            list.unshift({
                ...initialData.serviceCenter,
                subName: initialData.serviceCenter.subName ?? null,
                address1: '',
                address2: '',
                telephone: '',
                email: '',
                pinCodeId: 0,
                countryId: 0,
                stateId: 0,
                gstNo: null,
                panNo: null,
                version: 0,
                localBranchId: null,
                createdAt: '',
                updatedAt: '',
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
                serviceablePincode: null,
                state: null,
            })
        }
        return list
    }, [initialData, scData?.data])

    const form = useForm<CourierFormValues>({
        resolver: zodResolver(courierSchema) as Resolver<CourierFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            userId: initialData?.userId || 0,
            serviceCenterId: initialData?.serviceCenterId ?? undefined,
            pickupCharge: initialData != null ? Number(initialData.pickupCharge) : 0,
            deliveryCharge: initialData != null ? Number(initialData.deliveryCharge) : 0,
            inActive: initialData?.inActive ?? false,
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code || '',
                userId: initialData.userId,
                serviceCenterId: initialData.serviceCenterId ?? undefined,
                pickupCharge: Number(initialData.pickupCharge),
                deliveryCharge: Number(initialData.deliveryCharge),
                inActive: initialData.inActive,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: CourierFormValues) => {
            if (isEdit && initialData) {
                const patch: Record<string, unknown> = {
                    pickupCharge: data.pickupCharge,
                    deliveryCharge: data.deliveryCharge,
                    inActive: data.inActive,
                    serviceCenterId: data.serviceCenterId ?? null,
                }
                const trimmed = data.code?.trim()
                if (trimmed) patch.code = trimmed
                return courierService.updateCourier(initialData.id, patch as Partial<CourierFormData>)
            }
            const createBody = omitEmptyCodeFields(
                {
                    userId: data.userId,
                    serviceCenterId: data.serviceCenterId,
                    pickupCharge: data.pickupCharge,
                    deliveryCharge: data.deliveryCharge,
                    inActive: data.inActive,
                    code: data.code,
                },
                ['code'],
            ) as CourierFormData
            return courierService.createCourier(createBody)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['couriers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['courier', initialData.id] })
            }
            toast.success(`Courier ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/courier')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} courier`)
        },
    })

    return (
        <FormSection title="Courier Details" contentClassName="pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FloatingFormItem label="Courier Code (optional)">
                                    <FormControl>
                                        <Input placeholder="Blank = auto-generate per API" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FloatingFormItem required label={<>Linked user</>}>
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Search user from DB"
                                            className={FLOATING_INNER_CONTROL}
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            disabled={isEdit}
                                        />
                                        <Select
                                            disabled={isEdit}
                                            onValueChange={(v) => field.onChange(Number(v))}
                                            value={field.value ? String(field.value) : ''}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select user" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {users.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.username}{u.email ? ` (${u.email})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="serviceCenterId"
                            render={({ field }) => (
                                <FloatingFormItem label="Service center (optional)">
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Search service center from DB"
                                            className={FLOATING_INNER_CONTROL}
                                            value={serviceCenterSearch}
                                            onChange={(e) => setServiceCenterSearch(e.target.value)}
                                        />
                                        <Select
                                            onValueChange={(v) => field.onChange(v === '__none__' ? undefined : Number(v))}
                                            value={field.value ? String(field.value) : '__none__'}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="__none__">None</SelectItem>
                                                {serviceCenters.map((sc) => (
                                                    <SelectItem key={sc.id} value={String(sc.id)}>
                                                        {sc.code} - {sc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pickupCharge"
                            render={({ field }) => (
                                <FloatingFormItem required label={<>Pickup charge</>}>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className={FLOATING_INNER_CONTROL}
                                            {...field}
                                            value={field.value === undefined || field.value === null ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="deliveryCharge"
                            render={({ field }) => (
                                <FloatingFormItem required label={<>Delivery charge</>}>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className={FLOATING_INNER_CONTROL}
                                            {...field}
                                            value={field.value === undefined || field.value === null ? '' : field.value}
                                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="inActive"
                        render={({ field }) => (
                            <FloatingFormItem label="Inactive" itemClassName="max-w-xs">
                                <div className="flex min-h-[1.75rem] items-center py-0.5">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </div>
                            </FloatingFormItem>
                        )}
                    />
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => router.push('/masters/courier')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Courier' : 'Create Courier'}
                        </Button>
                    </div>
                </form>
            </Form>
        </FormSection>
    )
}
