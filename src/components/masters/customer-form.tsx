"use client"

import { useEffect, useId, useMemo, useState, type Ref } from "react"
import { useForm, Resolver, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    useFormField,
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
import { customerGroupService } from '@/services/masters/customer-group-service'
import { customerService } from '@/services/masters/customer-service'
import { productService } from "@/services/masters/product-service"
import { serviceCenterService } from '@/services/masters/service-center-service'
import {
    Customer,
    type CustomerFormData,
    type CustomerFuelSurcharge,
    type CustomerFuelSurchargeFormData,
    type CustomerKycDocument,
    type CustomerKycDocumentFormData,
    type CustomerVolumetric,
    type CustomerVolumetricFormData,
} from '@/types/masters/customer'
import type { CustomerGroup } from "@/types/masters/customer-group"
import type { Product } from "@/types/masters/product"
import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select"
import {
    BankFloatingAsyncSelect,
    ServiceCenterFloatingAsyncSelect,
} from "@/components/masters/floating-master-async-selects"
import type { Bank } from "@/types/masters/bank"
import type { ServiceCenter } from "@/types/masters/service-center"
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'
import {
    getInitialPincode,
    normalizePincodeInput,
    requiredPincodeField,
} from '@/lib/pincode-field'

const customerSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional().or(z.literal("")),
    pinCodeId: requiredPincodeField(),
    serviceCenterId: z.coerce.number().int().positive("Service center is required"),
    customerGroupId: z.coerce.number().int().nonnegative().default(0),
    bankId: z.coerce.number().int().positive("Bank is required"),
    bankAccount: z.string().min(1, "Bank account is required"),
    bankIfsc: z.string().min(1, "Bank IFSC is required"),
    telephone: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    serviceStartDate: z.string().min(1, "Service start date is required"),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    origin: z.string().optional().or(z.literal("")),
    gstNo: z.string().optional().or(z.literal("")),
    customerType: z.enum(['INDIVIDUAL', 'CORPORATE']),
    registerType: z.enum(['REGISTERED', 'UNREGISTERED']),
    createDefaultShipper: z.boolean().default(false),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
    initialData?: Customer | null
}

const CUSTOMER_TABS = [
    { value: "personal", label: "Personal Information" },
    { value: "fuel", label: "Fuel Surcharges" },
    { value: "volumetric", label: "Customer Volumetric" },
    { value: "kyc", label: "KYC Details" },
] as const

const ALL_PRODUCTS_OPTION_VALUE = '__ALL_PRODUCTS__'

