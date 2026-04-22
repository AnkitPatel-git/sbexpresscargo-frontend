"use client"

import { useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2 } from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { FormSection } from "@/components/ui/form-section"
import { Textarea } from "@/components/ui/textarea"
import { serviceCenterService } from '@/services/masters/service-center-service'
import { ServiceCenter, type ServiceCenterFormData } from '@/types/masters/service-center'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const serviceCenterSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    subName: z.string().nullable().optional(),
    address1: z.string().nullable().optional(),
    address2: z.string().nullable().optional(),
    telephone: z.string().nullable().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
    gstNo: z.string().nullable().optional(),
    panNo: z.string().nullable().optional(),
    pinCodeId: z.string().nullable().optional(),
    companyLogo: z.string().nullable().optional(),
    signatoryLogo: z.string().nullable().optional(),
    termsText: z.string().optional(),
    lastInvoicePrefix: z.string().nullable().optional(),
    lastInvoiceNo: z.coerce.number().nullable().optional(),
    lastInvoiceSuffix: z.string().nullable().optional(),
    freeFormPrefix: z.string().nullable().optional(),
    lastFreeFormInvoiceNo: z.coerce.number().nullable().optional(),
    freeFormSuffix: z.string().nullable().optional(),
    rcpLastNo: z.coerce.number().nullable().optional(),
})

type ServiceCenterFormValues = z.infer<typeof serviceCenterSchema>

interface ServiceCenterFormProps {
    initialData?: ServiceCenter | null
}

export function ServiceCenterForm({ initialData }: ServiceCenterFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<ServiceCenterFormValues>({
        resolver: zodResolver(serviceCenterSchema) as Resolver<ServiceCenterFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            subName: initialData?.subName || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            telephone: initialData?.telephone || '',
            email: initialData?.email || '',
            gstNo: initialData?.gstNo || '',
            panNo: initialData?.panNo || '',
            pinCodeId: initialData?.pinCodeId != null ? String(initialData.pinCodeId) : '',
            companyLogo: initialData?.companyLogo || '',
            signatoryLogo: initialData?.signatoryLogo || '',
            termsText: initialData?.terms?.join('\n') || '',
            lastInvoicePrefix: initialData?.lastInvoicePrefix || '',
            lastInvoiceNo: initialData?.lastInvoiceNo ?? undefined,
            lastInvoiceSuffix: initialData?.lastInvoiceSuffix || '',
            freeFormPrefix: initialData?.freeFormPrefix || '',
            lastFreeFormInvoiceNo: initialData?.lastFreeFormInvoiceNo ?? undefined,
            freeFormSuffix: initialData?.freeFormSuffix || '',
            rcpLastNo: initialData?.rcpLastNo ?? undefined,
        }
    })

    useEffect(() => {
        if (!initialData) return

        form.reset({
            code: initialData.code || '',
            name: initialData.name || '',
            subName: initialData.subName || '',
            address1: initialData.address1 || '',
            address2: initialData.address2 || '',
            telephone: initialData.telephone || '',
            email: initialData.email || '',
            gstNo: initialData.gstNo || '',
            panNo: initialData.panNo || '',
            pinCodeId: initialData.pinCodeId != null ? String(initialData.pinCodeId) : '',
            companyLogo: initialData.companyLogo || '',
            signatoryLogo: initialData.signatoryLogo || '',
            termsText: initialData.terms?.join('\n') || '',
            lastInvoicePrefix: initialData.lastInvoicePrefix || '',
            lastInvoiceNo: initialData.lastInvoiceNo ?? undefined,
            lastInvoiceSuffix: initialData.lastInvoiceSuffix || '',
            freeFormPrefix: initialData.freeFormPrefix || '',
            lastFreeFormInvoiceNo: initialData.lastFreeFormInvoiceNo ?? undefined,
            freeFormSuffix: initialData.freeFormSuffix || '',
            rcpLastNo: initialData.rcpLastNo ?? undefined,
        })
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: ServiceCenterFormValues) => {
            const terms = values.termsText
                ? values.termsText.split('\n').map((term) => term.trim()).filter(Boolean)
                : []

            const { termsText, ...rest } = values
            const payload = omitEmptyCodeFields({
                ...rest,
                terms,
            }, ['code']) as ServiceCenterFormData

            if (isEdit && initialData) {
                return serviceCenterService.updateServiceCenter(initialData.id, {
                    ...payload,
                    version: initialData.version ?? 1,
                })
            }

            return serviceCenterService.createServiceCenter(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-centers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['service-center', initialData.id] })
            }
            toast.success(`Service Center ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/service-centers')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} service center`)
        }
    })

    const onSubmit = (values: ServiceCenterFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSection title="General Information" contentClassName="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FloatingFormItem label="Service Center Code (optional)">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Blank = auto-generate" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FloatingFormItem label="Service Center Name">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Full Name" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="subName"
                            render={({ field }) => (
                                <FloatingFormItem label="Sub Name">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Optional sub name" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection title="Contact & Tax Details" contentClassName="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FloatingFormItem label="Email Address">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="email@example.com" className={FLOATING_INNER_CONTROL} />
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
                                        <Input {...field} value={field.value || ''} placeholder="Telephone No" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gstNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="GST No">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="panNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="PAN No">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        className="md:col-span-2"
                        title="Address Details"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FloatingFormItem label="Address Line 1">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Street Address" className={FLOATING_INNER_CONTROL} />
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
                                        <Input {...field} value={field.value || ''} placeholder="Building / Landmark" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pinCodeId"
                            render={({ field }) => (
                                <FloatingFormItem label="Pin Code (id or code)" itemClassName="md:col-span-2">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="452001 or 1" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection
                        className="md:col-span-2"
                        title="Terms & Invoicing"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <FormField
                            control={form.control}
                            name="termsText"
                            render={({ field }) => (
                                <FloatingFormItem label="Terms (one per line)" itemClassName="md:col-span-2">
                                    <FormControl>
                                        <Textarea {...field} value={field.value || ''} placeholder="Enter one term per line" className="min-h-28" />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastInvoicePrefix"
                            render={({ field }) => (
                                <FloatingFormItem label="Last Invoice Prefix">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastInvoiceNo"
                            render={({ field }) => (
                                <FloatingFormItem label="Last Invoice No">
                                    <FormControl>
                                        <Input type="number" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastInvoiceSuffix"
                            render={({ field }) => (
                                <FloatingFormItem label="Last Invoice Suffix">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="freeFormPrefix"
                            render={({ field }) => (
                                <FloatingFormItem label="Free Form Prefix">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastFreeFormInvoiceNo"
                            render={({ field }) => (
                                <FloatingFormItem label="Last Free-form Invoice No">
                                    <FormControl>
                                        <Input type="number" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="freeFormSuffix"
                            render={({ field }) => (
                                <FloatingFormItem label="Free Form Suffix">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rcpLastNo"
                            render={({ field }) => (
                                <FloatingFormItem label="RCP Last No">
                                    <FormControl>
                                        <Input type="number" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection
                        className="md:col-span-2"
                        title="Logos"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <FormField
                            control={form.control}
                            name="companyLogo"
                            render={({ field }) => (
                                <FloatingFormItem label="Company Logo">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="logos/company/example.png" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="signatoryLogo"
                            render={({ field }) => (
                                <FloatingFormItem label="Signatory Logo">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="logos/signatory/example.png" className={FLOATING_INNER_CONTROL} />
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
                        onClick={() => router.push('/masters/service-centers')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? 'Update SC' : 'Create SC'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
