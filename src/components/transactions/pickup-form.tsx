"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Calendar as CalendarIcon, Clock, Search } from "lucide-react"
import { format } from "date-fns"

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
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"

import { pickupService } from '@/services/transactions/pickup-service'
import { customerService } from '@/services/masters/customer-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { areaService } from '@/services/masters/area-service'
import { pickupSchema, PickupFormValues, Pickup } from '@/types/transactions/pickup'

interface PickupFormProps {
    initialData?: Pickup | null
}

export function PickupForm({ initialData }: PickupFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const [customerOpen, setCustomerOpen] = useState(false)
    const [areaOpen, setAreaOpen] = useState(false)
    const [fieldExecOpen, setFieldExecOpen] = useState(false)
    const [salesExecOpen, setSalesExecOpen] = useState(false)
    const [showConsignee, setShowConsignee] = useState(false)

    // Lookup Data
    const { data: customersData } = useQuery({
        queryKey: ['customers-list'],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
    })

    const { data: serviceCentersData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const { data: areasData } = useQuery({
        queryKey: ['areas-list'],
        queryFn: () => areaService.getAreas({ limit: 100 }),
    })

    // Mock data for executives since real service was not found
    const executives = [
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane Smith" },
        { id: 3, name: "Robert Johnson" },
    ]

    const form = useForm<PickupFormValues>({
        resolver: zodResolver(pickupSchema) as Resolver<PickupFormValues>,
        defaultValues: {
            customerId: initialData?.customerId || 0,
            serviceCenterId: initialData?.serviceCenterId || 0,
            pickupType: initialData?.pickupType || 'INTERNAL',
            bookingNo: initialData?.bookingNo || '',
            origin: initialData?.origin || '',
            mobile: initialData?.mobile || '',
            shipperName: initialData?.shipperName || '',
            contact: initialData?.contact || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            zipCode: initialData?.pinCode || '',
            city: initialData?.city || '',
            state: initialData?.state || '',
            payOption: initialData?.payOption || '',
            vehicleReq: initialData?.vehicleReq || '',
            area: initialData?.area || '',
            fieldExecutiveId: initialData?.fieldExecutiveId || 0,
            salesExecutiveId: initialData?.salesExecutiveId || 0,
            specialInstructions: initialData?.specialInstructions || '',
            reason: initialData?.reason || '',
            pickupReady: initialData?.pickupReady ?? true,
            pickupAt: initialData?.pickupAt || new Date().toISOString(),
            pickupTime: initialData?.pickupAt ? format(new Date(initialData.pickupAt), "HH:mm") : format(new Date(), "HH:mm"),
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                customerId: initialData.customerId,
                serviceCenterId: initialData.serviceCenterId,
                pickupType: initialData.pickupType,
                bookingNo: initialData.bookingNo,
                origin: initialData.origin,
                mobile: initialData.mobile,
                shipperName: initialData.shipperName,
                contact: initialData.contact,
                address1: initialData.address1,
                address2: initialData.address2,
                zipCode: initialData.pinCode,
                city: initialData.city,
                state: initialData.state,
                payOption: initialData.payOption,
                vehicleReq: initialData.vehicleReq,
                area: initialData.area,
                fieldExecutiveId: initialData.fieldExecutiveId,
                salesExecutiveId: initialData.salesExecutiveId,
                specialInstructions: initialData.specialInstructions,
                reason: initialData.reason,
                pickupReady: initialData.pickupReady,
                pickupAt: initialData.pickupAt,
                pickupTime: initialData.pickupAt ? format(new Date(initialData.pickupAt), "HH:mm") : '',
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: PickupFormValues) => {
            // Combine Date and Time
            const date = values.pickupAt ? new Date(values.pickupAt) : new Date()
            if (values.pickupTime) {
                const [hours, minutes] = values.pickupTime.split(':')
                date.setHours(parseInt(hours), parseInt(minutes))
            }
            const payload = { ...values, pickupAt: date.toISOString() }
            
            return isEdit
                ? pickupService.updatePickup(initialData!.id, payload)
                : pickupService.createPickup({ ...payload, idempotencyKey: `pickup-${Date.now()}` })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['pickup', initialData.id] })
            }
            toast.success(`Pickup ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/transactions/pickup')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} pickup`)
        }
    })

    const onSubmit = (values: PickupFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                {/* Section 1: Pickup Details */}
                <FormSection title="Pickup Details" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Customer */}
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Customer">
                                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(FLOATING_INNER_COMBO, !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value
                                                            ? customersData?.data?.find(c => c.id === field.value)?.name
                                                            : "Select Customer"}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search customer..." />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {customersData?.data?.map((customer) => (
                                                                <CommandItem
                                                                    key={customer.id}
                                                                    value={customer.name}
                                                                    onSelect={() => {
                                                                        form.setValue("customerId", customer.id)
                                                                        setCustomerOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === customer.id ? "opacity-100" : "opacity-0")} />
                                                                    {customer.name}
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

                            {/* Pickup Date */}
                            <FormField
                                control={form.control}
                                name="pickupAt"
                                render={({ field }) => (
                                    <FloatingFormItem label="PickUp Date">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn(FLOATING_INNER_COMBO, "pl-3 text-left", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(new Date(field.value), "dd/MM/yyyy") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) => field.onChange(date?.toISOString())}
                                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="origin"
                                render={({ field }) => (
                                    <FloatingFormItem label="Origin">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Origin" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FloatingFormItem label={<>Mobile No. <span className="text-red-500">*</span></>}>
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Mobile No" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="shipperName"
                                render={({ field }) => (
                                    <FloatingFormItem label={<>Shipper Name <span className="text-red-500">*</span></>}>
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Shipper Name" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contact"
                                render={({ field }) => (
                                    <FloatingFormItem label="Contact">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Contact" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FloatingFormItem label="Address1">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Address Line 1" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address2"
                                render={({ field }) => (
                                    <FloatingFormItem label="Address2">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Address Line 2" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="zipCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Zip Code">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Zip Code" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FloatingFormItem label="City">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="City" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FloatingFormItem label="State">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="State" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="payOption"
                                render={({ field }) => (
                                    <FloatingFormItem label="Pay Option">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select Pay Option" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="CREDIT">Credit</SelectItem>
                                                <SelectItem value="TOPAY">To Pay</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="consignee-details" 
                                checked={showConsignee} 
                                onCheckedChange={(checked) => setShowConsignee(!!checked)}
                            />
                            <label htmlFor="consignee-details" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Consignee Details
                            </label>
                        </div>

                        {showConsignee && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <FormField
                                    control={form.control}
                                    name="consigneeName"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Consignee Name">
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Consignee Name" className={FLOATING_INNER_CONTROL} /></FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="consigneeDetails"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Consignee Details">
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Extra details" className={FLOATING_INNER_CONTROL} /></FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                        )}
                </FormSection>

                {/* Section 2: Vehicle */}
                <FormSection title="Vehicle" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Vehicle Req */}
                            <FormField
                                control={form.control}
                                name="vehicleReq"
                                render={({ field }) => (
                                    <FloatingFormItem label="Vehicle Req">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select Vehicle" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BIKE">Bike</SelectItem>
                                                <SelectItem value="VAN">Van</SelectItem>
                                                <SelectItem value="TEMPO">Tempo</SelectItem>
                                                <SelectItem value="TRUCK">Truck</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="area"
                                render={({ field }) => (
                                    <FloatingFormItem label="Area">
                                        <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(FLOATING_INNER_COMBO, !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value || "Select Area"}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search area..." />
                                                    <CommandList>
                                                        <CommandEmpty>No area found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {areasData?.data?.map((area) => (
                                                                <CommandItem
                                                                    key={area.id}
                                                                    value={area.areaName}
                                                                    onSelect={() => {
                                                                        form.setValue("area", area.areaName)
                                                                        setAreaOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === area.areaName ? "opacity-100" : "opacity-0")} />
                                                                    {area.areaName}
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
                                name="fieldExecutiveId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Field Executive">
                                        <Popover open={fieldExecOpen} onOpenChange={setFieldExecOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(FLOATING_INNER_COMBO, !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value
                                                            ? executives.find(e => e.id === field.value)?.name
                                                            : "Select Executive"}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search executive..." />
                                                    <CommandList>
                                                        <CommandEmpty>No executive found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {executives.map((exec) => (
                                                                <CommandItem
                                                                    key={exec.id}
                                                                    value={exec.name}
                                                                    onSelect={() => {
                                                                        form.setValue("fieldExecutiveId", exec.id)
                                                                        setFieldExecOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === exec.id ? "opacity-100" : "opacity-0")} />
                                                                    {exec.name}
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
                                name="salesExecutiveId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Sales Executive">
                                        <Popover open={salesExecOpen} onOpenChange={setSalesExecOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(FLOATING_INNER_COMBO, !field.value && "text-muted-foreground")}
                                                    >
                                                        {field.value
                                                            ? executives.find(e => e.id === field.value)?.name
                                                            : "Select Executive"}
                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search executive..." />
                                                    <CommandList>
                                                        <CommandEmpty>No executive found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {executives.map((exec) => (
                                                                <CommandItem
                                                                    key={exec.id}
                                                                    value={exec.name}
                                                                    onSelect={() => {
                                                                        form.setValue("salesExecutiveId", exec.id)
                                                                        setSalesExecOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", field.value === exec.id ? "opacity-100" : "opacity-0")} />
                                                                    {exec.name}
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
                                name="specialInstructions"
                                render={({ field }) => (
                                    <FloatingFormItem label="Special Instructions">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Instructions" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serviceCenterId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Service Center">
                                        <Select
                                            onValueChange={(val) => field.onChange(parseInt(val, 10))}
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select Center" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {serviceCentersData?.data?.map((sc) => (
                                                    <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FloatingFormItem label="Reason">
                                        <FormControl><Input {...field} value={field.value || ''} placeholder="Reason" className={FLOATING_INNER_CONTROL} /></FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="pickupReady"
                                render={({ field }) => (
                                    <FloatingFormItem label="Pickup Ready">
                                        <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </div>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="pickupTime"
                                render={({ field }) => (
                                    <FloatingFormItem label="Pickup Time">
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="time" {...field} value={field.value || ''} className={cn(FLOATING_INNER_CONTROL, "pl-8")} />
                                            </FormControl>
                                            <Clock className="pointer-events-none absolute bottom-1.5 left-2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                </FormSection>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/transactions/pickup')}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Pickup' : 'Create Pickup'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
