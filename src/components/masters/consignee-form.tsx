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
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { consigneeService } from '@/services/masters/consignee-service'
import { stateService } from '@/services/masters/state-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { Consignee } from '@/types/masters/consignee'

const consigneeSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    destination: z.string().optional(),
    contactPerson: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    pinCode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    industry: z.string().optional(),
    tel1: z.string().optional(),
    tel2: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")),
    mobile: z.string().optional(),
    serviceCenterId: z.number().optional(),
    serviceCenterCode: z.string().optional(),
    eori: z.string().optional(),
    vat: z.string().optional(),
})

type ConsigneeFormValues = z.infer<typeof consigneeSchema>

interface ConsigneeFormProps {
    initialData?: Consignee | null
}

export function ConsigneeForm({ initialData }: ConsigneeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const [scOpen, setScOpen] = useState(false)
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const form = useForm<ConsigneeFormValues>({
        resolver: zodResolver(consigneeSchema) as Resolver<ConsigneeFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            destination: initialData?.destination || '',
            contactPerson: initialData?.contactPerson || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            pinCode: initialData?.pinCode || '',
            city: initialData?.city || '',
            state: initialData?.state || '',
            industry: initialData?.industry || '',
            tel1: initialData?.tel1 || '',
            tel2: initialData?.tel2 || '',
            fax: initialData?.fax || '',
            email: initialData?.email || '',
            mobile: initialData?.mobile || '',
            serviceCenterId: initialData?.serviceCenterId || initialData?.serviceCenter?.id || 0,
            serviceCenterCode: initialData?.serviceCenter?.code || '',
            eori: initialData?.eori || '',
            vat: initialData?.vat || '',
        }
    })

    useEffect(() => {
        if (initialData && scData?.data) {
            // Find SC ID/Code if initialData only has one or the other
            const serviceCenterId = initialData.serviceCenterId || initialData.serviceCenter?.id || 0;
            const serviceCenterCode = initialData.serviceCenter?.code || scData.data.find(sc => sc.id === serviceCenterId)?.code || '';

            form.reset({
                code: initialData.code,
                name: initialData.name,
                destination: initialData.destination || '',
                contactPerson: initialData.contactPerson || '',
                address1: initialData.address1 || '',
                address2: initialData.address2 || '',
                pinCode: initialData.pinCode || '',
                city: initialData.city || '',
                state: initialData.state || '',
                industry: initialData.industry || '',
                tel1: initialData.tel1 || '',
                tel2: initialData.tel2 || '',
                fax: initialData.fax || '',
                email: initialData.email || '',
                mobile: initialData.mobile || '',
                serviceCenterId,
                serviceCenterCode,
                eori: initialData.eori || '',
                vat: initialData.vat || '',
            })
        }
    }, [initialData, form, scData])

    const mutation = useMutation({
        mutationFn: (values: ConsigneeFormValues) =>
            isEdit
                ? consigneeService.updateConsignee(initialData!.id, values as any)
                : consigneeService.createConsignee(values as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consignees'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['consignee', initialData.id] })
            }
            toast.success(`Consignee ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/consignee')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} consignee`)
        }
    })

    const onSubmit = (values: ConsigneeFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Basic Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Consignee Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="CONS01" {...field} />
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
                                            <FormLabel>Consignee Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Receiver Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="industry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Industry</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Retail" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                                        className={cn(
                                                            "w-full justify-between font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? scData?.data?.find(sc => sc.id === field.value)?.name
                                                            : "Select service center..."}
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
                                                                        form.setValue("serviceCenterCode", sc.code)
                                                                        setScOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === sc.id ? "opacity-100" : "opacity-0")} />
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
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="9876543210" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="receiver@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="tel1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="02212345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tel2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 2</FormLabel>
                                            <FormControl>
                                                <Input placeholder="02287654321" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="eori"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>EORI</FormLabel>
                                            <FormControl>
                                                <Input placeholder="EORI Code" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>VAT</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VAT Number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address & Location */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Address & Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Full street address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Floor, Landmark, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mumbai" {...field} />
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
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value || "Select state..."}
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
                                                                {statesData?.data?.map((state) => (
                                                                    <CommandItem
                                                                        key={state.id}
                                                                        value={state.stateName}
                                                                        onSelect={() => {
                                                                            form.setValue("state", state.stateName)
                                                                            setStateOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", field.value === state.stateName ? "opacity-100" : "opacity-0")} />
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
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pin Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="400001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. London" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/consignee')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Consignee' : 'Create Consignee'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
