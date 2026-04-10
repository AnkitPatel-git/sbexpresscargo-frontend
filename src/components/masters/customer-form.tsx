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
    FLOATING_INNER_SELECT_TRIGGER,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormSection } from "@/components/ui/form-section"
import { customerService } from '@/services/masters/customer-service'
import { stateService } from '@/services/masters/state-service'
import { Customer, type CustomerFormData } from '@/types/masters/customer'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const customerSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional(),
    pinCodeId: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    telephone: z.string().min(10, "Telephone must be at least 10 characters"),
    faxNo: z.string().optional(),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    billingState: z.string().optional(),
    serviceCenter: z.string().optional(),
    startDate: z.string().optional(),
    origin: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    customerType: z.enum(['CUSTOMER', 'VENDOR', 'AGENT']),
    registerType: z.enum(['REGISTERED', 'UNREGISTERED']),
    gstNo: z.string().min(15, "GST Number must be 15 characters"),
    aadhaarNo: z.string().optional(),
    dobOnAadhaar: z.string().optional(),
    passportNo: z.string().optional(),
    panNo: z.string().optional(),
    tanNo: z.string().optional(),
    invoiceFormat: z.string().optional(),
    signatureFile: z.string().optional(),
    logoFile: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
    initialData?: Customer | null
}

export function CustomerForm({ initialData }: CustomerFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            contactPerson: initialData?.contactPerson || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            pinCodeId: initialData?.pinCodeId != null ? String(initialData.pinCodeId) : '',
            city: initialData?.city || initialData?.serviceablePincode?.cityName || '',
            state: initialData?.state || initialData?.stateMaster?.stateName || '',
            telephone: initialData?.telephone || '',
            faxNo: initialData?.faxNo || '',
            email: initialData?.email || '',
            mobile: initialData?.mobile || '',
            billingState: initialData?.billingState || '',
            serviceCenter: initialData?.serviceCenter?.name || '',
            startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : '',
            origin: initialData?.origin || '',
            status: initialData?.status || 'ACTIVE',
            customerType: initialData?.customerType || 'CUSTOMER',
            registerType: initialData?.registerType || 'REGISTERED',
            gstNo: initialData?.gstNo || '',
            aadhaarNo: initialData?.aadhaarNo || '',
            dobOnAadhaar: initialData?.dobOnAadhaar ? initialData.dobOnAadhaar.split('T')[0] : '',
            passportNo: initialData?.passportNo || '',
            panNo: initialData?.panNo || '',
            tanNo: initialData?.tanNo || '',
            invoiceFormat: initialData?.invoiceFormat || '',
            signatureFile: initialData?.signatureFile || '',
            logoFile: initialData?.logoFile || '',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code,
                name: initialData.name,
                contactPerson: initialData.contactPerson || '',
                address1: initialData.address1 || '',
                address2: initialData.address2 || '',
                pinCodeId: initialData.pinCodeId != null ? String(initialData.pinCodeId) : '',
                city: initialData.city || initialData.serviceablePincode?.cityName || '',
                state: initialData.state || initialData.stateMaster?.stateName || '',
                telephone: initialData.telephone || '',
                faxNo: initialData.faxNo || '',
                email: initialData.email || '',
                mobile: initialData.mobile || '',
                billingState: initialData.billingState || '',
                serviceCenter: initialData.serviceCenter?.name || '',
                startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
                origin: initialData.origin || '',
                status: initialData.status,
                customerType: initialData.customerType || 'CUSTOMER',
                registerType: initialData.registerType || 'REGISTERED',
                gstNo: initialData.gstNo || '',
                aadhaarNo: initialData.aadhaarNo || '',
                dobOnAadhaar: initialData.dobOnAadhaar ? initialData.dobOnAadhaar.split('T')[0] : '',
                passportNo: initialData.passportNo || '',
                panNo: initialData.panNo || '',
                tanNo: initialData.tanNo || '',
                invoiceFormat: initialData.invoiceFormat || '',
                signatureFile: initialData.signatureFile || '',
                logoFile: initialData.logoFile || '',
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: CustomerFormValues) => {
            const payload = omitEmptyCodeFields(values, ['code']) as CustomerFormValues
            if (isEdit && initialData) {
                const updateBody: Partial<CustomerFormData> = {
                    ...payload,
                    version: initialData.version ?? 1,
                }
                return customerService.updateCustomer(initialData.id, updateBody)
            }
            return customerService.createCustomer(payload as CustomerFormData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['customer', initialData.id] })
            }
            toast.success(`Customer ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/customers')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} customer`)
        }
    })

    const onSubmit = (values: CustomerFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
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

                    {/* Contact Details */}
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
                                name="faxNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Fax No">
                                        <FormControl>
                                            <Input {...field} placeholder="Optional" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
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
                                    <FloatingFormItem label="Pin code (id or code)">
                                        <FormControl>
                                            <Input {...field} placeholder="486001 or id" className={FLOATING_INNER_CONTROL} />
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
                            <FormField
                                control={form.control}
                                name="billingState"
                                render={({ field }) => (
                                    <FloatingFormItem label="Billing state">
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Maharashtra" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="origin"
                                render={({ field }) => (
                                    <FloatingFormItem label="Origin">
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. MUMBAI" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="serviceCenter"
                                render={({ field }) => (
                                    <FloatingFormItem label="Service center (code or name)">
                                        <FormControl>
                                            <Input {...field} placeholder="Bruno: e.g. VASAI" className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FloatingFormItem label="Start date">
                                        <FormControl>
                                            <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* IDs & files */}
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
                                    name="passportNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Passport">
                                            <FormControl>
                                                <Input {...field} className={FLOATING_INNER_CONTROL} />
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
                                    name="tanNo"
                                    render={({ field }) => (
                                        <FloatingFormItem label="TAN">
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
                                        <FloatingFormItem label="Invoice format">
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. standard" className={FLOATING_INNER_CONTROL} />
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
                                        <FloatingFormItem label="Signature file URL">
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
                                        <FloatingFormItem label="Logo file URL">
                                            <FormControl>
                                                <Input {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                    </FormSection>

                    {/* Classification & Status */}
                    <FormSection
                        className="md:col-span-2"
                        title="Classification & Status"
                        contentClassName="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
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
                                                <SelectItem value="CUSTOMER">Customer</SelectItem>
                                                <SelectItem value="VENDOR">Vendor</SelectItem>
                                                <SelectItem value="AGENT">Agent</SelectItem>
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
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/customers')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Customer' : 'Create Customer'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
