"use client"

import { useEffect } from 'react'
import { Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_CONTROL,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { FormSection } from "@/components/ui/form-section"
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'
import { consigneeService } from '@/services/masters/consignee-service'
import { Consignee, ConsigneeFormData } from '@/types/masters/consignee'

const consigneeSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().optional().or(z.literal("")),
    address1: z.string().optional().or(z.literal("")),
    address2: z.string().optional().or(z.literal("")),
    pinCodeId: z.coerce.number().int().positive("Pin code is required"),
    telephone: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address").or(z.literal("")),
    mobile: z.string().optional().or(z.literal("")),
})

type ConsigneeFormValues = z.infer<typeof consigneeSchema>

interface ConsigneeFormProps {
    initialData?: Consignee | null
}

export function ConsigneeForm({ initialData }: ConsigneeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<ConsigneeFormValues>({
        resolver: zodResolver(consigneeSchema) as Resolver<ConsigneeFormValues>,
        defaultValues: {
            code: '',
            name: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCodeId: 0,
            telephone: '',
            email: '',
            mobile: '',
        },
    })

    useEffect(() => {
        if (!initialData) return

        form.reset({
            code: initialData.code || '',
            name: initialData.name || '',
            contactPerson: initialData.contactPerson || '',
            address1: initialData.address1 || '',
            address2: initialData.address2 || '',
            pinCodeId: initialData.pinCodeId ?? 0,
            telephone: initialData.telephone || '',
            email: initialData.email || '',
            mobile: initialData.mobile || '',
        })
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: ConsigneeFormValues) => {
            const payload = omitEmptyCodeFields(values, ['code']) as ConsigneeFormData
            return isEdit && initialData
                ? consigneeService.updateConsignee(initialData.id, payload)
                : consigneeService.createConsignee(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consignees'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['consignee', initialData.id] })
            }
            toast.success(`Consignee ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/consignee')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} consignee`)
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSection title="Basic Details" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FloatingFormItem label="Consignee Code (optional)">
                                        <FormControl>
                                            <Input placeholder="Blank = auto-generate" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FloatingFormItem label="Consignee Name">
                                        <FormControl>
                                            <Input placeholder="Receiver name" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }) => (
                                <FloatingFormItem label="Contact Person">
                                    <FormControl>
                                        <Input placeholder="Contact person" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection title="Contact Information" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FloatingFormItem label="Mobile">
                                        <FormControl>
                                            <Input placeholder="Mobile no" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telephone"
                                render={({ field }) => (
                                    <FloatingFormItem label="Telephone">
                                        <FormControl>
                                            <Input placeholder="Telephone no" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FloatingFormItem label="Email">
                                    <FormControl>
                                        <Input placeholder="receiver@example.com" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection className="md:col-span-2" title="Address" contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FloatingFormItem label="Address Line 1">
                                    <FormControl>
                                        <Input placeholder="Street address" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address2"
                            render={({ field }) => (
                                <FloatingFormItem label="Address Line 2">
                                    <FormControl>
                                        <Input placeholder="Landmark, floor, etc." {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pinCodeId"
                            render={({ field }) => (
                                <FloatingFormItem label="Pin Code">
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                            placeholder="Pin code"
                                            className={FLOATING_INNER_CONTROL}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                    <Button type="button" variant="expressDanger" onClick={() => router.push('/masters/consignee')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Consignee' : 'Create Consignee'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
