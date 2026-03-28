"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

interface ConsigneeDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    consignee?: Consignee | null
}

export function ConsigneeDrawer({ open, onOpenChange, consignee }: ConsigneeDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!consignee
    const [scOpen, setScOpen] = useState(false)
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ConsigneeFormValues>({
        resolver: zodResolver(consigneeSchema) as Resolver<ConsigneeFormValues>,
        defaultValues: {
            code: '',
            name: '',
            destination: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            industry: '',
            tel1: '',
            tel2: '',
            fax: '',
            email: '',
            mobile: '',
            serviceCenterId: 0,
            serviceCenterCode: '',
            eori: '',
            vat: '',
        }
    })

    useEffect(() => {
        if (consignee) {
            form.reset({
                code: consignee.code,
                name: consignee.name,
                destination: consignee.destination || '',
                contactPerson: consignee.contactPerson || '',
                address1: consignee.address1 || '',
                address2: consignee.address2 || '',
                pinCode: consignee.pinCode || '',
                city: consignee.city || '',
                state: consignee.state || '',
                industry: consignee.industry || '',
                tel1: consignee.tel1 || '',
                tel2: consignee.tel2 || '',
                fax: consignee.fax || '',
                email: consignee.email || '',
                mobile: consignee.mobile || '',
                serviceCenterId: consignee.serviceCenterId || consignee.serviceCenter?.id || 0,
                serviceCenterCode: consignee.serviceCenter?.code || '',
                eori: consignee.eori || '',
                vat: consignee.vat || '',
            })
        } else {
            form.reset({
                code: '',
                name: '',
                destination: '',
                contactPerson: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                industry: '',
                tel1: '',
                tel2: '',
                fax: '',
                email: '',
                mobile: '',
                serviceCenterId: 0,
                serviceCenterCode: '',
                eori: '',
                vat: '',
            })
        }
    }, [consignee, form, open])

    const mutation = useMutation({
        mutationFn: (data: ConsigneeFormValues) => {
            if (isEdit && consignee) {
                return consigneeService.updateConsignee(consignee.id, data as any)
            }
            return consigneeService.createConsignee(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consignees'] })
            toast.success(`Consignee ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} consignee`)
        }
    })

    function onSubmit(data: ConsigneeFormValues) {
        mutation.mutate(data)
    }

    const onInvalid = (errors: any) => {
        console.error("Consignee Form Errors:", errors)
        toast.error("Please check the form for errors")
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[750px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Consignee" : "Create Consignee"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the consignee details below." : "Enter the details for the new consignee."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Consignee Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. CONS01" {...field} />
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
                                                <Input placeholder="e.g. Receiver Company" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Reception" {...field} />
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
                                                <Input placeholder="e.g. Delhi" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Street address" {...field} />
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
                                            <FormLabel>Address 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Floor, building, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mumbai" {...field} />
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
                                            <FormLabel>State</FormLabel>
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
                                                            {field.value || "Select state"}
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
                                                                        value={state.stateName}
                                                                        key={state.id}
                                                                        onSelect={() => {
                                                                            form.setValue("state", state.stateName)
                                                                            setStateOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                state.stateName === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                            <FormLabel>Telephone 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="02287654321" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
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
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="receive@company.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="serviceCenterId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Service Center</FormLabel>
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
                                                                ? scData?.data?.find(
                                                                    (sc) => sc.id === field.value
                                                                )?.name
                                                                : "Select service center"}
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
                                                                        value={sc.name}
                                                                        key={sc.id}
                                                                        onSelect={() => {
                                                                            form.setValue("serviceCenterId", sc.id)
                                                                            form.setValue("serviceCenterCode", sc.code)
                                                                            setScOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                sc.id === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
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
                                <FormField
                                    control={form.control}
                                    name="industry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Industry</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Logistics" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="eori"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>EORI</FormLabel>
                                            <FormControl>
                                                <Input placeholder="EORI123" {...field} />
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
                                                <Input placeholder="VAT123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Consignee" : "Create Consignee"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
