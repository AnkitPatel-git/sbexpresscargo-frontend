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
import { Combobox } from "@/components/ui/combobox"

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

const normalizeShipmentPayload = (values: ShipmentFormValues): ShipmentFormValues => {
    const payload: ShipmentFormValues = { ...values }

    const optionalNumberKeys: Array<keyof ShipmentFormValues> = [
        "shipperId",
        "consigneeId",
        "vendorId",
        "serviceMapId",
        "fieldExecutiveId",
        "serviceCenterId",
        "codAmount",
        "shipmentValue",
        "chargeWeight",
        "volumetricWeight",
    ]

    optionalNumberKeys.forEach((key) => {
        const currentValue = payload[key]
        if (typeof currentValue === "number" && currentValue <= 0) {
            ;(payload as Record<string, unknown>)[key] = undefined
        }
    })

    if (!payload.bookTime) {
        payload.bookTime = undefined
    }

    payload.piecesRows = (payload.piecesRows || []).filter((row) => Number(row.pieces || 0) > 0)
    payload.charges = (payload.charges || []).filter((charge) => Number(charge.chargeId || 0) > 0)

    return payload
}

export function ShipmentForm({ initialData }: ShipmentFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

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

    // --- Automatic Calculations ---

    // 1. Piece Volumetric weight and Row Totals
    const watchedPiecesRows = form.watch('piecesRows')
    useEffect(() => {
        if (!watchedPiecesRows || watchedPiecesRows.length === 0) return;
        
        let totalPcs = 0;
        let totalActualWeight = 0;
        let totalVolWeight = 0;

        watchedPiecesRows.forEach((row, index) => {
            const pcs = Number(row.pieces) || 0;
            const weightPerPc = Number(row.actualWeightPerPc) || 0;
            const l = Number(row.length) || 0;
            const w = Number(row.width) || 0;
            const h = Number(row.height) || 0;

            totalPcs += pcs;
            totalActualWeight += weightPerPc * pcs;

            if (l > 0 && w > 0 && h > 0) {
                const volWeight = (l * w * h / 5000) * pcs;
                const roundedVolWeight = parseFloat(volWeight.toFixed(2));
                const currentVolValue = Number(row.volumetricWeight) || 0;
                
                if (Math.abs(currentVolValue - roundedVolWeight) > 0.001) {
                    form.setValue(`piecesRows.${index}.volumetricWeight`, roundedVolWeight, { shouldValidate: true });
                }
                totalVolWeight += roundedVolWeight;
            } else {
                totalVolWeight += Number(row.volumetricWeight) || 0;
            }
        });

        // Update main shipment weights
        if (totalPcs > 0 && form.getValues('pieces') !== totalPcs) {
            form.setValue('pieces', totalPcs, { shouldValidate: true });
        }
        if (totalActualWeight > 0 && Math.abs((form.getValues('actualWeight') || 0) - totalActualWeight) > 0.001) {
            form.setValue('actualWeight', parseFloat(totalActualWeight.toFixed(2)), { shouldValidate: true });
        }
        if (totalVolWeight > 0 && Math.abs((form.getValues('volumetricWeight') || 0) - totalVolWeight) > 0.001) {
            form.setValue('volumetricWeight', parseFloat(totalVolWeight.toFixed(2)), { shouldValidate: true });
        }

        const currentActual = totalActualWeight;
        const currentVol = totalVolWeight;
        const chargeWeight = Math.max(currentActual, currentVol);
        if (chargeWeight > 0 && Math.abs((form.getValues('chargeWeight') || 0) - chargeWeight) > 0.001) {
            form.setValue('chargeWeight', parseFloat(chargeWeight.toFixed(2)), { shouldValidate: true });
        }
    }, [JSON.stringify(watchedPiecesRows), form]);

    // 2. Charges Row Total and Grand Totals
    const watchedCharges = form.watch('charges')
    useEffect(() => {
        if (!watchedCharges || watchedCharges.length === 0) return;

        let grandSubTotal = 0;
        let grandTotalFuel = 0;
        let grandTotalTax = 0;
        let grandTotalAmount = 0;

        watchedCharges.forEach((charge, index) => {
            const amount = Number(charge.amount) || 0;
            if (amount === 0) return;

            const fuelApply = charge.fuelApply || false;
            const taxApply = charge.taxApply || false;

            const fuelAmount = fuelApply ? amount * 0.1 : 0;
            const taxableAmount = amount + fuelAmount;
            const taxAmount = taxApply ? taxableAmount * 0.18 : 0;
            const total = taxableAmount + taxAmount;

            const roundedTotal = parseFloat(total.toFixed(2));
            const currentTotalValue = Number(charge.total) || 0;

            if (Math.abs(currentTotalValue - roundedTotal) > 0.01) {
                form.setValue(`charges.${index}.total`, roundedTotal, { shouldValidate: true });
            }

            grandSubTotal += amount;
            grandTotalFuel += fuelAmount;
            grandTotalTax += taxAmount;
            grandTotalAmount += total;
        });

        if (Math.abs((form.getValues('subTotal') || 0) - grandSubTotal) > 0.01) {
            form.setValue('subTotal', parseFloat(grandSubTotal.toFixed(2)), { shouldValidate: true });
        }
        if (Math.abs((form.getValues('totalFuel') || 0) - grandTotalFuel) > 0.01) {
            form.setValue('totalFuel', parseFloat(grandTotalFuel.toFixed(2)), { shouldValidate: true });
        }
        if (Math.abs((form.getValues('totalAmount') || 0) - grandTotalAmount) > 0.01) {
            form.setValue('totalAmount', parseFloat(grandTotalAmount.toFixed(2)), { shouldValidate: true });
        }
    }, [JSON.stringify(watchedCharges), form]);

    // --- End Calculations ---

    const mutation = useMutation({
        mutationFn: (values: ShipmentFormValues) => {
            const payload = normalizeShipmentPayload(values)
            return isEdit
                ? shipmentService.updateShipment(initialData!.id, payload)
                : shipmentService.createShipment(payload)
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-20">
                <div className="rounded-md border border-border bg-card p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs">AWB No</Button>
                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs">Forwarding</Button>
                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs">KYC</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input className="h-7 w-28 text-xs" placeholder="AWB No" />
                            <Input className="h-7 w-24 text-xs" placeholder="Search" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        <Card className="border-border">
                            <CardHeader className="border-b bg-muted/40 py-2">
                                <CardTitle className="text-sm">AWB / Booking Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                                <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="awbNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AWB No <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input {...field} placeholder="AWB No" className="h-8" /></FormControl>
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
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Reference No" className="h-8" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="bookDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Book Date <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="date" {...field} className="h-8" /></FormControl>
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
                                                    <Input type="time" {...field} value={field.value || ''} className="h-8 pl-10" />
                                                    <Clock className="absolute left-3 top-2 h-4 w-4 text-gray-500" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                                <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="serviceCenterId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Center <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={serviceCentersData?.data?.map(sc => ({ label: sc.name, value: sc.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Service Center"
                                                    className="h-8"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fieldExecutiveId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Field Executive <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={executives.map(ex => ({ label: ex.name, value: ex.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Executive"
                                                    className="h-8"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                </div>
                        </CardContent>
                    </Card>

                        <Card className="border-border">
                            <CardHeader className="border-b bg-muted/40 py-2">
                                <CardTitle className="text-sm">Shipper / Consignee</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                            <FormField
                                control={form.control}
                                name="customerId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={customersData?.data?.map(c => ({ label: c.name, value: c.id })) || []}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select Customer"
                                                searchPlaceholder="Search customer..."
                                                className="h-8"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="shipperId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Shipper</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={shippersData?.data?.map(s => ({ label: s.shipperName, value: s.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Shipper"
                                                    searchPlaceholder="Search shipper..."
                                                    className="h-8"
                                                />
                                            </FormControl>
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
                                            <FormControl>
                                                <Combobox
                                                    options={consigneesData?.data?.map(c => ({ label: c.name, value: c.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Consignee"
                                                    searchPlaceholder="Search consignee..."
                                                    className="h-8"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                        <Card className="border-border">
                            <CardHeader className="border-b bg-muted/40 py-2">
                                <CardTitle className="text-sm">Shipment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3">
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="productId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product/Service <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={productsData?.data?.map(p => ({ label: p.productName, value: p.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Product"
                                                    className="h-8"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceMapId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Map <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={serviceMapsData?.data?.map(sm => ({ label: `${sm.serviceType} (${sm.id})`, value: sm.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Service Map"
                                                    className="h-8"
                                                />
                                            </FormControl>
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
                                            <FormControl>
                                                <Combobox
                                                    options={vendorsData?.data?.map(v => ({ label: v.vendorName, value: v.id })) || []}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Vendor"
                                                    className="h-8"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="origin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Origin</FormLabel>
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Origin" className="h-8" /></FormControl>
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
                                            <FormControl><Input {...field} value={field.value || ''} placeholder="Destination" className="h-8" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <FormField
                                    control={form.control}
                                    name="pieces"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pieces <span className="text-red-500">*</span></FormLabel>
                                            <FormControl><Input type="number" className="h-8" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
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
                                            <FormControl><Input type="number" step="0.01" className="h-8" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
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
                                            <FormControl><Input type="number" step="0.01" className="h-8" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="paymentType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Type <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={[
                                                        { label: "Cash", value: "CASH" },
                                                        { label: "Credit", value: "CREDIT" },
                                                        { label: "To Pay", value: "TOPAY" },
                                                    ]}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select Type"
                                                    className="h-8"
                                                />
                                            </FormControl>
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
                                            <FormControl>
                                                <Combobox
                                                    options={[
                                                        { label: "INR", value: "INR" },
                                                        { label: "USD", value: "USD" },
                                                    ]}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="INR"
                                                    className="h-8"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="shipmentValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipment Value</FormLabel>
                                            <FormControl><Input type="number" className="h-8" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2 pt-7">
                                    <FormField
                                        control={form.control}
                                        name="isCod"
                                        render={({ field }) => (
                                            <FormItem className="flex h-8 flex-row items-center justify-between rounded-md border px-3">
                                                <FormLabel className="text-sm">IS COD</FormLabel>
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
                                            <FormControl><Input type="number" className="h-8" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>
                    </div>
                </div>

                {/* Section 5: Piece Details */}
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-primary py-2">
                        <CardTitle className="text-sm text-primary-foreground">Click here to enter Piece Details</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPiece({ pieces: 1, actualWeightPerPc: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Piece
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3">
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
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-primary py-2">
                        <CardTitle className="text-sm text-primary-foreground">Click here to enter Charge Details</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendCharge({ chargeId: 0, amount: 0, fuelApply: false, taxApply: false, taxOnFuel: false })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Charge
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3">
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
                                            <Combobox
                                                options={masterChargesData?.data?.map(mc => ({ label: mc.name, value: mc.id })) || []}
                                                value={form.watch(`charges.${index}.chargeId`)}
                                                onChange={(val) => form.setValue(`charges.${index}.chargeId`, val as number)}
                                                placeholder="Select Charge"
                                                className="h-8"
                                            />
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

                <Card className="border-border">
                    <CardHeader className="border-b bg-primary py-2">
                        <CardTitle className="text-sm text-primary-foreground">Shipment Type</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shipment Type</FormLabel>
                                    <FormControl><Input {...field} value={field.value || ""} placeholder="Shipment Type" className="h-8" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instruction"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instruction</FormLabel>
                                    <FormControl><Input {...field} value={field.value || ""} placeholder="Instruction" className="h-8" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="medicalCharges"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Medical Service</FormLabel>
                                    <FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-8" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t bg-white pb-4 pt-4">
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
