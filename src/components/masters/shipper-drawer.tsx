"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { shipperService } from '@/services/masters/shipper-service'
import { stateService } from '@/services/masters/state-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { Shipper } from '@/types/masters/shipper'

const shipperSchema = z.object({
    shipperCode: z.string().min(2, "Code must be at least 2 characters"),
    shipperName: z.string().min(3, "Name must be at least 3 characters"),
    shipperOrigin: z.string().optional(),
    contactPerson: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    pinCode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    industry: z.string().optional(),
    telephone1: z.string().optional(),
    telephone2: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")),
    mobile: z.string().optional(),
    iecNo: z.string().optional(),
    gstNo: z.string().optional(),
    aadhaarNo: z.string().optional(),
    panNo: z.string().optional(),
    serviceCenter: z.string().optional(),
    bankAdCode: z.string().optional(),
    bankAccount: z.string().optional(),
    bankIfsc: z.string().optional(),
    firmType: z.enum(['GOV', 'NON_GOV']).optional(),
    nfei: z.string().optional(),
    lutNumber: z.string().optional(),
    lutIssueDate: z.string().optional(),
    lutTillDate: z.string().optional(),
})

type ShipperFormValues = z.infer<typeof shipperSchema>

interface ShipperDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipper?: Shipper | null
}

