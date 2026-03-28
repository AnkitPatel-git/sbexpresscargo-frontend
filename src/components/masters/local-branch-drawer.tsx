"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

interface LocalBranchDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branch?: LocalBranch | null
}

export function LocalBranchDrawer({ open, onOpenChange, branch }: LocalBranchDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!branch
    const [scOpen, setScOpen] = useState(false)
    const [stateOpen, setStateOpen] = useState(false)
    const [billingStateOpen, setBillingStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const { data: scData, isLoading: isScLoading } = useQuery({
        queryKey: ['service-centers-minimal'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
        enabled: open
    })

    const form = useForm<LocalBranchFormValues>({
        resolver: zodResolver(localBranchSchema) as Resolver<LocalBranchFormValues>,
        defaultValues: {
            branchCode: '',
            companyName: '',
            name: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            serviceCenterId: 0,
            telephone1: '',
            telephone2: '',
            fax: '',
            website: '',
            email: '',
            panNo: '',
            serviceTaxNo: '',
            billingState: '',
            stateCode: '',
            gstNo: '',
            serviceRegistrationNo: '',
            bankName: '',
            accountNo: '',
            accountName: '',
            bankAddress: '',
            ifsc: '',
            micr: '',
            lastInvoiceNo: 0,
            invoicePrefix: '',
            invoiceSuffix: '',
            lastFreeFormInvoiceNo: 0,
            freeFormPrefix: '',
            freeFormSuffix: '',
            debitNotePrefix: '',
            debitNoteLastInvoiceNo: 0,
            debitNoteSuffix: '',
            creditNotePrefix: '',
            creditNoteLastInvoiceNo: 0,
            creditNoteSuffix: '',
            rcpLastNo: 0,
        }
    })

    useEffect(() => {
        if (branch) {
            form.reset({
                branchCode: branch.branchCode,
                companyName: branch.companyName,
                name: branch.name,
                address1: branch.address1,
                address2: branch.address2 || '',
                pinCode: branch.pinCode,
                city: branch.city,
                state: branch.state,
                serviceCenterId: branch.serviceCenterId || 0,
                telephone1: branch.telephone1,
                telephone2: branch.telephone2 || '',
                fax: branch.fax || '',
                website: branch.website || '',
                email: branch.email,
                panNo: branch.panNo || '',
                serviceTaxNo: branch.serviceTaxNo || '',
                billingState: branch.billingState || '',
                stateCode: branch.stateCode || '',
                gstNo: branch.gstNo,
                serviceRegistrationNo: branch.serviceRegistrationNo || '',
                bankName: branch.bankName || '',
                accountNo: branch.accountNo || '',
                accountName: branch.accountName || '',
                bankAddress: branch.bankAddress || '',
                ifsc: branch.ifsc || '',
                micr: branch.micr || '',
                lastInvoiceNo: branch.lastInvoiceNo || 0,
                invoicePrefix: branch.invoicePrefix || '',
                invoiceSuffix: branch.invoiceSuffix || '',
                lastFreeFormInvoiceNo: branch.lastFreeFormInvoiceNo || 0,
                freeFormPrefix: branch.freeFormPrefix || '',
                freeFormSuffix: branch.freeFormSuffix || '',
                debitNotePrefix: branch.debitNotePrefix || '',
                debitNoteLastInvoiceNo: branch.debitNoteLastInvoiceNo || 0,
                debitNoteSuffix: branch.debitNoteSuffix || '',
                creditNotePrefix: branch.creditNotePrefix || '',
                creditNoteLastInvoiceNo: branch.creditNoteLastInvoiceNo || 0,
                creditNoteSuffix: branch.creditNoteSuffix || '',
                rcpLastNo: branch.rcpLastNo || 0,
            })
        } else {
            form.reset({
                branchCode: '',
                companyName: '',
                name: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                serviceCenterId: 0,
                telephone1: '',
                telephone2: '',
                fax: '',
                website: '',
                email: '',
                panNo: '',
                serviceTaxNo: '',
                billingState: '',
                stateCode: '',
                gstNo: '',
                serviceRegistrationNo: '',
                bankName: '',
                accountNo: '',
                accountName: '',
                bankAddress: '',
                ifsc: '',
                micr: '',
                lastInvoiceNo: 0,
                invoicePrefix: '',
                invoiceSuffix: '',
                lastFreeFormInvoiceNo: 0,
                freeFormPrefix: '',
                freeFormSuffix: '',
                debitNotePrefix: '',
                debitNoteLastInvoiceNo: 0,
                debitNoteSuffix: '',
                creditNotePrefix: '',
                creditNoteLastInvoiceNo: 0,
                creditNoteSuffix: '',
                rcpLastNo: 0,
            })
        }
    }, [branch, form])

    const mutation = useMutation({
        mutationFn: (values: LocalBranchFormValues) =>
            isEdit
                ? localBranchService.updateLocalBranch(branch!.id, values)
                : localBranchService.createLocalBranch(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['local-branches'] })
            toast.success(`Local Branch ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} local branch`)
        }
    })

    const onSubmit = (values: LocalBranchFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[700px] flex flex-col h-full p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle>{isEdit ? 'Edit Local Branch' : 'Add Local Branch'}</SheetTitle>
                    <SheetDescription>
                        Fill in the details for the local branch.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
                            {/* Branch Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Branch Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="branchCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Branch Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. BR001" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Branch Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Mumbai Main" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Company Name" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceCenterId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="mb-1">Service Center</FormLabel>
                                                <Popover open={scOpen} onOpenChange={setScOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={scOpen}
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Address</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="address1"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Building/Street</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Building name, Street" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address2"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Area/Landmark (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Area, Landmark" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="City" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pinCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Pin Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="6-digit Pincode" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="mb-1">State</FormLabel>
                                                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={stateOpen}
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? statesData?.data?.find((state: any) => state.stateName === field.value)?.stateName
                                                                    : "Select state..."}
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Contact Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="telephone1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telephone 1</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Telephone 1" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="telephone2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telephone 2 (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Telephone 2" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="email@example.com" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Website (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="https://..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Billing & Tax Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Billing & Tax Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="gstNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>GST Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="15-digit GSTIN" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="panNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PAN Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="PAN No" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceTaxNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Tax No</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Service Tax No" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceRegistrationNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Reg. No</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Service Reg No" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="billingState"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="mb-1">Billing State</FormLabel>
                                                <Popover open={billingStateOpen} onOpenChange={setBillingStateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={billingStateOpen}
                                                                className={cn(
                                                                    "w-full justify-between font-normal",
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
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="stateCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="e.g. 27" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Banking Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Bank Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bankName"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Bank Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Bank Name" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="accountNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Account Number" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="accountName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Account Name" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ifsc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IFSC Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="IFSC Code" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="micr"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>MICR Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="MICR Code" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankAddress"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Bank Address</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="Bank Branch Address" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Invoice Series Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Invoice & Series Management</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="invoicePrefix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Inv. Prefix</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="INV-" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastInvoiceNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Inv No</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value || 0} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="invoiceSuffix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Inv. Suffix</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="-24" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <FormField
                                        control={form.control}
                                        name="debitNotePrefix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>DN Prefix</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="DN-" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="debitNoteLastInvoiceNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last DN No</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value || 0} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="debitNoteSuffix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>DN Suffix</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="-24" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="creditNotePrefix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CN Prefix</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="CN-" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="creditNoteLastInvoiceNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last CN No</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} value={field.value || 0} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="creditNoteSuffix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CN Suffix</FormLabel>
                                                <FormControl>
                                                    <Input {...field} value={field.value || ''} placeholder="-24" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t bg-background">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Branch' : 'Add Branch'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
