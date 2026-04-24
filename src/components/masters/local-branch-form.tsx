"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

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
import { serviceCenterService } from '@/services/masters/service-center-service'
import { LocalBranch, type LocalBranchFormData } from '@/types/masters/local-branch'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import {
    getInitialPincode,
    normalizePincodeInput,
    requiredPincodeField,
} from '@/lib/pincode-field'

const localBranchSchema = z.object({
    branchCode: optionalMasterCode(2),
    companyName: z.string().min(3, "Company name must be at least 3 characters"),
    name: z.string().min(3, "Branch name must be at least 3 characters"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional().nullable(),
    pinCodeId: requiredPincodeField(),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    telephone: z.string().optional().nullable(),
    email: z.string().email("Invalid email address"),
    panNo: z.string().optional().nullable(),
    gstNo: z.string().optional().nullable(),
})

type LocalBranchFormValues = z.infer<typeof localBranchSchema>

interface LocalBranchFormProps {
    initialData?: LocalBranch | null
}

export function LocalBranchForm({ initialData }: LocalBranchFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [serviceCenterOpen, setServiceCenterOpen] = useState(false)
    const [serviceCenterSearch, setServiceCenterSearch] = useState('')
    const debouncedServiceCenterSearch = useDebounce(serviceCenterSearch, 300)

    const { data: serviceCentersData, isFetching: isServiceCentersFetching } = useQuery({
        queryKey: ['local-branch-service-centers', debouncedServiceCenterSearch],
        queryFn: () => serviceCenterService.getServiceCenters({
            limit: 25,
            search: debouncedServiceCenterSearch,
            sortBy: 'code',
            sortOrder: 'asc',
        }),
        enabled: serviceCenterOpen || !!initialData?.serviceCenterId,
        staleTime: 5 * 60 * 1000,
    })

    const form = useForm<LocalBranchFormValues>({
        resolver: zodResolver(localBranchSchema) as Resolver<LocalBranchFormValues>,
        defaultValues: {
            branchCode: initialData?.branchCode || '',
            companyName: initialData?.companyName || '',
            name: initialData?.name || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            pinCodeId: getInitialPincode(initialData),
            serviceCenterId: initialData?.serviceCenterId || 0,
            telephone: initialData?.telephone || '',
            email: initialData?.email || '',
            panNo: initialData?.panNo || '',
            gstNo: initialData?.gstNo || '',
        }
    })

    useEffect(() => {
        if (!initialData) return
        form.reset({
            branchCode: initialData.branchCode,
            companyName: initialData.companyName,
            name: initialData.name,
            address1: initialData.address1,
            address2: initialData.address2 || '',
            pinCodeId: getInitialPincode(initialData),
            serviceCenterId: initialData.serviceCenterId || 0,
            telephone: initialData.telephone || '',
            email: initialData.email,
            panNo: initialData.panNo || '',
            gstNo: initialData.gstNo || '',
        })
    }, [initialData, form])

    useEffect(() => {
        if (!serviceCenterOpen) setServiceCenterSearch('')
    }, [serviceCenterOpen])

    const selectedServiceCenter = useMemo(() => {
        const selectedId = form.getValues('serviceCenterId')
        const match = serviceCentersData?.data?.find((serviceCenter) => serviceCenter.id === selectedId)
        if (match) return match
        if (initialData?.serviceCenterId === selectedId && initialData.serviceCenter) {
            return initialData.serviceCenter
        }
        return null
    }, [form, initialData, serviceCentersData?.data])

    const mutation = useMutation({
        mutationFn: (values: LocalBranchFormValues) => {
            const payload = omitEmptyCodeFields(values, ['branchCode']) as LocalBranchFormData

            return isEdit
                ? localBranchService.updateLocalBranch(initialData!.id, payload)
                : localBranchService.createLocalBranch(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['local-branches'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['local-branch', initialData.id] })
            }
            toast.success(`Local Branch ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/local-branches')
        },
        onError: (error: Error) => {
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
                    <FormSection title="Branch Information" contentClassName="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="branchCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Branch Code (optional)">
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
                                    <Popover open={serviceCenterOpen} onOpenChange={setServiceCenterOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={serviceCenterOpen}
                                                    className={cn(
                                                        FLOATING_INNER_COMBO,
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <span className="truncate">
                                                        {selectedServiceCenter
                                                            ? `${selectedServiceCenter.name} (${selectedServiceCenter.code})`
                                                            : "Search service center..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search service center..."
                                                    value={serviceCenterSearch}
                                                    onValueChange={setServiceCenterSearch}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No service center found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {serviceCentersData?.data?.map((serviceCenter) => (
                                                            <CommandItem
                                                                key={serviceCenter.id}
                                                                value={`${serviceCenter.name} ${serviceCenter.code}`}
                                                                onSelect={() => {
                                                                    form.setValue("serviceCenterId", serviceCenter.id)
                                                                    setServiceCenterOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value === serviceCenter.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {serviceCenter.name} ({serviceCenter.code})
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                    {isServiceCentersFetching ? (
                                                        <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Loading service centers...
                                                        </div>
                                                    ) : null}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection title="Contact Details" contentClassName="space-y-4">
                        <FormField
                            control={form.control}
                            name="telephone"
                            render={({ field }) => (
                                <FloatingFormItem label="Telephone">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Telephone" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
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
                    </FormSection>

                    <FormSection
                        className="lg:col-span-2"
                        title="Address Details"
                        contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FloatingFormItem label="Address Line 1" itemClassName="md:col-span-2">
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
                                <FloatingFormItem label="Address Line 2" itemClassName="md:col-span-2">
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="Area, Landmark" className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pinCodeId"
                            render={({ field }) => (
                                <FloatingFormItem label="Pin Code" itemClassName="md:col-span-2">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value || ''}
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="452001"
                                            className={FLOATING_INNER_CONTROL}
                                            onChange={(event) => field.onChange(normalizePincodeInput(event.target.value))}
                                        />
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
                        onClick={() => router.push('/masters/local-branches')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? 'Saving...' : isEdit ? 'Update Branch' : 'Add Branch'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
