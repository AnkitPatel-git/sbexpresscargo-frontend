"use client"

import { ChangeEvent, useEffect, useRef } from 'react'
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
    FormMessage,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_COMBO,
    FLOATING_INNER_CONTROL,
    OutlinedFieldShell,
    OutlinedFormSection,
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
import { serviceMapService } from '@/services/masters/service-map-service'
import { chargeService } from '@/services/masters/charge-service'
import { shipmentSchema, ShipmentFormValues, Shipment } from '@/types/transactions/shipment'
import type { Shipper } from '@/types/masters/shipper'
import type { Consignee } from '@/types/masters/consignee'

interface ShipmentFormProps {
    initialData?: Shipment | null
}

const normalizeShipmentPayload = (values: ShipmentFormValues): ShipmentFormValues => {
    const payload: ShipmentFormValues = { ...values }

    const optionalNumberKeys: Array<keyof ShipmentFormValues> = [
        "customerId",
        "clientId",
        "shipperId",
        "consigneeId",
        "productId",
        "vendorId",
        "serviceMapId",
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

    payload.clientId = payload.customerId

    if (!payload.bookTime) {
        payload.bookTime = undefined
    }

    if (payload.shipperId) {
        payload.shipper = undefined
    } else if (!payload.shipper?.shipperName && !payload.shipper?.mobile && !payload.shipper?.shipperCode) {
        payload.shipper = undefined
    }

    if (payload.consigneeId) {
        payload.consignee = undefined
    } else if (!payload.consignee?.name && !payload.consignee?.mobile && !payload.consignee?.code) {
        payload.consignee = undefined
    }

    payload.piecesRows = (payload.piecesRows || []).filter((row) => Number(row.pieces || 0) > 0)
    payload.charges = (payload.charges || []).filter((charge) => Number(charge.chargeId || 0) > 0)

    payload.serviceCenterId = undefined
    payload.fieldExecutiveId = undefined

    return payload
}

const parseNum = (value?: string): number | undefined => {
    if (!value) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
}

const parsePiecesCsv = (raw: string): NonNullable<ShipmentFormValues["piecesRows"]> => {
    const [headerLine, ...bodyLines] = raw.split(/\r?\n/).filter(Boolean)
    if (!headerLine) return []

    const headers = headerLine.split(",").map((h) => h.trim())
    const get = (cells: string[], key: string) => {
        const idx = headers.indexOf(key)
        return idx >= 0 ? (cells[idx] || "").trim() : ""
    }

    return bodyLines.map((line) => {
        const cells = line.split(",")
        return {
            childAwbNo: get(cells, "childAwbNo") || undefined,
            actualWeightPerPc: parseNum(get(cells, "actualWeightPerPc")) || 0,
            pieces: parseNum(get(cells, "pieces")) || 0,
            length: parseNum(get(cells, "length")),
            width: parseNum(get(cells, "width")),
            height: parseNum(get(cells, "height")),
            division: parseNum(get(cells, "division")),
            volumetricWeight: parseNum(get(cells, "volumetricWeight")),
            chargeWeight: parseNum(get(cells, "chargeWeight")),
        }
    }).filter((row) => row.pieces > 0)
}

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) return error.message
    return fallback
}

const strOrEmpty = (v: string | null | undefined) => (v == null ? '' : String(v))

function normalizeMasterSelectId(value: unknown): number {
    if (value === '' || value === undefined || value === null) return 0
    if (typeof value === 'number' && value > 0) return value
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : 0
}

const EMPTY_SHIPPER_BLOCK: NonNullable<ShipmentFormValues['shipper']> = {
    shipperCode: '',
    shipperName: '',
    shipperOrigin: '',
    contactPerson: '',
    address1: '',
    address2: '',
    pinCode: '',
    city: '',
    state: '',
    country: '',
    telephone1: '',
    mobile: '',
    email: '',
    iecNo: '',
}

const EMPTY_CONSIGNEE_BLOCK: NonNullable<ShipmentFormValues['consignee']> = {
    code: '',
    name: '',
    destination: '',
    contactPerson: '',
    address1: '',
    address2: '',
    pinCode: '',
    city: '',
    state: '',
    country: '',
    tel1: '',
    mobile: '',
    email: '',
    vat: '',
}

function shipperFromMaster(s: Shipper): NonNullable<ShipmentFormValues['shipper']> {
    return {
        shipperCode: strOrEmpty(s.shipperCode),
        shipperName: strOrEmpty(s.shipperName),
        shipperOrigin: strOrEmpty(s.shipperOrigin),
        contactPerson: strOrEmpty(s.contactPerson),
        address1: strOrEmpty(s.address1),
        address2: strOrEmpty(s.address2),
        pinCode: strOrEmpty(s.pinCode),
        city: strOrEmpty(s.city),
        state: strOrEmpty(s.state),
        country: '',
        telephone1: strOrEmpty(s.telephone1),
        mobile: strOrEmpty(s.mobile),
        email: strOrEmpty(s.email),
        iecNo: strOrEmpty(s.iecNo),
    }
}

