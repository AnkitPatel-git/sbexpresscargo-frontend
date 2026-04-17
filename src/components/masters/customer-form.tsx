"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { bankService } from '@/services/masters/bank-service'
import { customerService } from '@/services/masters/customer-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { productService } from '@/services/masters/product-service'
import { vendorService } from '@/services/masters/vendor-service'
import {
    Customer,
    type CustomerFormData,
    type CustomerFuelSurcharge,
    type CustomerFuelSurchargeFormData,
    type CustomerKycDocument,
    type CustomerKycDocumentFormData,
    type CustomerOtherCharge,
    type CustomerOtherChargeFormData,
    type CustomerVolumetric,
    type CustomerVolumetricFormData,
} from '@/types/masters/customer'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const customerSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional().or(z.literal("")),
    pinCodeId: z.coerce.number().int().positive("Pin code is required"),
    serviceCenterId: z.coerce.number().int().positive("Service center is required"),
    bankId: z.coerce.number().int().positive("Bank is required"),
    bankAccount: z.string().min(1, "Bank account is required"),
    bankIfsc: z.string().min(1, "Bank IFSC is required"),
    telephone: z.string().min(10, "Telephone must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    serviceStartDate: z.string().min(1, "Service start date is required"),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    origin: z.string().optional().or(z.literal("")),
    gstNo: z.string().min(15, "GST Number must be 15 characters"),
    aadhaarNo: z.string().optional().or(z.literal("")),
    dobOnAadhaar: z.string().optional().or(z.literal("")),
    panNo: z.string().optional().or(z.literal("")),
    invoiceFormat: z.string().optional().or(z.literal("")),
    customerType: z.enum(['INDIVIDUAL', 'CORPORATE']),
    registerType: z.enum(['REGISTERED', 'UNREGISTERED']),
    signatureFile: z.string().optional().or(z.literal("")),
    logoFile: z.string().optional().or(z.literal("")),
    createDefaultShipper: z.boolean().default(false),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
    initialData?: Customer | null
}

const CUSTOMER_TABS = [
    { value: "personal", label: "Personal Information" },
    { value: "fuel", label: "Fuel Surcharges" },
    { value: "charges", label: "Other Charges" },
    { value: "volumetric", label: "Customer Volumetric" },
    { value: "kyc", label: "KYC Details" },
] as const

const CUSTOMER_OTHER_CHARGE_TYPES = [
    'AIRWAYBILL',
    'FREIGHT',
    'FUEL',
    'OBC',
    'FLAT',
    'OTHER',
] as const