export function ShipperDrawer({ open, onOpenChange, shipper }: ShipperDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!shipper
    const [stateOpen, setStateOpen] = useState(false)
    const [scOpen, setScOpen] = useState(false)

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

    const form = useForm<ShipperFormValues>({
        resolver: zodResolver(shipperSchema) as Resolver<ShipperFormValues>,
        defaultValues: {
            shipperCode: '',
            shipperName: '',
            shipperOrigin: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            industry: '',
            telephone1: '',
            telephone2: '',
            fax: '',
            email: '',
            mobile: '',
            iecNo: '',
            gstNo: '',
            aadhaarNo: '',
            panNo: '',
            serviceCenter: '',
            bankAdCode: '',
            bankAccount: '',
            bankIfsc: '',
            firmType: 'NON_GOV',
            nfei: '',
            lutNumber: '',
            lutIssueDate: '',
            lutTillDate: '',
        }
    })

    useEffect(() => {
        if (shipper) {
            form.reset({
                shipperCode: shipper.shipperCode,
                shipperName: shipper.shipperName,
                shipperOrigin: shipper.shipperOrigin || '',
                contactPerson: shipper.contactPerson || '',
                address1: shipper.address1 || '',
                address2: shipper.address2 || '',
                pinCode: shipper.pinCode || '',
                city: shipper.city || '',
                state: shipper.state || '',
                industry: shipper.industry || '',
                telephone1: shipper.telephone1 || '',
                telephone2: shipper.telephone2 || '',
                fax: shipper.fax || '',
                email: shipper.email || '',
                mobile: shipper.mobile || '',
                iecNo: shipper.iecNo || '',
                gstNo: shipper.gstNo || '',
                aadhaarNo: shipper.aadhaarNo || '',
                panNo: shipper.panNo || '',
                serviceCenter: shipper.serviceCenter || '',
                bankAdCode: shipper.bankAdCode || '',
                bankAccount: shipper.bankAccount || '',
                bankIfsc: shipper.bankIfsc || '',
                firmType: shipper.firmType || 'NON_GOV',
                nfei: shipper.nfei || '',
                lutNumber: shipper.lutNumber || '',
                lutIssueDate: shipper.lutIssueDate ? shipper.lutIssueDate.split('T')[0] : '',
                lutTillDate: shipper.lutTillDate ? shipper.lutTillDate.split('T')[0] : '',
            })
        } else {
            form.reset({
                shipperCode: '',
                shipperName: '',
                shipperOrigin: '',
                contactPerson: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                industry: '',
                telephone1: '',
                telephone2: '',
                fax: '',
                email: '',
                mobile: '',
                iecNo: '',
                gstNo: '',
                aadhaarNo: '',
                panNo: '',
                serviceCenter: '',
                bankAdCode: '',
                bankAccount: '',
                bankIfsc: '',
                firmType: 'NON_GOV',
                nfei: '',
                lutNumber: '',
                lutIssueDate: '',
                lutTillDate: '',
            })
        }
    }, [shipper, form, open])

    const mutation = useMutation({
        mutationFn: (data: ShipperFormValues) => {
            if (isEdit && shipper) {
                return shipperService.updateShipper(shipper.id, data as any)
            }
            return shipperService.createShipper(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shippers'] })
            toast.success(`Shipper ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} shipper`)
        }
    })

    function onSubmit(data: ShipperFormValues) {
        mutation.mutate(data)
    }

    const onInvalid = (errors: any) => {
        console.error("Shipper Form Errors:", errors)
        toast.error("Please check the form for errors")
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[850px] overflow-y-auto bg-gray-50/50">
                <SheetHeader className="px-6 bg-white py-4 border-b sticky top-0 z-10 shadow-sm">
                    <SheetTitle>{isEdit ? "Edit Shipper" : "Create Shipper"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the shipper and business details below." : "Enter the details for the new shipping partner."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-20">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                            
                            {/* Section 1: Basic Information */}
                            <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-blue-700">
                                    <span className="bg-blue-100 p-1 rounded-md text-blue-700 w-6 h-6 flex items-center justify-center text-sm">1</span>
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="shipperCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Shipper Code*</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. SHIP01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="shipperName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Shipper Name*</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Sender Company Ltd" {...field} />
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
                                                    <Input placeholder="e.g. John Smith" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="firmType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Firm Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="GOV">Government (GOV)</SelectItem>
                                                    <SelectItem value="NON_GOV">Non-Government (NON_GOV)</SelectItem>
                                                </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section 2: Address & Logistics */}
                            <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-blue-700">
                                    <span className="bg-blue-100 p-1 rounded-md text-blue-700 w-6 h-6 flex items-center justify-center text-sm">2</span>
                                    Address & Logistics
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="shipperOrigin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Origin City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Mumbai" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceCenter"
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
                                                                {field.value || "Select service center"}
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
                                                                                form.setValue("serviceCenter", sc.name)
                                                                                setScOpen(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    sc.name === field.value
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
                                                <FormLabel>Address 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Bldg, floor, etc." {...field} />
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
                            </div>

                            {/* Section 3: Contact Details */}
                            <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-blue-700">
                                    <span className="bg-blue-100 p-1 rounded-md text-blue-700 w-6 h-6 flex items-center justify-center text-sm">3</span>
                                    Contact Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="telephone1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Telephone 1</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="022-1234567" {...field} />
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
                                                <FormLabel>Telephone 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Optional" {...field} />
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
                                                    <Input placeholder="sender@company.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="fax"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fax</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Fax number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Section 4: Identification & Statutory */}
                            <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-blue-700">
                                    <span className="bg-blue-100 p-1 rounded-md text-blue-700 w-6 h-6 flex items-center justify-center text-sm">4</span>
                                    Identification
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="iecNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IEC No</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="IEC123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="gstNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>GST No</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="GST123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="panNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PAN No</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="PAN123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="aadhaarNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Aadhaar No</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="12 digit number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="industry"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Industry</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Textiles, Electronics" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nfei"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>NFEI</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="NFEI123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section 5: Bank & LUT Details */}
                            <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-blue-700">
                                    <span className="bg-blue-100 p-1 rounded-md text-blue-700 w-6 h-6 flex items-center justify-center text-sm">5</span>
                                    Bank & LUT Details
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bankAdCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bank AD Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="AD123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankAccount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Account Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1234..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankIfsc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bank IFSC</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="IFSC..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="lutNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>LUT Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="LUT123" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lutIssueDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>LUT Issue Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lutTillDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>LUT Valid Till</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 bg-white border-t sticky bottom-0 z-10 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending} className="px-8 bg-blue-700 hover:bg-blue-800">
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Shipper" : "Create Shipper"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