function consigneeFromMaster(c: Consignee): NonNullable<ShipmentFormValues['consignee']> {
    return {
        code: strOrEmpty(c.code),
        name: strOrEmpty(c.name),
        destination: strOrEmpty(c.destination),
        contactPerson: strOrEmpty(c.contactPerson),
        address1: strOrEmpty(c.address1),
        address2: strOrEmpty(c.address2),
        pinCode: strOrEmpty(c.pinCode),
        city: strOrEmpty(c.city),
        state: strOrEmpty(c.state),
        country: '',
        tel1: strOrEmpty(c.tel1),
        mobile: strOrEmpty(c.mobile),
        email: strOrEmpty(c.email),
        vat: strOrEmpty(c.vat),
    }
}

export function ShipmentForm({ initialData }: ShipmentFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

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

    const { data: serviceMapsData } = useQuery({
        queryKey: ['service-maps-list'],
        queryFn: () => serviceMapService.getServiceMaps({ limit: 100 }),
    })

    const { data: masterChargesData } = useQuery({
        queryKey: ['master-charges-list'],
        queryFn: () => chargeService.getCharges({ limit: 100 }),
    })

    const form = useForm<ShipmentFormValues>({
        resolver: zodResolver(shipmentSchema) as Resolver<ShipmentFormValues>,
        defaultValues: {
            version: initialData?.version,
            awbNo: initialData?.awbNo || '',
            bookDate: initialData?.bookDate || new Date().toISOString().split('T')[0],
            bookTime: initialData?.bookTime || format(new Date(), "HH:mm"),
            referenceNo: initialData?.referenceNo || '',
            customerId: initialData?.customerId || 0,
            clientId: initialData?.customerId || 0,
            shipperId: initialData?.shipperId || 0,
            consigneeId: initialData?.consigneeId || 0,
            shipper: initialData?.shipper ? {
                shipperName: initialData.shipper.shipperName || initialData.shipper.name || '',
            } : undefined,
            consignee: initialData?.consignee ? {
                name: initialData.consignee.consigneeName || initialData.consignee.name || '',
            } : undefined,
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
            medicalCharges: initialData?.medicalCharges ?? 0,
            paymentType: initialData?.paymentType || 'CREDIT',
            content: initialData?.content || '',
            instruction: initialData?.instruction || '',
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
                clientId: initialData.customerId,
                version: initialData.version,
                piecesRows: initialData.piecesRows || [],
                charges: initialData.charges || [],
                serviceCenterId: undefined,
                fieldExecutiveId: undefined,
            })
        }
    }, [initialData, form])

    const watchedShipperId = form.watch('shipperId')
    const watchedConsigneeId = form.watch('consigneeId')

    const prevShipperIdRef = useRef<number>(0)
    const prevConsigneeIdRef = useRef<number>(0)

    useEffect(() => {
        const shippers = shippersData?.data
        if (!shippers) return

        const id = normalizeMasterSelectId(watchedShipperId)
        const prev = prevShipperIdRef.current
        prevShipperIdRef.current = id

        if (id > 0) {
            const found = shippers.find((s) => s.id === id)
            if (found) {
                form.setValue('shipper', shipperFromMaster(found), { shouldDirty: false, shouldValidate: true })
            }
            return
        }

        if (prev > 0) {
            form.setValue('shipper', EMPTY_SHIPPER_BLOCK, { shouldDirty: false, shouldValidate: true })
        }
    }, [watchedShipperId, shippersData?.data, form])

    useEffect(() => {
        const list = consigneesData?.data
        if (!list) return

        const id = normalizeMasterSelectId(watchedConsigneeId)
        const prev = prevConsigneeIdRef.current
        prevConsigneeIdRef.current = id

        if (id > 0) {
            const found = list.find((c) => c.id === id)
            if (found) {
                form.setValue('consignee', consigneeFromMaster(found), { shouldDirty: false, shouldValidate: true })
            }
            return
        }

        if (prev > 0) {
            form.setValue('consignee', EMPTY_CONSIGNEE_BLOCK, { shouldDirty: false, shouldValidate: true })
        }
    }, [watchedConsigneeId, consigneesData?.data, form])

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
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, `Failed to ${isEdit ? 'update' : 'create'} shipment`))
        }
    })

    const templateMutation = useMutation({
        mutationFn: () => shipmentService.downloadPiecesTemplate(),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = 'shipment-pieces-template.csv'
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            window.URL.revokeObjectURL(url)
            toast.success('Template downloaded')
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, 'Failed to download template'))
        },
    })

    const handlePiecesCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            const raw = await file.text()
            const parsed = parsePiecesCsv(raw)
            form.setValue('piecesRows', parsed, { shouldValidate: true })
            toast.success(`${parsed.length} piece row(s) imported`)
        } catch {
            toast.error('Unable to parse uploaded template')
        } finally {
            event.target.value = ''
        }
    }

    const onSubmit = (values: ShipmentFormValues) => {
        const payload: ShipmentFormValues = isEdit
            ? { ...values, version: values.version || initialData?.version }
            : values
        mutation.mutate(payload)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-20">
                <div className="rounded-md border border-border bg-card p-3">
                    <div className="space-y-3">
                        <FormSection title="Booking & Client" contentClassName="space-y-3 px-3 pb-3 pt-6">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                                    <FormField
                                        control={form.control}
                                        name="awbNo"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>AWB No <span className="text-red-500">*</span></>} itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Input {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bookDate"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>Book Date <span className="text-red-500">*</span></>} itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bookTime"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Time" itemClassName="md:col-span-1">
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            {...field}
                                                            value={field.value || ""}
                                                            className={cn(FLOATING_INNER_CONTROL, "pl-8")}
                                                        />
                                                    </FormControl>
                                                    <Clock className="pointer-events-none absolute bottom-1.5 left-2 h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="referenceNo"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Reference No" itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="customerId"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>Client Name <span className="text-red-500">*</span></>} itemClassName="md:col-span-2">
                                                <FormControl>
                                                    <Combobox
                                                        options={customersData?.data?.map((c) => ({ label: c.name, value: c.id })) || []}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select customer"
                                                        searchPlaceholder="Search customer..."
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                        </FormSection>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                            <FormSection title="Shipper Details" contentClassName="space-y-3 p-3 pt-6">
                                    <FormField
                                        control={form.control}
                                        name="shipperId"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Shipper Master">
                                                <FormControl>
                                                    <Combobox
                                                        options={shippersData?.data?.map((s) => ({ label: s.shipperName, value: s.id })) || []}
                                                        value={field.value}
                                                        onChange={(v) => field.onChange(normalizeMasterSelectId(v))}
                                                        placeholder="Select shipper"
                                                        searchPlaceholder="Search shipper..."
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="shipper.shipperOrigin"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Origin <span className="text-red-500">*</span></>}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.shipperCode"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Code">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.shipperName"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Company Name <span className="text-red-500">*</span></>} itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.contactPerson"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Contact Name">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.address1"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Address 1">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.address2"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Address 2" itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.pinCode"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Pincode">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.city"
                                            render={({ field }) => (
                                                <FloatingFormItem label="City">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.state"
                                            render={({ field }) => (
                                                <FloatingFormItem label="State">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.telephone1"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Telephone">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.mobile"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Mobile No.">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.email"
                                            render={({ field }) => (
                                                <FloatingFormItem label="E-Mail">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.country"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Country">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.iecNo"
                                            render={({ field }) => (
                                                <FloatingFormItem label="IEC No.">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                    </div>
                            </FormSection>

                            <FormSection title="Consignee Details" contentClassName="space-y-3 p-3 pt-6">
                                    <FormField
                                        control={form.control}
                                        name="consigneeId"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Consignee Master">
                                                <FormControl>
                                                    <Combobox
                                                        options={consigneesData?.data?.map((c) => ({ label: c.name, value: c.id })) || []}
                                                        value={field.value}
                                                        onChange={(v) => field.onChange(normalizeMasterSelectId(v))}
                                                        placeholder="Select consignee"
                                                        searchPlaceholder="Search consignee..."
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="consignee.destination"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Destination <span className="text-red-500">*</span></>}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.code"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Code">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.name"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Company Name <span className="text-red-500">*</span></>} itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.contactPerson"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Contact Name">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.address1"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Address 1">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.address2"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Address 2" itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.pinCode"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Pincode">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.city"
                                            render={({ field }) => (
                                                <FloatingFormItem label="City">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.state"
                                            render={({ field }) => (
                                                <FloatingFormItem label="State">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.tel1"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Telephone">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.mobile"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Mobile No.">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.email"
                                            render={({ field }) => (
                                                <FloatingFormItem label="E-Mail">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.country"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Country">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.vat"
                                            render={({ field }) => (
                                                <FloatingFormItem label="VAT">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                    </div>
                            </FormSection>

                            <FormSection title="Services Details" contentClassName="space-y-3 p-3 pt-6">
                                    <FormField
                                        control={form.control}
                                        name="productId"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>Product <span className="text-red-500">*</span></>}>
                                                <FormControl>
                                                    <Combobox
                                                        options={productsData?.data?.map((p) => ({ label: p.productName, value: p.id })) || []}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select product"
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vendorId"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>Vendor <span className="text-red-500">*</span></>}>
                                                <FormControl>
                                                    <Combobox
                                                        options={vendorsData?.data?.map((v) => ({ label: v.vendorName, value: v.id })) || []}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select vendor"
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceMapId"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>Service <span className="text-red-500">*</span></>}>
                                                <FormControl>
                                                    <Combobox
                                                        options={
                                                            serviceMapsData?.data?.map((sm) => ({
                                                                label: `${sm.serviceType} (${sm.id})`,
                                                                value: sm.id,
                                                            })) || []
                                                        }
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select service"
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="shipmentValue"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Shipment Value">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Currency">
                                                    <FormControl>
                                                        <Combobox
                                                            options={[
                                                                { label: "INR", value: "INR" },
                                                                { label: "USD", value: "USD" },
                                                            ]}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="INR"
                                                            className={FLOATING_INNER_COMBO}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="pieces"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Pieces <span className="text-red-500">*</span></>}>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="actualWeight"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Actual Weight <span className="text-red-500">*</span></>}>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="km"
                                            render={({ field }) => (
                                                <FloatingFormItem label="KM">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="volumetricWeight"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Volumetric Weight">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="chargeWeight"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Charge Weight <span className="text-red-500">*</span></>}>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paymentType"
                                            render={({ field }) => (
                                                <FloatingFormItem label={<>Payment Type <span className="text-red-500">*</span></>}>
                                                    <FormControl>
                                                        <Combobox
                                                            options={[
                                                                { label: "Cash", value: "CASH" },
                                                                { label: "Credit", value: "CREDIT" },
                                                                { label: "To Pay", value: "TOPAY" },
                                                            ]}
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="Select type"
                                                            className={FLOATING_INNER_COMBO}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <FormField
                                            control={form.control}
                                            name="commercial"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Commercial">
                                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                    </div>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="oda"
                                            render={({ field }) => (
                                                <FloatingFormItem label="ODA">
                                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                    </div>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="medicalCharges"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Medical Charges">
                                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={Number(field.value) > 0}
                                                                onCheckedChange={(v) => field.onChange(v ? 1 : 0)}
                                                            />
                                                        </FormControl>
                                                    </div>
                                                </FloatingFormItem>
                                            )}
                                        />
                                    </div>
                            </FormSection>
                        </div>
                    </div>
                </div>

                {/* Section 5: Piece Details */}
                <OutlinedFormSection label="Piece Details" labelTone="navy">
                    <div className="flex flex-wrap items-end justify-end gap-2 border-b border-border/70 pb-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => templateMutation.mutate()} disabled={templateMutation.isPending}>
                            Download Template
                        </Button>
                        <OutlinedFieldShell label="Import CSV" className="w-full min-w-[200px] sm:w-[230px]">
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handlePiecesCsvUpload}
                                className={cn(FLOATING_INNER_CONTROL, "cursor-pointer file:mr-2")}
                            />
                        </OutlinedFieldShell>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPiece({ pieces: 1, actualWeightPerPc: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Piece
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-0 bg-primary hover:bg-primary">
                                    <TableHead className="whitespace-nowrap text-primary-foreground first:rounded-tl-md">
                                        Child AWB
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Pcs
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Weight/Pc
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">L</TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">W</TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">H</TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Vol. Weight
                                    </TableHead>
                                    <TableHead className="w-[50px] text-primary-foreground last:rounded-tr-md" />
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
                                        <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                                            No piece details added.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </OutlinedFormSection>

                {/* Section 6: Charges */}
                <OutlinedFormSection label="Charge Details" labelTone="navy">
                    <div className="flex justify-end border-b border-border/70 pb-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => appendCharge({ chargeId: 0, amount: 0, fuelApply: false, taxApply: false, taxOnFuel: false })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Charge
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-0 bg-primary hover:bg-primary">
                                    <TableHead className="whitespace-nowrap text-primary-foreground first:rounded-tl-md">
                                        Charge
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Description
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Amount
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">Fuel</TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">Tax</TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">Total</TableHead>
                                    <TableHead className="w-[50px] text-primary-foreground last:rounded-tr-md" />
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
                                {chargeFields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                                            No charges added.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </OutlinedFormSection>

                <FormSection title="Shipment Type" contentClassName="grid grid-cols-1 gap-3 p-3 pt-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FloatingFormItem label="Shipment Type">
                                    <FormControl>
                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="instruction"
                            render={({ field }) => (
                                <FloatingFormItem label="Instruction">
                                    <FormControl>
                                        <Input {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                </FormSection>

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
                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className={!isEdit ? "bg-green-600 hover:bg-green-700 text-white" : undefined}
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update Shipment' : 'Create Shipment'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