export function CustomerForm({ initialData }: CustomerFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [activeTab, setActiveTab] = useState("personal")
    const activeTabIndex = CUSTOMER_TABS.findIndex((tab) => tab.value === activeTab)
    const customerId = initialData?.id ?? null
    const isFirstTab = activeTabIndex === 0
    const isLastTab = activeTabIndex === CUSTOMER_TABS.length - 1

    const { data: banksData } = useQuery({
        queryKey: ['customer-form-banks'],
        queryFn: () => bankService.getBanks({ page: 1, limit: 100, sortBy: 'bankName', sortOrder: 'asc' }),
    })

    const { data: serviceCentersData, isLoading: isServiceCentersLoading } = useQuery({
        queryKey: ['customer-form-service-centers'],
        queryFn: () => serviceCenterService.getServiceCenters({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }),
    })

    const serviceCenterOptions = [
        ...(serviceCentersData?.data ?? []),
        ...(initialData?.serviceCenter && !(serviceCentersData?.data ?? []).some((serviceCenter) => serviceCenter.id === initialData.serviceCenterId)
            ? [initialData.serviceCenter]
            : []),
    ]

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
        defaultValues: {
            code: '',
            name: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCodeId: 0,
            serviceCenterId: 0,
            bankId: 0,
            bankAccount: '',
            bankIfsc: '',
            telephone: '',
            email: '',
            mobile: '',
            serviceStartDate: '',
            status: 'ACTIVE',
            origin: '',
            gstNo: '',
            aadhaarNo: '',
            dobOnAadhaar: '',
            panNo: '',
            invoiceFormat: '',
            customerType: 'INDIVIDUAL',
            registerType: 'REGISTERED',
            signatureFile: '',
            logoFile: '',
            createDefaultShipper: false,
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
            serviceCenterId: initialData.serviceCenterId ?? 0,
            bankId: initialData.bankId ?? 0,
            bankAccount: initialData.bankAccount || '',
            bankIfsc: initialData.bankIfsc || '',
            telephone: initialData.telephone || '',
            email: initialData.email || '',
            mobile: initialData.mobile || '',
            serviceStartDate: initialData.serviceStartDate ? initialData.serviceStartDate.split('T')[0] : '',
            status: initialData.status || 'ACTIVE',
            origin: initialData.origin || '',
            gstNo: initialData.gstNo || '',
            aadhaarNo: initialData.aadhaarNo || '',
            dobOnAadhaar: initialData.dobOnAadhaar ? initialData.dobOnAadhaar.split('T')[0] : '',
            panNo: initialData.panNo || '',
            invoiceFormat: initialData.invoiceFormat || '',
            customerType: (initialData.customerType as 'INDIVIDUAL' | 'CORPORATE') || 'INDIVIDUAL',
            registerType: (initialData.registerType as 'REGISTERED' | 'UNREGISTERED') || 'REGISTERED',
            signatureFile: initialData.signatureFile || '',
            logoFile: initialData.logoFile || '',
            createDefaultShipper: false,
        })
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: CustomerFormValues) => {
            const payload = omitEmptyCodeFields(values, ['code']) as CustomerFormData
            if (isEdit && initialData) {
                return customerService.updateCustomer(initialData.id, {
                    ...payload,
                    version: initialData.version ?? 1,
                })
            }
            return customerService.createCustomer(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['customer', initialData.id] })
            }
            toast.success(`Customer ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/customers')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} customer`)
        }
    })

    const onSubmit = (values: CustomerFormValues) => {
        mutation.mutate(values)
    }

    const onInvalid = (errors: FieldErrors<CustomerFormValues>) => {
        const errorMessages = Object.entries(errors)
            .map(([field, error]) => `${field}: ${error?.message ?? 'Invalid value'}`)
            .join(', ')
        toast.error(`Validation Error: ${errorMessages || 'Please check the form'}`)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 pb-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="h-auto flex w-full flex-wrap justify-start rounded-full border border-border/60 bg-muted/40 p-2">
                        <TabsTrigger value="personal" className="rounded-full px-5 py-2">Personal Information</TabsTrigger>
                        <TabsTrigger value="fuel" className="rounded-full px-5 py-2">Fuel Surcharges</TabsTrigger>
                        <TabsTrigger value="charges" className="rounded-full px-5 py-2">Other Charges</TabsTrigger>
                        <TabsTrigger value="volumetric" className="rounded-full px-5 py-2">Customer Volumetric</TabsTrigger>
                        <TabsTrigger value="kyc" className="rounded-full px-5 py-2">KYC Details</TabsTrigger>
                        <TabsTrigger value="address" className="rounded-full px-5 py-2">Customer Address</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSection title="Basic Information" contentClassName="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Customer Code (optional)">
                                                <FormControl>
                                                    <Input {...field} placeholder="Blank = auto-generate" className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Customer Name">
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Acme Corp" className={FLOATING_INNER_CONTROL} />
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
                                                <Input {...field} placeholder="Full Name" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
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
                            </FormSection>

                            <FormSection title="Contact Details" contentClassName="space-y-4">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="telephone"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Telephone">
                                                <FormControl>
                                                    <Input {...field} placeholder="Telephone No" className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="mobile"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Mobile">
                                                <FormControl>
                                                    <Input {...field} placeholder="Mobile No" className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="origin"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Origin">
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Indore" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </FormSection>

                            <FormSection title="Address & Links" contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address1"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Address / Building" itemClassName="md:col-span-2">
                                            <FormControl>
                                                <Input {...field} placeholder="Street address, building, floor" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address2"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Address line 2" itemClassName="md:col-span-2">
                                            <FormControl>
                                                <Input {...field} placeholder="Optional" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pinCodeId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Pin Code ID">
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} placeholder="Pin code id" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceCenterId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Service Center ID">
                                            <FormControl>
                                                <Select
                                                    onValueChange={(value) => field.onChange(Number(value))}
                                                    value={field.value ? String(field.value) : ''}
                                                >
                                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                        <SelectValue placeholder="Select service center" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {isServiceCentersLoading ? (
                                                            <SelectItem value="__loading__" disabled>
                                                                Loading service centers...
                                                            </SelectItem>
                                                        ) : null}
                                                        {serviceCenterOptions.map((serviceCenter) => (
                                                            <SelectItem key={serviceCenter.id} value={String(serviceCenter.id)}>
                                                                {serviceCenter.code} - {serviceCenter.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceStartDate"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Service Start Date">
                                            <FormControl>
                                                <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </FormSection>

                            <FormSection title="Identification" contentClassName="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="aadhaarNo"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Aadhaar">
                                                <FormControl>
                                                    <Input {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dobOnAadhaar"
                                        render={({ field }) => (
                                            <FloatingFormItem label="DOB on Aadhaar">
                                                <FormControl>
                                                    <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
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
                                                    <Input {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="invoiceFormat"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Invoice Format">
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. STANDARD" className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="signatureFile"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Signature File URL">
                                                <FormControl>
                                                    <Input {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="logoFile"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Logo File URL">
                                                <FormControl>
                                                    <Input {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                            </FormSection>

                            <FormSection title="Account" contentClassName="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="bankId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Bank">
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? String(field.value) : ''}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                        <SelectValue placeholder="Select bank" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {banksData?.data?.map((bank) => (
                                                        <SelectItem key={bank.id} value={String(bank.id)}>
                                                            {bank.bankName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankAccount"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Bank Account">
                                            <FormControl>
                                                <Input {...field} placeholder="Bank account number" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankIfsc"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Bank IFSC">
                                            <FormControl>
                                                <Input {...field} placeholder="Bank IFSC" className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </FormSection>

                            <FormSection className="md:col-span-2" title="Classification & Status" contentClassName="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <FormField
                                    control={form.control}
                                    name="customerType"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Customer Type">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                                    <SelectItem value="CORPORATE">Corporate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="registerType"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Register Type">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="REGISTERED">Registered</SelectItem>
                                                    <SelectItem value="UNREGISTERED">Unregistered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Status">
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="createDefaultShipper"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Create Default Shipper">
                                            <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                                <FormControl>
                                                    <Checkbox checked={field.value ?? false} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                                                </FormControl>
                                            </div>
                                        </FloatingFormItem>
                                    )}
                                />
                            </FormSection>
                        </div>
                    </TabsContent>

                    <TabsContent value="fuel" className="space-y-4">
                        <CustomerFuelSurchargeTab customerId={customerId} />
                    </TabsContent>
                    <TabsContent value="charges" className="space-y-4">
                        <CustomerOtherChargeTab customerId={customerId} />
                    </TabsContent>
                    <TabsContent value="volumetric" className="space-y-4">
                        <CustomerVolumetricTab customerId={customerId} />
                    </TabsContent>
                    <TabsContent value="kyc" className="space-y-4">
                        <CustomerKycTab customerId={customerId} />
                    </TabsContent>
                </Tabs>

                <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
                    {!isFirstTab && (
                        <Button
                            type="button"
                            variant="expressNext"
                            onClick={() => setActiveTab(CUSTOMER_TABS[Math.max(activeTabIndex - 1, 0)].value)}
                        >
                            Previous
                        </Button>
                    )}
                    {isFirstTab && (
                        <Button
                            type="button"
                            variant="expressDanger"
                            onClick={() => router.push('/masters/customers')}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" variant="success" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Customer' : 'Create Customer'}
                    </Button>
                    {!isLastTab && (
                        <Button
                            type="button"
                            variant="expressNext"
                            onClick={() => setActiveTab(CUSTOMER_TABS[Math.min(activeTabIndex + 1, CUSTOMER_TABS.length - 1)].value)}
                        >
                            Next
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    )
}

function decimalToNumber(value: unknown): number | string {
    if (typeof value === 'number' || typeof value === 'string') return value
    if (value && typeof value === 'object' && 'd' in (value as { d?: number[] })) {
        const decimal = value as { s?: number; e?: number; d?: number[] }
        const digits = Array.isArray(decimal.d) ? decimal.d.join('') : ''
        const exponent = decimal.e ?? 0
        const sign = decimal.s === -1 ? '-' : ''
        const parsed = Number(`${sign}${digits}e${exponent}`)
        return Number.isFinite(parsed) ? parsed : ''
    }
    return ''
}

function DisabledCustomerTab({ title }: { title: string }) {
    return (
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                Create the customer first, then this tab can be used for the related APIs.
            </p>
        </div>
    )
}

function getChildRows<T>(response: unknown): T[] {
    if (!response || typeof response !== 'object') return []

    const data = (response as { data?: unknown }).data

    if (Array.isArray(data)) return data as T[]
    if (data && typeof data === 'object') {
        const nestedData = (data as { data?: unknown }).data
        if (Array.isArray(nestedData)) return nestedData as T[]

        const items = (data as { items?: unknown }).items
        if (Array.isArray(items)) return items as T[]

        const documents = (data as { documents?: unknown }).documents
        if (Array.isArray(documents)) return documents as T[]

        const records = (data as { records?: unknown }).records
        if (Array.isArray(records)) return records as T[]
    }

    return []
}

function CustomerFuelSurchargeTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerFuelSurcharge | null>(null)
    const [form, setForm] = useState<CustomerFuelSurchargeFormData>({
        vendorId: 0,
        productId: 0,
        fuelChargeType: 'PERCENTAGE',
        fromDate: '',
        toDate: '',
        fuelSurcharge: 0,
    })

    const { data } = useQuery({
        queryKey: ['customer-fuel-surcharges', customerId],
        queryFn: () => customerService.getCustomerFuelSurcharges(customerId!),
        enabled: !!customerId,
    })
    const { data: vendors } = useQuery({
        queryKey: ['customer-tab-vendors'],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: 'vendorName', sortOrder: 'asc' }),
        enabled: !!customerId,
    })
    const { data: products } = useQuery({
        queryKey: ['customer-tab-products'],
        queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: 'productName', sortOrder: 'asc' }),
        enabled: !!customerId,
    })
    const surchargeRows = getChildRows<CustomerFuelSurcharge>(data)

    const mutation = useMutation({
        mutationFn: (payload: CustomerFuelSurchargeFormData) =>
            editing
                ? customerService.updateCustomerFuelSurcharge(customerId!, editing.id, payload)
                : customerService.addCustomerFuelSurcharge(customerId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-fuel-surcharges', customerId] })
            setOpen(false)
            setEditing(null)
            setForm({ vendorId: 0, productId: 0, fuelChargeType: 'PERCENTAGE', fromDate: '', toDate: '', fuelSurcharge: 0 })
            toast.success(`Fuel surcharge ${editing ? 'updated' : 'added'} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerService.deleteCustomerFuelSurcharge(customerId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-fuel-surcharges', customerId] })
            toast.success('Fuel surcharge deleted successfully')
        },
        onError: (error: Error) => toast.error(error.message),
    })

    if (!customerId) return <DisabledCustomerTab title="Fuel Surcharges" />

    return (
        <CustomerChildTableCard
            title="Fuel Surcharges"
            onAdd={() => {
                setEditing(null)
                setForm({ vendorId: 0, productId: 0, fuelChargeType: 'PERCENTAGE', fromDate: '', toDate: '', fuelSurcharge: 0 })
                setOpen(true)
            }}
            columns={['Vendor', 'Product', 'Type', 'From Date', 'To Date', 'Percentage', 'Action']}
            rows={surchargeRows.map((item) => [
                item.vendor?.vendorName ?? '-',
                item.product?.productName ?? '-',
                item.fuelChargeType,
                formatDate(item.fromDate),
                formatDate(item.toDate),
                String(decimalToNumber(item.fuelSurcharge)),
            ])}
            actions={surchargeRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditing(item)
                        setForm({
                            vendorId: item.vendorId,
                            productId: item.productId,
                            fuelChargeType: item.fuelChargeType,
                            fromDate: item.fromDate.split('T')[0] ?? '',
                            toDate: item.toDate.split('T')[0] ?? '',
                            fuelSurcharge: Number(decimalToNumber(item.fuelSurcharge) || 0),
                        })
                        setOpen(true)
                    }}>Edit</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
                </div>
            ))}
        >
            <CustomerEntityDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit Fuel Surcharge' : 'Add Fuel Surcharge'}
                onSave={() => mutation.mutate(form)}
                saving={mutation.isPending}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SimpleSelect label="Vendor" value={String(form.vendorId || '')} onValueChange={(v) => setForm((prev) => ({ ...prev, vendorId: Number(v) }))} options={(vendors?.data ?? []).map((vendor) => ({ value: String(vendor.id), label: vendor.vendorName }))} />
                    <SimpleSelect label="Product" value={String(form.productId || '')} onValueChange={(v) => setForm((prev) => ({ ...prev, productId: Number(v) }))} options={(products?.data ?? []).map((product) => ({ value: String(product.id), label: product.productName }))} />
                    <SimpleSelect label="Fuel Charge Type" value={form.fuelChargeType} onValueChange={(v) => setForm((prev) => ({ ...prev, fuelChargeType: v }))} options={[{ value: 'PERCENTAGE', label: 'PERCENTAGE' }, { value: 'FIXED', label: 'FIXED' }]} />
                    <SimpleInput label="Fuel Surcharge" type="number" value={String(form.fuelSurcharge)} onChange={(value) => setForm((prev) => ({ ...prev, fuelSurcharge: Number(value) }))} />
                    <SimpleInput label="From Date" type="date" value={form.fromDate} onChange={(value) => setForm((prev) => ({ ...prev, fromDate: value }))} />
                    <SimpleInput label="To Date" type="date" value={form.toDate} onChange={(value) => setForm((prev) => ({ ...prev, toDate: value }))} />
                </div>
            </CustomerEntityDialog>
        </CustomerChildTableCard>
    )
}

function CustomerOtherChargeTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerOtherCharge | null>(null)
    const [form, setForm] = useState<CustomerOtherChargeFormData>({
        vendorId: 0,
        productId: 0,
        srNo: 1,
        chargeType: 'OTHER',
        fromDate: '',
        toDate: '',
        origin: '',
        destination: '',
        amount: 0,
        minimumValue: 0,
    })

    const { data } = useQuery({
        queryKey: ['customer-other-charges', customerId],
        queryFn: () => customerService.getCustomerOtherCharges(customerId!),
        enabled: !!customerId,
    })
    const { data: vendors } = useQuery({
        queryKey: ['customer-tab-vendors'],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: 'vendorName', sortOrder: 'asc' }),
        enabled: !!customerId,
    })
    const { data: products } = useQuery({
        queryKey: ['customer-tab-products'],
        queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: 'productName', sortOrder: 'asc' }),
        enabled: !!customerId,
    })
    const otherChargeRows = getChildRows<CustomerOtherCharge>(data)
    const mutation = useMutation({
        mutationFn: (payload: CustomerOtherChargeFormData) =>
            editing
                ? customerService.updateCustomerOtherCharge(customerId!, editing.id, payload)
                : customerService.addCustomerOtherCharge(customerId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-other-charges', customerId] })
            setOpen(false)
            setEditing(null)
            setForm({ vendorId: 0, productId: 0, srNo: 1, chargeType: 'OTHER', fromDate: '', toDate: '', origin: '', destination: '', amount: 0, minimumValue: 0 })
            toast.success(`Other charge ${editing ? 'updated' : 'added'} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerService.deleteCustomerOtherCharge(customerId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-other-charges', customerId] })
            toast.success('Other charge deleted successfully')
        },
        onError: (error: Error) => toast.error(error.message),
    })
    if (!customerId) return <DisabledCustomerTab title="Other Charges" />
    return (
        <CustomerChildTableCard
            title="Other Charges"
            onAdd={() => { setEditing(null); setForm({ vendorId: 0, productId: 0, srNo: 1, chargeType: 'OTHER', fromDate: '', toDate: '', origin: '', destination: '', amount: 0, minimumValue: 0 }); setOpen(true) }}
            columns={['Sr No', 'Vendor', 'Product', 'Type', 'Origin', 'Destination', 'Amount', 'Min Value', 'Action']}
            rows={otherChargeRows.map((item) => [
                String(item.srNo),
                item.vendor?.vendorName ?? '-',
                item.product?.productName ?? '-',
                item.chargeType,
                item.origin,
                item.destination,
                String(decimalToNumber(item.amount)),
                String(decimalToNumber(item.minimumValue)),
            ])}
            actions={otherChargeRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditing(item)
                        setForm({
                            vendorId: item.vendorId,
                            productId: item.productId,
                            srNo: item.srNo,
                            chargeType: item.chargeType,
                            fromDate: item.fromDate.split('T')[0] ?? '',
                            toDate: item.toDate.split('T')[0] ?? '',
                            origin: item.origin,
                            destination: item.destination,
                            amount: Number(decimalToNumber(item.amount) || 0),
                            minimumValue: Number(decimalToNumber(item.minimumValue) || 0),
                        })
                        setOpen(true)
                    }}>Edit</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
                </div>
            ))}
        >
            <CustomerEntityDialog open={open} onOpenChange={setOpen} title={editing ? 'Edit Other Charge' : 'Add Other Charge'} onSave={() => mutation.mutate(form)} saving={mutation.isPending}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SimpleSelect label="Vendor" value={String(form.vendorId || '')} onValueChange={(v) => setForm((prev) => ({ ...prev, vendorId: Number(v) }))} options={(vendors?.data ?? []).map((vendor) => ({ value: String(vendor.id), label: vendor.vendorName }))} />
                    <SimpleSelect label="Product" value={String(form.productId || '')} onValueChange={(v) => setForm((prev) => ({ ...prev, productId: Number(v) }))} options={(products?.data ?? []).map((product) => ({ value: String(product.id), label: product.productName }))} />
                    <SimpleInput label="Sr No" type="number" value={String(form.srNo)} onChange={(value) => setForm((prev) => ({ ...prev, srNo: Number(value) }))} />
                    <SimpleSelect
                        label="Charge Type"
                        value={form.chargeType}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, chargeType: v }))}
                        options={CUSTOMER_OTHER_CHARGE_TYPES.map((type) => ({ value: type, label: type }))}
                    />
                    <SimpleInput label="From Date" type="date" value={form.fromDate} onChange={(value) => setForm((prev) => ({ ...prev, fromDate: value }))} />
                    <SimpleInput label="To Date" type="date" value={form.toDate} onChange={(value) => setForm((prev) => ({ ...prev, toDate: value }))} />
                    <SimpleInput label="Origin" value={form.origin} onChange={(value) => setForm((prev) => ({ ...prev, origin: value }))} />
                    <SimpleInput label="Destination" value={form.destination} onChange={(value) => setForm((prev) => ({ ...prev, destination: value }))} />
                    <SimpleInput label="Amount" type="number" value={String(form.amount)} onChange={(value) => setForm((prev) => ({ ...prev, amount: Number(value) }))} />
                    <SimpleInput label="Minimum Value" type="number" value={String(form.minimumValue)} onChange={(value) => setForm((prev) => ({ ...prev, minimumValue: Number(value) }))} />
                </div>
            </CustomerEntityDialog>
        </CustomerChildTableCard>
    )
}

function CustomerVolumetricTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerVolumetric | null>(null)
    const [form, setForm] = useState<CustomerVolumetricFormData>({ vendorId: 0, productId: 0, cmDivide: 0, inchDivide: 0, cft: 0 })
    const { data } = useQuery({
        queryKey: ['customer-volumetrics', customerId],
        queryFn: () => customerService.getCustomerVolumetrics(customerId!),
        enabled: !!customerId,
    })
    const { data: vendors } = useQuery({
        queryKey: ['customer-tab-vendors'],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: 'vendorName', sortOrder: 'asc' }),
        enabled: !!customerId,
    })
    const { data: products } = useQuery({
        queryKey: ['customer-tab-products'],
        queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: 'productName', sortOrder: 'asc' }),
        enabled: !!customerId,
    })
    const volumetricRows = getChildRows<CustomerVolumetric>(data)
    const mutation = useMutation({
        mutationFn: (payload: CustomerVolumetricFormData) =>
            editing
                ? customerService.updateCustomerVolumetric(customerId!, editing.id, payload)
                : customerService.addCustomerVolumetric(customerId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-volumetrics', customerId] })
            setOpen(false)
            setEditing(null)
            setForm({ vendorId: 0, productId: 0, cmDivide: 0, inchDivide: 0, cft: 0 })
            toast.success(`Volumetric ${editing ? 'updated' : 'added'} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerService.deleteCustomerVolumetric(customerId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-volumetrics', customerId] })
            toast.success('Volumetric deleted successfully')
        },
        onError: (error: Error) => toast.error(error.message),
    })
    if (!customerId) return <DisabledCustomerTab title="Customer Volumetric" />
    return (
        <CustomerChildTableCard
            title="Customer Volumetric"
            onAdd={() => { setEditing(null); setForm({ vendorId: 0, productId: 0, cmDivide: 0, inchDivide: 0, cft: 0 }); setOpen(true) }}
            columns={['Vendor', 'Product', 'CM Divide', 'Inch Divide', 'CFT', 'Action']}
            rows={volumetricRows.map((item) => [
                item.vendor?.vendorName ?? '-',
                item.product?.productName ?? '-',
                String(decimalToNumber(item.cmDivide)),
                String(decimalToNumber(item.inchDivide)),
                String(decimalToNumber(item.cft)),
            ])}
            actions={volumetricRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditing(item)
                        setForm({
                            vendorId: item.vendorId,
                            productId: item.productId,
                            cmDivide: Number(decimalToNumber(item.cmDivide) || 0),
                            inchDivide: Number(decimalToNumber(item.inchDivide) || 0),
                            cft: Number(decimalToNumber(item.cft) || 0),
                        })
                        setOpen(true)
                    }}>Edit</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
                </div>
            ))}
        >
            <CustomerEntityDialog open={open} onOpenChange={setOpen} title={editing ? 'Edit Volumetric' : 'Add Volumetric'} onSave={() => mutation.mutate(form)} saving={mutation.isPending}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SimpleSelect label="Vendor" value={String(form.vendorId || '')} onValueChange={(v) => setForm((prev) => ({ ...prev, vendorId: Number(v) }))} options={(vendors?.data ?? []).map((vendor) => ({ value: String(vendor.id), label: vendor.vendorName }))} />
                    <SimpleSelect label="Product" value={String(form.productId || '')} onValueChange={(v) => setForm((prev) => ({ ...prev, productId: Number(v) }))} options={(products?.data ?? []).map((product) => ({ value: String(product.id), label: product.productName }))} />
                    <SimpleInput label="CM Divide" type="number" value={String(form.cmDivide)} onChange={(value) => setForm((prev) => ({ ...prev, cmDivide: Number(value) }))} />
                    <SimpleInput label="Inch Divide" type="number" value={String(form.inchDivide)} onChange={(value) => setForm((prev) => ({ ...prev, inchDivide: Number(value) }))} />
                    <SimpleInput label="CFT" type="number" value={String(form.cft)} onChange={(value) => setForm((prev) => ({ ...prev, cft: Number(value) }))} />
                </div>
            </CustomerEntityDialog>
        </CustomerChildTableCard>
    )
}

function CustomerKycTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerKycDocument | null>(null)
    const [form, setForm] = useState<CustomerKycDocumentFormData>({
        docType: 'AADHAAR',
        filePath: '',
        fileName: '',
        documentNumber: '',
        expiryDate: '',
        verified: false,
    })
    const { data } = useQuery({
        queryKey: ['customer-kyc-documents', customerId],
        queryFn: () => customerService.getCustomerKycDocuments(customerId!),
        enabled: !!customerId,
    })
    const kycRows = getChildRows<CustomerKycDocument>(data)
    const mutation = useMutation({
        mutationFn: (payload: CustomerKycDocumentFormData) =>
            editing
                ? customerService.updateCustomerKycDocument(customerId!, editing.id, payload)
                : customerService.addCustomerKycDocument(customerId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-kyc-documents', customerId] })
            setOpen(false)
            setEditing(null)
            setForm({ docType: 'AADHAAR', filePath: '', fileName: '', documentNumber: '', expiryDate: '', verified: false })
            toast.success(`KYC document ${editing ? 'updated' : 'added'} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })
    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerService.deleteCustomerKycDocument(customerId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-kyc-documents', customerId] })
            toast.success('KYC document deleted successfully')
        },
        onError: (error: Error) => toast.error(error.message),
    })
    if (!customerId) return <DisabledCustomerTab title="KYC Details" />
    return (
        <CustomerChildTableCard
            title="KYC Details"
            onAdd={() => { setEditing(null); setForm({ docType: 'AADHAAR', filePath: '', fileName: '', documentNumber: '', expiryDate: '', verified: false }); setOpen(true) }}
            columns={['Doc Type', 'File Name', 'Document Number', 'Expiry Date', 'Verified', 'Action']}
            rows={kycRows.map((item) => [
                item.docType,
                item.fileName,
                item.documentNumber ?? '-',
                item.expiryDate ? formatDate(item.expiryDate) : '-',
                item.verified ? 'Yes' : 'No',
            ])}
            actions={kycRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditing(item)
                        setForm({
                            docType: item.docType,
                            filePath: item.filePath,
                            fileName: item.fileName,
                            documentNumber: item.documentNumber ?? '',
                            expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
                            verified: item.verified ?? false,
                        })
                        setOpen(true)
                    }}>Edit</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
                </div>
            ))}
        >
            <CustomerEntityDialog open={open} onOpenChange={setOpen} title={editing ? 'Edit KYC Document' : 'Add KYC Document'} onSave={() => mutation.mutate(form)} saving={mutation.isPending}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SimpleSelect label="Doc Type" value={form.docType} onValueChange={(v) => setForm((prev) => ({ ...prev, docType: v }))} options={[{ value: 'AADHAAR', label: 'AADHAAR' }, { value: 'AADHAR', label: 'AADHAR' }, { value: 'PAN', label: 'PAN' }, { value: 'GST', label: 'GST' }]} />
                    <SimpleInput label="File Name" value={form.fileName} onChange={(value) => setForm((prev) => ({ ...prev, fileName: value }))} />
                    <SimpleInput label="File Path" value={form.filePath} onChange={(value) => setForm((prev) => ({ ...prev, filePath: value }))} />
                    <SimpleInput label="Document Number" value={form.documentNumber ?? ''} onChange={(value) => setForm((prev) => ({ ...prev, documentNumber: value }))} />
                    <SimpleInput label="Expiry Date" type="date" value={form.expiryDate ?? ''} onChange={(value) => setForm((prev) => ({ ...prev, expiryDate: value }))} />
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Verified</div>
                        <Checkbox checked={form.verified ?? false} onCheckedChange={(value) => setForm((prev) => ({ ...prev, verified: Boolean(value) }))} />
                    </div>
                </div>
            </CustomerEntityDialog>
        </CustomerChildTableCard>
    )
}

