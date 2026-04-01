"use client"

import { useEffect, useState } from 'react'
import { useForm, useFieldArray, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from "date-fns"
import { 
    Check, 
    ChevronsUpDown, 
    Loader2, 
    Calendar as CalendarIcon, 
    Clock, 
    Search,
    Plus,
    Trash2,
    Calculator
} from "lucide-react"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { shipmentService } from '@/services/transactions/shipment-service'
import { customerService } from '@/services/masters/customer-service'
import { shipperService } from '@/services/masters/shipper-service'
import { consigneeService } from '@/services/masters/consignee-service'
import { productService } from '@/services/masters/product-service'
import { vendorService } from '@/services/masters/vendor-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { serviceMapService } from '@/services/masters/service-map-service'
import { chargeService } from '@/services/masters/charge-service'
import { shipmentSchema, ShipmentFormValues, Shipment } from '@/types/transactions/shipment'

interface ShipmentFormProps {
    initialData?: Shipment | null
}

export function ShipmentForm({ initialData }: ShipmentFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const [customerOpen, setCustomerOpen] = useState(false)
    const [shipperOpen, setShipperOpen] = useState(false)
    const [consigneeOpen, setConsigneeOpen] = useState(false)
    const [fieldExecOpen, setFieldExecOpen] = useState(false)

    // Lookup Data
    const { data: customersData } = useQuery({
        queryKey: ['customers-list'],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
    })

    const { data: shippersData } = useQuery({
        queryKey: ['shippers-list'],
        queryFn: () => shipperService.getShippers({ limit: 100 }),
    })

    const { data: consigneesData } = useQuery({
        queryKey: ['consignees-list'],
        queryFn: () => consigneeService.getConsignees({ limit: 100 }),
    })

    const { data: productsData } = useQuery({
        queryKey: ['products-list'],
        queryFn: () => productService.getProducts({ limit: 100 }),
    })

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const { data: serviceCentersData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const { data: serviceMapsData } = useQuery({
        queryKey: ['service-maps-list'],
        queryFn: () => serviceMapService.getServiceMaps({ limit: 100 }),
    })

    const { data: masterChargesData } = useQuery({
        queryKey: ['master-charges-list'],
        queryFn: () => chargeService.getCharges({ limit: 100 }),
    })

    // Mock data for executives
    const executives = [
        { id: 1, name: "John Doe" },
        { id: 2, name: "Jane Smith" },
        { id: 3, name: "Robert Johnson" },
    ]

    const form = useForm<ShipmentFormValues>({
        resolver: zodResolver(shipmentSchema) as Resolver<ShipmentFormValues>,
        defaultValues: {
            awbNo: initialData?.awbNo || '',
            bookDate: initialData?.bookDate || new Date().toISOString().split('T')[0],
            bookTime: initialData?.bookTime || format(new Date(), "HH:mm"),
            referenceNo: initialData?.referenceNo || '',
            customerId: initialData?.customerId || 0,
            shipperId: initialData?.shipperId || 0,
            consigneeId: initialData?.consigneeId || 0,
            origin: initialData?.origin || '',
            originCode: initialData?.originCode || '',
            destination: initialData?.destination || '',
            destinationCode: initialData?.destinationCode || '',
            productId: initialData?.productId || 0,
            vendorId: initialData?.vendorId || 0,
            serviceMapId: initialData?.serviceMapId || 0,
            shipmentValue: initialData?.shipmentValue || 0,
            currency: initialData?.currency || 'INR',
            pieces: initialData?.pieces || 1,
            actualWeight: initialData?.actualWeight || 0,
            volumetricWeight: initialData?.volumetricWeight || 0,
            chargeWeight: initialData?.chargeWeight || 0,
            km: initialData?.km || 0,
            commercial: initialData?.commercial || false,
            paymentType: initialData?.paymentType || 'CREDIT',
            content: initialData?.content || '',
            instruction: initialData?.instruction || '',
            fieldExecutiveId: initialData?.fieldExecutiveId || 0,
            serviceCenterId: initialData?.serviceCenterId || 0,
            isCod: initialData?.isCod || false,
            codAmount: initialData?.codAmount || 0,
            piecesRows: initialData?.piecesRows || [],
            charges: initialData?.charges || [],
        }
    })

    const { fields: pieceFields, append: appendPiece, remove: removePiece } = useFieldArray({
        control: form.control,
        name: "piecesRows"
    })

    const { fields: chargeFields, append: appendCharge, remove: removeCharge } = useFieldArray({
        control: form.control,
        name: "charges"
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                bookDate: initialData.bookDate.split('T')[0],
                piecesRows: initialData.piecesRows || [],
                charges: initialData.charges || [],
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: ShipmentFormValues) => {
            return isEdit
                ? shipmentService.updateShipment(initialData!.id, values)
                : shipmentService.createShipment(values)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] })
            toast.success(`Shipment ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/transactions/shipment')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} shipment`)
        }
    })

    const onSubmit = (values: ShipmentFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 1: General Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">General Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="awbNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AWB No <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input {...field} placeholder="e.g. AWB123456" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="referenceNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reference No</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Ref #" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bookDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Book Date <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bookTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Book Time</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type="time" {...field} value={field.value || ''} className="pl-10" />
                                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                                </div>
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
                                    <FormItem>
                                        <FormLabel>Service Center <span className="text-red-500">*</span></FormLabel>
                                        <Select 
                                            onValueChange={(val) => field.onChange(parseInt(val))} 
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Service Center" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {serviceCentersData?.data?.map((sc) => (
                                                    <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 2: Parties */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Parties Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
                                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn("justify-between font-normal", !field.value && "text-muted-foreground")}
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="shipperId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Shipper</FormLabel>
                                            <Popover open={shipperOpen} onOpenChange={setShipperOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn("justify-between font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value
                                                                ? shippersData?.data?.find(s => s.id === field.value)?.shipperName
                                                                : "Select Shipper"}
                                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search shipper..." />
                                                        <CommandList>
                                                            <CommandEmpty>No shipper found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {shippersData?.data?.map((shipper) => (
                                                                    <CommandItem
                                                                        key={shipper.id}
                                                                        value={shipper.shipperName}
                                                                        onSelect={() => {
                                                                            form.setValue("shipperId", shipper.id)
                                                                            setShipperOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", field.value === shipper.id ? "opacity-100" : "opacity-0")} />
                                                                        {shipper.shipperName}
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
                                    name="consigneeId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Consignee</FormLabel>
                                            <Popover open={consigneeOpen} onOpenChange={setConsigneeOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn("justify-between font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                            {field.value
                                                                ? consigneesData?.data?.find(c => c.id === field.value)?.name
                                                                : "Select Consignee"}
                                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search consignee..." />
                                                        <CommandList>
                                                            <CommandEmpty>No consignee found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {consigneesData?.data?.map((consignee) => (
                                                                    <CommandItem
                                                                        key={consignee.id}
                                                                        value={consignee.name}
                                                                        onSelect={() => {
                                                                            form.setValue("consigneeId", consignee.id)
                                                                            setConsigneeOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", field.value === consignee.id ? "opacity-100" : "opacity-0")} />
                                                                        {consignee.name}
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
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 3: Shipment Specs & Route */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Shipment Specifications & Route</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="productId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product/Service <span className="text-red-500">*</span></FormLabel>
                                            <Select 
                                                onValueChange={(val) => field.onChange(parseInt(val))} 
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {productsData?.data?.map((p) => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>{p.productName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vendorId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor/Carrier</FormLabel>
                                            <Select 
                                                onValueChange={(val) => field.onChange(parseInt(val))} 
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Vendor" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {vendorsData?.data?.map((v) => (
                                                        <SelectItem key={v.id} value={v.id.toString()}>{v.vendorName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="origin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Origin</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="City Name" /></FormControl>
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
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="City Name" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pieces"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pieces <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="actualWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Actual Weight <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="chargeWeight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Charge Weight</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Billing & Payment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Billing & Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="paymentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Type <span className="text-red-500">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CASH">Cash</SelectItem>
                                                    <SelectItem value="CREDIT">Credit</SelectItem>
                                                    <SelectItem value="TOPAY">To Pay</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="INR" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="INR">INR</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="shipmentValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipment Value</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2 pt-8">
                                    <FormField
                                        control={form.control}
                                        name="isCod"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                                <FormLabel className="text-base">IS COD</FormLabel>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {form.watch('isCod') && (
                                <FormField
                                    control={form.control}
                                    name="codAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>COD Amount</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Section 5: Piece Details */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Piece Details (Dimensions)</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPiece({ pieces: 1, actualWeightPerPc: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Piece
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Child AWB</TableHead>
                                    <TableHead>Pcs</TableHead>
                                    <TableHead>Weight/Pc</TableHead>
                                    <TableHead>L</TableHead>
                                    <TableHead>W</TableHead>
                                    <TableHead>H</TableHead>
                                    <TableHead>Vol. Weight</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pieceFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <Input {...form.register(`piecesRows.${index}.childAwbNo` as const)} placeholder="AWB-1" className="h-8" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" {...form.register(`piecesRows.${index}.pieces` as const, { valueAsNumber: true })} className="h-8 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" step="0.01" {...form.register(`piecesRows.${index}.actualWeightPerPc` as const, { valueAsNumber: true })} className="h-8 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" {...form.register(`piecesRows.${index}.length` as const, { valueAsNumber: true })} className="h-8 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" {...form.register(`piecesRows.${index}.width` as const, { valueAsNumber: true })} className="h-8 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" {...form.register(`piecesRows.${index}.height` as const, { valueAsNumber: true })} className="h-8 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" step="0.01" {...form.register(`piecesRows.${index}.volumetricWeight` as const, { valueAsNumber: true })} className="h-8 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removePiece(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {pieceFields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                                            No piece details added.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Section 6: Charges */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Charges</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendCharge({ chargeId: 0, amount: 0, fuelApply: false, taxApply: false, taxOnFuel: false })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Charge
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Charge</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Fuel</TableHead>
                                    <TableHead>Tax</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chargeFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="w-[200px]">
                                            <Select 
                                                onValueChange={(val) => form.setValue(`charges.${index}.chargeId`, parseInt(val))}
                                                defaultValue={field.chargeId?.toString()}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Select Charge" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {masterChargesData?.data?.map((mc) => (
                                                        <SelectItem key={mc.id} value={mc.id.toString()}>{mc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input {...form.register(`charges.${index}.description` as const)} placeholder="Notes" className="h-8" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" {...form.register(`charges.${index}.amount` as const, { valueAsNumber: true })} className="h-8 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                checked={form.watch(`charges.${index}.fuelApply`)} 
                                                onCheckedChange={(val) => form.setValue(`charges.${index}.fuelApply`, val)} 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                checked={form.watch(`charges.${index}.taxApply`)} 
                                                onCheckedChange={(val) => form.setValue(`charges.${index}.taxApply`, val)} 
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" readOnly {...form.register(`charges.${index}.total` as const, { valueAsNumber: true })} className="h-8 w-24 bg-muted" />
                                        </TableCell>
                                        <TableCell>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t bg-white sticky bottom-0 z-20 pb-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/transactions/shipment')}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Shipment' : 'Create Shipment'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
