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
import { localBranchService } from '@/services/masters/local-branch-service'
import { stateService } from '@/services/masters/state-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { LocalBranch } from '@/types/masters/local-branch'

const localBranchSchema = z.object({
    branchCode: z.string().min(2, "Branch code must be at least 2 characters"),
    companyName: z.string().min(3, "Company name must be at least 3 characters"),
    name: z.string().min(3, "Branch name must be at least 3 characters"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional().nullable(),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    telephone1: z.string().min(10, "Telephone must be at least 10 characters"),
    telephone2: z.string().optional().nullable(),
    fax: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    email: z.string().email("Invalid email address"),
    panNo: z.string().optional().nullable(),
    serviceTaxNo: z.string().optional().nullable(),
    billingState: z.string().optional().nullable(),
    stateCode: z.string().optional().nullable(),
    gstNo: z.string().min(15, "GST No must be 15 characters"),
    serviceRegistrationNo: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    accountNo: z.string().optional().nullable(),
    accountName: z.string().optional().nullable(),
    bankAddress: z.string().optional().nullable(),
    ifsc: z.string().optional().nullable(),
    micr: z.string().optional().nullable(),
    lastInvoiceNo: z.coerce.number().optional().nullable(),
    invoicePrefix: z.string().optional().nullable(),
    invoiceSuffix: z.string().optional().nullable(),
    lastFreeFormInvoiceNo: z.coerce.number().optional().nullable(),
    freeFormPrefix: z.string().optional().nullable(),
    freeFormSuffix: z.string().optional().nullable(),
    debitNotePrefix: z.string().optional().nullable(),
    debitNoteLastInvoiceNo: z.coerce.number().optional().nullable(),
    debitNoteSuffix: z.string().optional().nullable(),
    creditNotePrefix: z.string().optional().nullable(),
    creditNoteLastInvoiceNo: z.coerce.number().optional().nullable(),
    creditNoteSuffix: z.string().optional().nullable(),
    rcpLastNo: z.coerce.number().optional().nullable(),
})

type LocalBranchFormValues = z.infer<typeof localBranchSchema>

interface LocalBranchFormProps {
    initialData?: LocalBranch | null
}

export function LocalBranchForm({ initialData }: LocalBranchFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [scOpen, setScOpen] = useState(false)
    const [stateOpen, setStateOpen] = useState(false)
    const [billingStateOpen, setBillingStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const { data: scData, isLoading: isScLoading } = useQuery({
        queryKey: ['service-centers-minimal'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const form = useForm<LocalBranchFormValues>({
        resolver: zodResolver(localBranchSchema) as Resolver<LocalBranchFormValues>,
        defaultValues: {
            branchCode: initialData?.branchCode || '',
            companyName: initialData?.companyName || '',
            name: initialData?.name || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            pinCode: initialData?.pinCode || '',
            city: initialData?.city || '',
            state: initialData?.state || '',
            serviceCenterId: initialData?.serviceCenterId || 0,
            telephone1: initialData?.telephone1 || '',
            telephone2: initialData?.telephone2 || '',
            fax: initialData?.fax || '',
            website: initialData?.website || '',
            email: initialData?.email || '',
            panNo: initialData?.panNo || '',
            serviceTaxNo: initialData?.serviceTaxNo || '',
            billingState: initialData?.billingState || '',
            stateCode: initialData?.stateCode || '',
            gstNo: initialData?.gstNo || '',
            serviceRegistrationNo: initialData?.serviceRegistrationNo || '',
            bankName: initialData?.bankName || '',
            accountNo: initialData?.accountNo || '',
            accountName: initialData?.accountName || '',
            bankAddress: initialData?.bankAddress || '',
            ifsc: initialData?.ifsc || '',
            micr: initialData?.micr || '',
            lastInvoiceNo: initialData?.lastInvoiceNo || 0,
            invoicePrefix: initialData?.invoicePrefix || '',
            invoiceSuffix: initialData?.invoiceSuffix || '',
            lastFreeFormInvoiceNo: initialData?.lastFreeFormInvoiceNo || 0,
            freeFormPrefix: initialData?.freeFormPrefix || '',
            freeFormSuffix: initialData?.freeFormSuffix || '',
            debitNotePrefix: initialData?.debitNotePrefix || '',
            debitNoteLastInvoiceNo: initialData?.debitNoteLastInvoiceNo || 0,
            debitNoteSuffix: initialData?.debitNoteSuffix || '',
            creditNotePrefix: initialData?.creditNotePrefix || '',
            creditNoteLastInvoiceNo: initialData?.creditNoteLastInvoiceNo || 0,
            creditNoteSuffix: initialData?.creditNoteSuffix || '',
            rcpLastNo: initialData?.rcpLastNo || 0,
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                branchCode: initialData.branchCode,
                companyName: initialData.companyName,
                name: initialData.name,
                address1: initialData.address1,
                address2: initialData.address2 || '',
                pinCode: initialData.pinCode,
                city: initialData.city,
                state: initialData.state,
                serviceCenterId: initialData.serviceCenterId || 0,
                telephone1: initialData.telephone1,
                telephone2: initialData.telephone2 || '',
                fax: initialData.fax || '',
                website: initialData.website || '',
                email: initialData.email,
                panNo: initialData.panNo || '',
                serviceTaxNo: initialData.serviceTaxNo || '',
                billingState: initialData.billingState || '',
                stateCode: initialData.stateCode || '',
                gstNo: initialData.gstNo,
                serviceRegistrationNo: initialData.serviceRegistrationNo || '',
                bankName: initialData.bankName || '',
                accountNo: initialData.accountNo || '',
                accountName: initialData.accountName || '',
                bankAddress: initialData.bankAddress || '',
                ifsc: initialData.ifsc || '',
                micr: initialData.micr || '',
                lastInvoiceNo: initialData.lastInvoiceNo || 0,
                invoicePrefix: initialData.invoicePrefix || '',
                invoiceSuffix: initialData.invoiceSuffix || '',
                lastFreeFormInvoiceNo: initialData.lastFreeFormInvoiceNo || 0,
                freeFormPrefix: initialData.freeFormPrefix || '',
                freeFormSuffix: initialData.freeFormSuffix || '',
                debitNotePrefix: initialData.debitNotePrefix || '',
                debitNoteLastInvoiceNo: initialData.debitNoteLastInvoiceNo || 0,
                debitNoteSuffix: initialData.debitNoteSuffix || '',
                creditNotePrefix: initialData.creditNotePrefix || '',
                creditNoteLastInvoiceNo: initialData.creditNoteLastInvoiceNo || 0,
                creditNoteSuffix: initialData.creditNoteSuffix || '',
                rcpLastNo: initialData.rcpLastNo || 0,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: LocalBranchFormValues) =>
            isEdit
                ? localBranchService.updateLocalBranch(initialData!.id, values)
                : localBranchService.createLocalBranch(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['local-branches'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['local-branch', initialData.id] })
            }
            toast.success(`Local Branch ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/local-branches')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} local branch`)
        }
    })

    const onSubmit = (values: LocalBranchFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Branch Information */}
                    <FormSection title="Branch Information" contentClassName="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="branchCode"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Branch Code">
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. BR001" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Branch Name">
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Mumbai Main" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FloatingFormItem label="Company Name">
                                        <FormControl>
                                            <Input {...field} placeholder="Company Name" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="serviceCenterId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Service Center">
                                        <Popover open={scOpen} onOpenChange={setScOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={scOpen}
                                                        className={cn(
                                                            FLOATING_INNER_COMBO,
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={isScLoading}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? scData?.data?.find((sc) => sc.id === field.value)?.name
                                                                : isScLoading ? "Loading..." : "Select Service Center..."}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search service center..." />
                                                    <CommandList>
                                                        <CommandEmpty>No service center found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {scData?.data?.map((sc) => (
                                                                <CommandItem
                                                                    key={sc.id}
                                                                    value={sc.name}
                                                                    onSelect={() => {
                                                                        form.setValue("serviceCenterId", sc.id)
                                                                        setScOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === sc.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {sc.name} ({sc.code})
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

                    {/* Contact Details */}
                    <FormSection title="Contact Details" contentClassName="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="telephone1"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Telephone 1">
                                            <FormControl>
                                                <Input {...field} placeholder="Telephone 1" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telephone2"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Telephone 2 (Optional)">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="Telephone 2" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FloatingFormItem label="Email Address">
                                        <FormControl>
                                            <Input {...field} placeholder="email@example.com" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FloatingFormItem label="Website (Optional)">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="https://..." className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* Address Information */}
                    <FormSection
                        className="lg:col-span-2"
                        title="Address Details"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FloatingFormItem label="Building/Street" itemClassName="md:col-span-2">
                                        <FormControl>
                                            <Input {...field} placeholder="Building name, Street" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address2"
                                render={({ field }) => (
                                    <FloatingFormItem label="Area/Landmark (Optional)" itemClassName="md:col-span-2">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Area, Landmark" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FloatingFormItem label="City">
                                        <FormControl>
                                            <Input {...field} placeholder="City" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pinCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Pin Code">
                                        <FormControl>
                                            <Input {...field} placeholder="6-digit Pincode" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FloatingFormItem label="State">
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

                    {/* Billing & Tax Details */}
                    <FormSection title="Billing & Tax Details" contentClassName="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="gstNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="GST Number">
                                            <FormControl>
                                                <Input {...field} placeholder="15-digit GSTIN" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="panNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="PAN Number">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="PAN No" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="serviceTaxNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Service Tax No">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="Service Tax No" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stateCode"
                                    render={({ field }) => (
                                        <FloatingFormItem label="State Code">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="e.g. 27" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="billingState"
                                render={({ field }) => (
                                    <FloatingFormItem label="Billing State">
                                        <Popover open={billingStateOpen} onOpenChange={setBillingStateOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={billingStateOpen}
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
                                                                        form.setValue("billingState", state.stateName)
                                                                        setBillingStateOpen(false)
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

                    {/* Bank Details */}
                    <FormSection title="Bank Information" contentClassName="space-y-4">
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FloatingFormItem label="Bank Name">
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Bank Name" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="accountNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Account Number">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="Account Number" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accountName"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Account Name">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="Account Name" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="ifsc"
                                    render={({ field }) => (
                                        <FloatingFormItem label="IFSC Code">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="IFSC Code" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="micr"
                                    render={({ field }) => (
                                        <FloatingFormItem label="MICR Code">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="MICR Code" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                    </FormSection>

                    {/* Invoice & Series Management */}
                    <FormSection
                        className="lg:col-span-2"
                        title="Invoice & Series Management"
                        contentClassName="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                            <div className="space-y-4 border-r pr-6 last:border-0 last:pr-0">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Standard Invoice</h4>
                                <FormField
                                    control={form.control}
                                    name="invoicePrefix"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Prefix">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="INV-" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastInvoiceNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Last Number">
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value || 0} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="invoiceSuffix"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Suffix">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="-24" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 border-r px-6">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Debit Note</h4>
                                <FormField
                                    control={form.control}
                                    name="debitNotePrefix"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Prefix">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="DN-" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="debitNoteLastInvoiceNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Last Number">
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value || 0} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="debitNoteSuffix"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Suffix">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="-24" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 pl-6">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Credit Note</h4>
                                <FormField
                                    control={form.control}
                                    name="creditNotePrefix"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Prefix">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="CN-" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="creditNoteLastInvoiceNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Last Number">
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value || 0} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="creditNoteSuffix"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Suffix">
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="-24" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/local-branches')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Branch' : 'Add Branch'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