function CustomerChildTableCard({
    title,
    onAdd,
    columns,
    rows,
    actions,
    children,
}: {
    title: string
    onAdd: () => void
    columns: string[]
    rows: string[][]
    actions: React.ReactNode[]
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_1px_3px_rgba(23,42,69,0.08)] space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <Button type="button" onClick={onAdd}>Add</Button>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">No records found.</TableCell>
                            </TableRow>
                        ) : rows.map((row, index) => (
                            <TableRow key={`${title}-${index}`}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={`${title}-${index}-${cellIndex}`}>{cell}</TableCell>
                                ))}
                                <TableCell>{actions[index]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {children}
        </div>
    )
}

function CustomerEntityDialog({
    open,
    onOpenChange,
    title,
    onSave,
    saving,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    onSave: () => void
    saving: boolean
    children: React.ReactNode
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Fill the required details and save.</DialogDescription>
                </DialogHeader>
                {children}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" onClick={onSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SimpleInput({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
}) {
    return (
        <div className="space-y-2">
            <div className="text-sm font-medium">{label}</div>
            <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}

function SimpleSelect({
    label,
    value,
    onValueChange,
    options,
}: {
    label: string
    value: string
    onValueChange: (value: string) => void
    options: Array<{ value: string; label: string }>
}) {
    return (
        <div className="space-y-2">
            <div className="text-sm font-medium">{label}</div>
            <Select onValueChange={onValueChange} value={value}>
                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

function formatDate(value: string) {
    return value ? value.split('T')[0] : '-'
}
