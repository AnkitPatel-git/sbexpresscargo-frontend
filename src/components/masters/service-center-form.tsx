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
import { FormSection } from "@/components/ui/form-section"
import { serviceCenterService } from '@/services/masters/service-center-service'
import { stateService } from '@/services/masters/state-service'
import { ServiceCenter, type ServiceCenterFormData } from '@/types/masters/service-center'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const serviceCenterSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    subName: z.string().nullable().optional(),
    address1: z.string().nullable().optional(),
    address2: z.string().nullable().optional(),
    address3: z.string().nullable().optional(),
    address4: z.string().nullable().optional(),
    destination: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    telephone: z.string().nullable().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
    gstNo: z.string().nullable().optional(),
    gstTelephone: z.string().nullable().optional(),
    panNo: z.string().nullable().optional(),
    icnNo: z.string().nullable().optional(),
    stNo: z.string().nullable().optional(),
    pinCodeId: z.string().nullable().optional(),
    companyLogo: z.string().nullable().optional(),
    signatoryLogo: z.string().nullable().optional(),
    terms: z.array(z.string()).optional(),
    bankId: z.string().nullable().optional(),
    accountNo: z.string().nullable().optional(),
    accountName: z.string().nullable().optional(),
    bankAddress: z.string().nullable().optional(),
    ifsc: z.string().nullable().optional(),
    micr: z.string().nullable().optional(),
    lastInvoicePrefix: z.string().nullable().optional(),
    lastInvoiceNo: z.coerce.number().nullable().optional(),
    lastInvoiceSuffix: z.string().nullable().optional(),
    freeFormPrefix: z.string().nullable().optional(),
    lastFreeFormInvoiceNo: z.coerce.number().nullable().optional(),
    freeFormSuffix: z.string().nullable().optional(),
    debitNotePrefix: z.string().nullable().optional(),
    debitNoteLastInvoiceNo: z.coerce.number().nullable().optional(),
    debitNoteSuffix: z.string().nullable().optional(),
    creditNotePrefix: z.string().nullable().optional(),
    creditNoteLastInvoiceNo: z.coerce.number().nullable().optional(),
    creditNoteSuffix: z.string().nullable().optional(),
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
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const form = useForm<ServiceCenterFormValues>({
        resolver: zodResolver(serviceCenterSchema) as Resolver<ServiceCenterFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            subName: initialData?.subName || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            address3: initialData?.address3 || '',
            address4: initialData?.address4 || '',
            destination: initialData?.destination || '',
            state: initialData?.state || '',
            telephone: initialData?.telephone || '',
            email: initialData?.email || '',
            gstNo: initialData?.gstNo || '',
            gstTelephone: initialData?.gstTelephone || '',
            panNo: initialData?.panNo || '',
            icnNo: initialData?.icnNo || '',
            stNo: initialData?.stNo || '',
            pinCodeId: initialData?.pinCodeId != null ? String(initialData.pinCodeId) : '',
            companyLogo: initialData?.companyLogo || '',
            signatoryLogo: initialData?.signatoryLogo || '',
            terms: initialData?.terms ?? [],
            bankId: initialData?.bankId != null ? String(initialData.bankId) : '',
            accountNo: initialData?.accountNo || '',
            accountName: initialData?.accountName || '',
            bankAddress: initialData?.bankAddress || '',
            ifsc: initialData?.ifsc || '',
            micr: initialData?.micr || '',
            lastInvoicePrefix: initialData?.lastInvoicePrefix || '',
            lastInvoiceNo: initialData?.lastInvoiceNo ?? undefined,
            lastInvoiceSuffix: initialData?.lastInvoiceSuffix || '',
            freeFormPrefix: initialData?.freeFormPrefix || '',
            lastFreeFormInvoiceNo: initialData?.lastFreeFormInvoiceNo ?? undefined,
            freeFormSuffix: initialData?.freeFormSuffix || '',
            debitNotePrefix: initialData?.debitNotePrefix || '',
            debitNoteLastInvoiceNo: initialData?.debitNoteLastInvoiceNo ?? undefined,
            debitNoteSuffix: initialData?.debitNoteSuffix || '',
            creditNotePrefix: initialData?.creditNotePrefix || '',
            creditNoteLastInvoiceNo: initialData?.creditNoteLastInvoiceNo ?? undefined,
            creditNoteSuffix: initialData?.creditNoteSuffix || '',
            rcpLastNo: initialData?.rcpLastNo ?? undefined,
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code || '',
                name: initialData.name || '',
                subName: initialData.subName || '',
                address1: initialData.address1 || '',
                address2: initialData.address2 || '',
                address3: initialData.address3 || '',
                address4: initialData.address4 || '',
                destination: initialData.destination || '',
                state: initialData.state || '',
                telephone: initialData.telephone || '',
                email: initialData.email || '',
                gstNo: initialData.gstNo || '',
                gstTelephone: initialData.gstTelephone || '',
                panNo: initialData.panNo || '',
                icnNo: initialData.icnNo || '',
                stNo: initialData.stNo || '',
                pinCodeId: initialData.pinCodeId != null ? String(initialData.pinCodeId) : '',
                companyLogo: initialData.companyLogo || '',
                signatoryLogo: initialData.signatoryLogo || '',
                terms: initialData.terms ?? [],
                bankId: initialData.bankId != null ? String(initialData.bankId) : '',
                accountNo: initialData.accountNo || '',
                accountName: initialData.accountName || '',
                bankAddress: initialData.bankAddress || '',
                ifsc: initialData.ifsc || '',
                micr: initialData.micr || '',
                lastInvoicePrefix: initialData.lastInvoicePrefix || '',
                lastInvoiceNo: initialData.lastInvoiceNo ?? undefined,
                lastInvoiceSuffix: initialData.lastInvoiceSuffix || '',
                freeFormPrefix: initialData.freeFormPrefix || '',
                lastFreeFormInvoiceNo: initialData.lastFreeFormInvoiceNo ?? undefined,
                freeFormSuffix: initialData.freeFormSuffix || '',
                debitNotePrefix: initialData.debitNotePrefix || '',
                debitNoteLastInvoiceNo: initialData.debitNoteLastInvoiceNo ?? undefined,
                debitNoteSuffix: initialData.debitNoteSuffix || '',
                creditNotePrefix: initialData.creditNotePrefix || '',
                creditNoteLastInvoiceNo: initialData.creditNoteLastInvoiceNo ?? undefined,
                creditNoteSuffix: initialData.creditNoteSuffix || '',
                rcpLastNo: initialData.rcpLastNo ?? undefined,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: ServiceCenterFormValues) => {
            const payload = omitEmptyCodeFields(values, ['code']) as ServiceCenterFormValues
            if (isEdit && initialData) {
                const updateBody: Partial<ServiceCenterFormData> = {
                    ...payload,
                    version: initialData.version ?? 1,
                }
                return serviceCenterService.updateServiceCenter(initialData.id, updateBody)
            }
            return serviceCenterService.createServiceCenter(payload as ServiceCenterFormData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-centers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['service-center', initialData.id] })
            }
            toast.success(`Service Center ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/service-centers')
        },
        onError: (error: any) => {
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
                    {/* General Information */}
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
                                    <FloatingFormItem label="Sub Name (Optional)">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="e.g. Mumbai Regional" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* Contact & Tax Details */}
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
                                    name="gstTelephone"
                                    render={({ field }) => (
                                        <FloatingFormItem label="GST telephone">
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
                                        <FloatingFormItem label="PAN">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="icnNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="ICN Number">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="ICN No" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Service Tax No">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="ST No" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                    </FormSection>

                    {/* Address Information */}
                    <FormSection
                        className="md:col-span-2"
                        title="Address Details"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FloatingFormItem label="Line 1">
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
                                    <FloatingFormItem label="Line 2">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Building/Floor" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address3"
                                render={({ field }) => (
                                    <FloatingFormItem label="Line 3">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Area/Locality" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address4"
                                render={({ field }) => (
                                    <FloatingFormItem label="Line 4">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Landmark" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FloatingFormItem label="City / Destination">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="City Name" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pinCodeId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Pin code (id or code)">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="486001 or id" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FloatingFormItem label="State" itemClassName="md:col-span-2">
                                        <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={stateOpen}
                                                        className={cn(
                                                            FLOATING_INNER_COMBO,
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? statesData?.data?.find((state: any) => state.stateName === field.value)?.stateName
                                                                : "Select state..."}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search state..." />
                                                    <CommandList>
                                                        <CommandEmpty>No state found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {statesData?.data?.map((state: any) => (
                                                                <CommandItem
                                                                    key={state.id}
                                                                    value={state.stateName}
                                                                    onSelect={() => {
                                                                        form.setValue("state", state.stateName)
                                                                        setStateOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === state.stateName ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {state.stateName}
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

                    {/* Bank & invoicing (Bruno create optional) */}
                    <FormSection
                        className="md:col-span-2"
                        title="Bank & invoicing"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                            <FormField
                                control={form.control}
                                name="bankId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Bank ID">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Numeric bank id" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Account no.">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountName"
                                render={({ field }) => (
                                    <FloatingFormItem label="Account name">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bankAddress"
                                render={({ field }) => (
                                    <FloatingFormItem label="Bank address">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ifsc"
                                render={({ field }) => (
                                    <FloatingFormItem label="IFSC">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="micr"
                                render={({ field }) => (
                                    <FloatingFormItem label="MICR">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastInvoicePrefix"
                                render={({ field }) => (
                                    <FloatingFormItem label="Last invoice prefix">
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
                                    <FloatingFormItem label="Last invoice no.">
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
                                    <FloatingFormItem label="Last invoice suffix">
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
                                    <FloatingFormItem label="Free form prefix">
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
                                    <FloatingFormItem label="Last free-form invoice no.">
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
                                    <FloatingFormItem label="Free form suffix">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="debitNotePrefix"
                                render={({ field }) => (
                                    <FloatingFormItem label="Debit note prefix">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="debitNoteLastInvoiceNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Debit note last no.">
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="debitNoteSuffix"
                                render={({ field }) => (
                                    <FloatingFormItem label="Debit note suffix">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="creditNotePrefix"
                                render={({ field }) => (
                                    <FloatingFormItem label="Credit note prefix">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="creditNoteLastInvoiceNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Credit note last no.">
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="creditNoteSuffix"
                                render={({ field }) => (
                                    <FloatingFormItem label="Credit note suffix">
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
                                    <FloatingFormItem label="RCP last no.">
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* Logos & Assets */}
                    <FormSection
                        className="md:col-span-2"
                        title="Logos & Assets"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                            <FormField
                                control={form.control}
                                name="companyLogo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Company Logo URL">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="https://..." className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="signatoryLogo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Signatory Logo URL">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="https://..." className={FLOATING_INNER_CONTROL} />
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
                        {isEdit ? 'Update SC' : 'Create SC'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