function CustomerGroupFloatingSelect({
    value,
    onChange,
    queryScope,
    extraGroups,
    triggerRef,
}: {
    value: number
    onChange: (v: number) => void
    queryScope: string
    extraGroups?: CustomerGroup[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<CustomerGroup>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["customer-form", "customer-groups", queryScope]}
            fetchPage={(page, search) =>
                customerGroupService.getCustomerGroups({
                    page,
                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                    sortBy: "code",
                    sortOrder: "asc",
                    search: search || undefined,
                })
            }
            getItemLabel={(g) => `${g.code} — ${g.name}`}
            extraItems={extraGroups}
            value={String(value ?? 0)}
            onValueChange={(v) => onChange(Number(v))}
            clearOption={{ value: "0", label: "None" }}
            placeholder="None — not in a group"
            searchPlaceholder="Search groups…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function CustomerForm({ initialData }: CustomerFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [activeTab, setActiveTab] = useState("personal")
    const activeTabIndex = CUSTOMER_TABS.findIndex((tab) => tab.value === activeTab)
    const customerId = initialData?.id ?? null
    const isFirstTab = activeTabIndex === 0
    const isLastTab = activeTabIndex === CUSTOMER_TABS.length - 1

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (!tab) return
        if (CUSTOMER_TABS.some((item) => item.value === tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    const extraBanks = useMemo((): Bank[] | undefined => {
        const b = initialData?.bank
        if (!b || !initialData?.bankId) return undefined
        return [
            {
                id: b.id,
                bankCode: b.bankCode,
                bankName: b.bankName,
                status: (b.status ?? "ACTIVE") as Bank["status"],
                createdAt: "",
                updatedAt: "",
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
            },
        ]
    }, [initialData?.bank, initialData?.bankId])

    const extraServiceCenters = useMemo((): ServiceCenter[] | undefined => {
        const sc = initialData?.serviceCenter
        if (!sc || !initialData?.serviceCenterId) return undefined
        return [
            {
                id: sc.id,
                code: sc.code,
                name: sc.name,
                subName: sc.subName ?? null,
                address1: null,
                address2: null,
                telephone: null,
                email: null,
                pinCodeId: null,
                countryId: null,
                stateId: null,
                localBranchId: null,
                version: 1,
                createdAt: "",
                updatedAt: "",
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
            },
        ]
    }, [initialData?.serviceCenter, initialData?.serviceCenterId])

    const extraCustomerGroups = useMemo((): CustomerGroup[] | undefined => {
        const g = initialData?.customerGroup
        if (!g || !initialData?.customerGroupId) return undefined
        return [
            {
                id: g.id,
                code: g.code,
                name: g.name,
                version: 1,
                status: (g.status ?? "ACTIVE") as "ACTIVE" | "INACTIVE",
                createdAt: "",
                updatedAt: "",
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
            },
        ]
    }, [initialData?.customerGroup, initialData?.customerGroupId])

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
        defaultValues: {
            code: '',
            name: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCodeId: '',
            serviceCenterId: 0,
            customerGroupId: 0,
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
            customerType: 'INDIVIDUAL',
            registerType: 'REGISTERED',
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
            pinCodeId: getInitialPincode(initialData),
            serviceCenterId: initialData.serviceCenterId ?? initialData.serviceCenter?.id ?? 0,
            customerGroupId: initialData.customerGroupId ?? initialData.customerGroup?.id ?? 0,
            bankId: initialData.bankId ?? initialData.bank?.id ?? 0,
            bankAccount: initialData.bankAccount || '',
            bankIfsc: initialData.bankIfsc || '',
            telephone: initialData.telephone || '',
            email: initialData.email || '',
            mobile: initialData.mobile || '',
            serviceStartDate: initialData.serviceStartDate ? initialData.serviceStartDate.split('T')[0] : '',
            status: initialData.status || 'ACTIVE',
            origin: initialData.origin || '',
            gstNo: initialData.gstNo || '',
            customerType: (initialData.customerType as 'INDIVIDUAL' | 'CORPORATE') || 'INDIVIDUAL',
            registerType: (initialData.registerType as 'REGISTERED' | 'UNREGISTERED') || 'REGISTERED',
            createDefaultShipper: false,
        })
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: CustomerFormValues) => {
            const raw = omitEmptyCodeFields(values, ['code']) as Record<string, unknown>
            delete raw.customerGroupId
            const payload = { ...(raw as unknown as CustomerFormData) }
            const groupId = values.customerGroupId
            if (isEdit) {
                payload.customerGroupId = groupId > 0 ? groupId : null
            } else if (groupId > 0) {
                payload.customerGroupId = groupId
            }
            if (isEdit && initialData) {
                return customerService.updateCustomer(initialData.id, {
                    ...payload,
                    version: initialData.version ?? 1,
                })
            }
            return customerService.createCustomer(payload)
        },
        onSuccess: (saved) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['customer', initialData.id] })
            }
            toast.success(`Customer ${isEdit ? 'updated' : 'created'} successfully`)
            if (!isEdit) {
                const createdId = (saved as { id?: number } | null)?.id
                if (createdId) {
                    router.push(`/masters/customers/${createdId}/edit?tab=fuel`)
                    return
                }
            }
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
                        <TabsTrigger value="volumetric" className="rounded-full px-5 py-2">Customer Volumetric</TabsTrigger>
                        <TabsTrigger value="kyc" className="rounded-full px-5 py-2">KYC Details</TabsTrigger>
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
                                            <FloatingFormItem required label="Customer Name">
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
                                        <FloatingFormItem required label="Contact Person">
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
                                        <FloatingFormItem required label="Email Address">
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
                                            <FloatingFormItem required label="Mobile">
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

                            <FormSection
                                className="md:col-span-2"
                                title="Customer group (optional)"
                                contentClassName="space-y-3 max-w-2xl"
                            >
                                <p className="text-sm text-muted-foreground">
                                    Optional. Assign a group to roll this customer into reports and list filters (Masters → Customer group). Leave as none if this account stands alone.
                                </p>
                                <FormField
                                    control={form.control}
                                    name="customerGroupId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Group">
                                            <CustomerGroupFloatingSelect
                                                triggerRef={field.ref}
                                                value={field.value}
                                                onChange={field.onChange}
                                                queryScope={String(customerId ?? "new")}
                                                extraGroups={extraCustomerGroups}
                                            />
                                        </FloatingFormItem>
                                    )}
                                />
                            </FormSection>

                            <FormSection title="Address & Links" contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address1"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Address / Building" itemClassName="md:col-span-2">
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
                                        <FloatingFormItem required label="Pin Code">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value || ''}
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    onChange={(event) => field.onChange(normalizePincodeInput(event.target.value))}
                                                    placeholder="6-digit pincode"
                                                    className={FLOATING_INNER_CONTROL}
                                                />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceCenterId"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Service Center ID">
                                            <ServiceCenterFloatingAsyncSelect
                                                triggerRef={field.ref}
                                                value={field.value}
                                                onChange={field.onChange}
                                                queryKeyScope={`customer-${String(customerId ?? "new")}`}
                                                extraCenters={extraServiceCenters}
                                            />
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceStartDate"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Service Start Date">
                                            <FormControl>
                                                <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </FormSection>

                            <FormSection title="Account" contentClassName="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="bankId"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Bank">
                                            <BankFloatingAsyncSelect
                                                triggerRef={field.ref}
                                                value={field.value}
                                                onChange={field.onChange}
                                                queryKeyScope={`customer-${String(customerId ?? "new")}`}
                                                extraBanks={extraBanks}
                                            />
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankAccount"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Bank Account">
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
                                        <FloatingFormItem required label="Bank IFSC">
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
                                        <FloatingFormItem required label="Customer Type">
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
                                        <FloatingFormItem required label="Register Type">
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
                                        <FloatingFormItem required label="Status">
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
                                {!isEdit ? (
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
                                ) : null}
                            </FormSection>
                        </div>
                    </TabsContent>

                    <TabsContent value="fuel" className="space-y-4">
                        <CustomerFuelSurchargeTab customerId={customerId} />
                    </TabsContent>
                    <TabsContent value="volumetric" className="space-y-4">
                        <CustomerVolumetricTab customerId={customerId} />
                    </TabsContent>
                    <TabsContent value="kyc" className="space-y-4">
                        <CustomerKycTab customerId={customerId} />
                    </TabsContent>
                </Tabs>

                <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
                    {isEdit && !isFirstTab && (
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
                    {isEdit && !isLastTab && (
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

        const kycDocuments = (data as { kycDocuments?: unknown }).kycDocuments
        if (Array.isArray(kycDocuments)) return kycDocuments as T[]

        const records = (data as { records?: unknown }).records
        if (Array.isArray(records)) return records as T[]
    }

    return []
}

function CustomerFuelSurchargeTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const fuelProductSelectId = useId()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerFuelSurcharge | null>(null)
    const [form, setForm] = useState<CustomerFuelSurchargeFormData>({
        productId: undefined,
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
            setForm({ productId: undefined, fuelChargeType: 'PERCENTAGE', fromDate: '', toDate: '', fuelSurcharge: 0 })
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
                setForm({ productId: undefined, fuelChargeType: 'PERCENTAGE', fromDate: '', toDate: '', fuelSurcharge: 0 })
                setOpen(true)
            }}
            columns={['Product', 'Type', 'From Date', 'To Date', 'Percentage', 'Action']}
            rows={surchargeRows.map((item) => [
                item.product?.productName ?? 'All Products',
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
                            productId: item.productId ?? undefined,
                            fuelChargeType:
                                item.fuelChargeType === 'FIXED' ? 'FLAT' : item.fuelChargeType,
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
                    <div className="space-y-2">
                        <label htmlFor={fuelProductSelectId} className="text-sm font-medium">
                            Product
                        </label>
                        <DbAsyncSelect<Product>
                            id={fuelProductSelectId}
                            queryKey={["customer-fuel-surcharge", "products", customerId ?? 0, editing?.id ?? "new"]}
                            fetchPage={(page, search) =>
                                productService.getProducts({
                                    page,
                                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                                    search: search || undefined,
                                    sortBy: "productName",
                                    sortOrder: "asc",
                                })
                            }
                            getItemLabel={(p) => p.productName}
                            extraItems={
                                editing?.productId != null && editing.product
                                    ? [
                                          {
                                              id: editing.productId,
                                              productCode: editing.product.productCode ?? "",
                                              productName: editing.product.productName ?? `Product ${editing.productId}`,
                                              version: 1,
                                              productType: "DOMESTIC",
                                              status: "ACTIVE",
                                              createdAt: "",
                                              updatedAt: "",
                                              createdById: null,
                                              updatedById: null,
                                              deletedAt: null,
                                              deletedById: null,
                                          },
                                      ]
                                    : undefined
                            }
                            value={
                                form.productId != null
                                    ? String(form.productId)
                                    : !editing
                                      ? ALL_PRODUCTS_OPTION_VALUE
                                      : undefined
                            }
                            onValueChange={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    productId: value === ALL_PRODUCTS_OPTION_VALUE ? undefined : Number(value),
                                }))
                            }
                            clearOption={
                                !editing ? { value: ALL_PRODUCTS_OPTION_VALUE, label: "All Products" } : undefined
                            }
                            placeholder="All products"
                            searchPlaceholder="Search products…"
                            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
                        />
                    </div>
                    <SimpleSelect
                        label="Fuel Charge Type"
                        value={form.fuelChargeType}
                        onValueChange={(v) =>
                            setForm((prev) => ({
                                ...prev,
                                fuelChargeType: v === 'FIXED' ? 'FLAT' : v,
                            }))
                        }
                        options={[
                            { value: 'PERCENTAGE', label: 'PERCENTAGE' },
                            { value: 'FLAT', label: 'FLAT' },
                        ]}
                    />
                    <SimpleInput label="Fuel Surcharge" type="number" value={String(form.fuelSurcharge)} onChange={(value) => setForm((prev) => ({ ...prev, fuelSurcharge: Number(value) }))} />
                    <SimpleInput label="From Date" type="date" value={form.fromDate} onChange={(value) => setForm((prev) => ({ ...prev, fromDate: value }))} />
                    <SimpleInput label="To Date" type="date" value={form.toDate} onChange={(value) => setForm((prev) => ({ ...prev, toDate: value }))} />
                </div>
                {!editing ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                        Leave Product as All Products to create the same fuel surcharge for every product.
                    </p>
                ) : null}
            </CustomerEntityDialog>
        </CustomerChildTableCard>
    )
}

function CustomerVolumetricTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const volumetricProductSelectId = useId()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<CustomerVolumetric | null>(null)
    const [form, setForm] = useState<CustomerVolumetricFormData>({ productId: 0, cft: 5000 })
    const { data } = useQuery({
        queryKey: ['customer-volumetrics', customerId],
        queryFn: () => customerService.getCustomerVolumetrics(customerId!),
        enabled: !!customerId,
    })
    const volumetricRows = getChildRows<CustomerVolumetric>(data)
    const takenProductIds = useMemo(() => {
        const s = new Set(volumetricRows.map((r) => r.productId))
        if (editing) s.delete(editing.productId)
        return s
    }, [volumetricRows, editing])
    const mutation = useMutation({
        mutationFn: (payload: CustomerVolumetricFormData) =>
            editing
                ? customerService.updateCustomerVolumetric(customerId!, editing.id, payload)
                : customerService.addCustomerVolumetric(customerId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-volumetrics', customerId] })
            setOpen(false)
            setEditing(null)
            setForm({ productId: 0, cft: 5000 })
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
            onAdd={() => {
                setEditing(null)
                setForm({ productId: 0, cft: 5000 })
                setOpen(true)
            }}
            columns={['Product', 'CFT', 'Action']}
            rows={volumetricRows.map((item) => [
                item.product?.productName ?? '-',
                String(decimalToNumber(item.cft)),
            ])}
            actions={volumetricRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditing(item)
                        setForm({
                            productId: item.productId,
                            cft: Number(decimalToNumber(item.cft) || 0),
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
                title={editing ? 'Edit Volumetric' : 'Add Volumetric'}
                onSave={() => {
                    if (!form.productId || form.productId < 1) {
                        toast.error('Select a product')
                        return
                    }
                    if (!Number.isFinite(form.cft) || form.cft <= 0) {
                        toast.error('CFT must be greater than 0')
                        return
                    }
                    mutation.mutate(form)
                }}
                saving={mutation.isPending}
            >
                <p className="mb-3 text-sm text-muted-foreground">
                    One row per product. CFT is the divisor for volumetric weight (L×W×H / CFT); the default in billing when unset is 5000.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor={volumetricProductSelectId} className="text-sm font-medium">
                            Product
                        </label>
                        <DbAsyncSelect<Product>
                            id={volumetricProductSelectId}
                            queryKey={["customer-volumetric", "products", customerId ?? 0, editing?.id ?? "new"]}
                            fetchPage={(page, search) =>
                                productService.getProducts({
                                    page,
                                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                                    search: search || undefined,
                                    sortBy: "productName",
                                    sortOrder: "asc",
                                })
                            }
                            getItemLabel={(p) => p.productName}
                            visibleItem={(p) => !takenProductIds.has(p.id)}
                            extraItems={
                                editing?.productId != null && editing.product
                                    ? [
                                          {
                                              id: editing.productId,
                                              productCode: editing.product.productCode ?? "",
                                              productName: editing.product.productName ?? `Product ${editing.productId}`,
                                              version: 1,
                                              productType: "DOMESTIC",
                                              status: "ACTIVE",
                                              createdAt: "",
                                              updatedAt: "",
                                              createdById: null,
                                              updatedById: null,
                                              deletedAt: null,
                                              deletedById: null,
                                          },
                                      ]
                                    : undefined
                            }
                            value={form.productId > 0 ? String(form.productId) : undefined}
                            onValueChange={(v) => setForm((prev) => ({ ...prev, productId: Number(v) }))}
                            placeholder="Select product"
                            searchPlaceholder="Search products…"
                            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
                        />
                    </div>
                    <SimpleInput label="CFT" type="number" value={String(form.cft)} onChange={(value) => setForm((prev) => ({ ...prev, cft: Number(value) }))} />
                </div>
            </CustomerEntityDialog>
        </CustomerChildTableCard>
    )
}

const KYC_DOC_TYPE_OPTIONS = [
    { value: 'AADHAAR', label: 'AADHAAR' },
    { value: 'PAN', label: 'PAN' },
    { value: 'GST', label: 'GST' },
    { value: 'PASSPORT', label: 'PASSPORT' },
    { value: 'VOTER_ID', label: 'VOTER ID' },
] as const

function CustomerKycTab({ customerId }: { customerId: number | null }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [kycFile, setKycFile] = useState<File | null>(null)
    const [fileInputKey, setFileInputKey] = useState(0)
    const [editing, setEditing] = useState<CustomerKycDocument | null>(null)
    const [form, setForm] = useState<CustomerKycDocumentFormData>({
        docType: 'AADHAAR',
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
        mutationFn: (input: { form: CustomerKycDocumentFormData; file: File | null }) =>
            editing
                ? customerService.updateCustomerKycDocument(customerId!, editing.id, input.form, input.file)
                : customerService.addCustomerKycDocument(customerId!, input.form, input.file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-kyc-documents', customerId] })
            setOpen(false)
            setEditing(null)
            setKycFile(null)
            setFileInputKey((k) => k + 1)
            setForm({ docType: 'AADHAAR', fileName: '', documentNumber: '', expiryDate: '', verified: false })
            toast.success('KYC document saved successfully')
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
            onAdd={() => {
                setEditing(null)
                setKycFile(null)
                setFileInputKey((k) => k + 1)
                setForm({ docType: 'AADHAAR', fileName: '', documentNumber: '', expiryDate: '', verified: false })
                setOpen(true)
            }}
            columns={['Doc Type', 'File', 'Document Number', 'Expiry Date', 'Verified', 'Action']}
            rows={kycRows.map((item) => [
                item.docType,
                item.fileName || item.filePath || '—',
                item.documentNumber ?? '-',
                item.expiryDate ? formatDate(item.expiryDate) : '-',
                item.verified ? 'Yes' : 'No',
            ])}
            actions={kycRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                        setEditing(item)
                        setKycFile(null)
                        setFileInputKey((k) => k + 1)
                        setForm({
                            docType: item.docType,
                            fileName: item.fileName ?? '',
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
            <CustomerEntityDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? 'Edit KYC Document' : 'Add KYC Document'}
                onSave={() => mutation.mutate({ form, file: kycFile })}
                saving={mutation.isPending}
            >
                <p className="mb-3 text-sm text-muted-foreground">
                    Upload a document file if you have one. You can still save the row with only doc type and other details.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SimpleSelect
                        label="Doc Type"
                        value={form.docType}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, docType: v }))}
                        options={[...KYC_DOC_TYPE_OPTIONS]}
                    />
                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-medium">Document file (optional)</div>
                        <Input
                            key={fileInputKey}
                            type="file"
                            className={FLOATING_INNER_CONTROL}
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null
                                setKycFile(f)
                                if (f) {
                                    setForm((prev) => ({ ...prev, fileName: f.name }))
                                }
                            }}
                        />
                        {kycFile ? <p className="text-xs text-muted-foreground">Selected: {kycFile.name}</p> : null}
                        {editing && (editing.fileName || editing.filePath) && !kycFile ? (
                            <p className="text-xs text-muted-foreground">
                                Current: {editing.fileName || editing.filePath}
                                {'. '}Choose a new file to replace it.
                            </p>
                        ) : null}
                    </div>
                    <SimpleInput
                        label="File name (optional)"
                        value={form.fileName ?? ''}
                        onChange={(value) => setForm((prev) => ({ ...prev, fileName: value }))}
                    />
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
