"use client"

import { ChangeEvent, useEffect, useRef, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { omitEmptyCodeFields } from '@/lib/master-code-schema'
import type { Shipper } from '@/types/masters/shipper'
import type { Consignee } from '@/types/masters/consignee'

interface ShipmentFormProps {
    initialData?: Shipment | null
}

type ForwardingRow = {
    deliveryAwb: string
    forwardingAwb: string
    deliveryVendorId: number
    deliveryServiceMapId: number
    totalAmount: number
}

type KycRow = {
    id: string
    type: string
    entryType: string
    entryDate: string
    file: File | null
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
    } else if (payload.shipper) {
        const s = omitEmptyCodeFields({ ...payload.shipper }, ['shipperCode']) as NonNullable<ShipmentFormValues['shipper']>
        if (!s.shipperName?.trim() && !s.mobile?.trim() && !s.shipperCode?.trim()) {
            payload.shipper = undefined
        } else {
            payload.shipper = s
        }
    }

    if (payload.consigneeId) {
        payload.consignee = undefined
    } else if (payload.consignee) {
        const c = omitEmptyCodeFields({ ...payload.consignee }, ['code']) as NonNullable<ShipmentFormValues['consignee']>
        if (!c.name?.trim() && !c.mobile?.trim() && !c.code?.trim()) {
            payload.consignee = undefined
        } else {
            payload.consignee = c
        }
    }

    payload.piecesRows = (payload.piecesRows || []).filter((row) => Number(row.pieces || 0) > 0)
    payload.charges = (payload.charges || []).filter((charge) => Number(charge.chargeId || 0) > 0)

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
    telephone: '',
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
    telephone: '',
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
        pinCode: strOrEmpty(s.serviceablePincode?.pinCode ?? s.pinCode),
        city: strOrEmpty(s.city ?? s.serviceablePincode?.cityName),
        state: strOrEmpty(s.state),
        country: '',
        telephone: strOrEmpty(s.telephone),
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
        pinCode: strOrEmpty(c.serviceablePincode?.pinCode ?? c.pinCode),
        city: strOrEmpty(c.city ?? c.serviceablePincode?.cityName),
        state: strOrEmpty(c.state),
        country: '',
        telephone: strOrEmpty(c.telephone),
        mobile: strOrEmpty(c.mobile),
        email: strOrEmpty(c.email),
        vat: strOrEmpty(c.vat),
    }
}

export function ShipmentForm({ initialData }: ShipmentFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [activeTab, setActiveTab] = useState("awb")
    const [savedShipment, setSavedShipment] = useState<{ id: number; version?: number } | null>(
        initialData ? { id: initialData.id, version: initialData.version } : null
    )
    const [isAwbStepComplete, setIsAwbStepComplete] = useState(Boolean(initialData))
    const [isForwardingStepComplete, setIsForwardingStepComplete] = useState(Boolean(initialData?.forwardings?.length))
    const [forwardingForm, setForwardingForm] = useState<ForwardingRow>(() => {
        const existing = initialData?.forwardings?.[0]
        return {
            deliveryAwb: existing?.deliveryAwb || "",
            forwardingAwb: existing?.forwardingAwb || "",
            deliveryVendorId: existing?.deliveryVendorId || existing?.deliveryVendor?.id || 0,
            deliveryServiceMapId: existing?.deliveryServiceMapId || 0,
            totalAmount: Number(existing?.totalAmount || 0),
        }
    })
    const [kycRows, setKycRows] = useState<KycRow[]>([
        { id: crypto.randomUUID(), type: "AADHAAR", entryType: "ID_PROOF", entryDate: format(new Date(), "yyyy-MM-dd"), file: null },
    ])

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
    }, [watchedPiecesRows, form]);

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
    }, [watchedCharges, form]);

    // --- End Calculations ---

    const awbMutation = useMutation({
        mutationFn: (values: ShipmentFormValues) => {
            const payload = normalizeShipmentPayload(values)
            const targetId = savedShipment?.id || initialData?.id
            return targetId
                ? shipmentService.updateShipment(targetId, { ...payload, version: payload.version || savedShipment?.version || initialData?.version })
                : shipmentService.createShipment(payload)
        },
        onSuccess: (response) => {
            const shipment = response?.data
            const shipmentId = shipment?.id || savedShipment?.id || initialData?.id
            const version = shipment?.version || savedShipment?.version || initialData?.version
            if (shipmentId) {
                setSavedShipment({ id: shipmentId, version })
                setIsAwbStepComplete(true)
                setActiveTab('forwarding')
            }
            toast.success(`Shipment ${isEdit || savedShipment ? 'updated' : 'created'} successfully`)
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, `Failed to ${isEdit || savedShipment ? 'update' : 'create'} shipment`))
        }
    })

    const forwardingMutation = useMutation({
        mutationFn: async () => {
            if (!savedShipment?.id || !savedShipment.version) {
                throw new Error('Please create shipment first')
            }
            return shipmentService.upsertForwarding(savedShipment.id, {
                version: Number(savedShipment.version),
                deliveryAwb: forwardingForm.deliveryAwb || undefined,
                forwardingAwb: forwardingForm.forwardingAwb || undefined,
                deliveryVendorId: forwardingForm.deliveryVendorId || undefined,
                deliveryServiceMapId: forwardingForm.deliveryServiceMapId || undefined,
                totalAmount: forwardingForm.totalAmount > 0 ? forwardingForm.totalAmount : undefined,
            })
        },
        onSuccess: (response) => {
            const nextVersion = response?.data?.shipment?.version || savedShipment?.version
            if (savedShipment?.id) {
                setSavedShipment({ id: savedShipment.id, version: nextVersion })
            }
            setIsForwardingStepComplete(true)
            setActiveTab('kyc')
            toast.success('Forwarding saved')
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, 'Failed to save forwarding'))
        },
    })

    const kycMutation = useMutation({
        mutationFn: async () => {
            if (!savedShipment?.id) {
                throw new Error('Please create shipment first')
            }
            const uploads = kycRows.filter((row) => row.file)
            for (const row of uploads) {
                if (row.file) {
                    await shipmentService.uploadKyc(savedShipment.id, {
                        type: row.type,
                        entryType: row.entryType,
                        entryDate: row.entryDate || undefined,
                        file: row.file,
                    })
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] })
            toast.success('Shipment process completed')
            router.push('/transactions/shipment')
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, 'Failed to upload KYC'))
        },
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

    const updateForwardingForm = (patch: Partial<ForwardingRow>) => {
        setForwardingForm((prev) => ({ ...prev, ...patch }))
    }

    const forwardingServiceOptions = (serviceMapsData?.data || [])
        .filter((sm) => sm.vendorId === forwardingForm.deliveryVendorId)
        .map((sm) => ({
            label: `${sm.serviceType} (${sm.id})`,
            value: sm.id,
        }))

    const addKycRow = () => {
        setKycRows((prev) => [
            ...prev,
            { id: crypto.randomUUID(), type: "AADHAAR", entryType: "ID_PROOF", entryDate: format(new Date(), "yyyy-MM-dd"), file: null },
        ])
    }

    const removeKycRow = (id: string) => {
        setKycRows((prev) => prev.filter((row) => row.id !== id))
    }

    const updateKycRow = (id: string, patch: Partial<KycRow>) => {
        setKycRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)))
    }

    const handleAwbNext = async () => {
        const valid = await form.trigger([
            'bookDate',
            'customerId',
            'productId',
            'pieces',
            'actualWeight',
            'paymentType',
        ])
        if (!valid) {
            toast.error('Please fill required AWB details first')
            return
        }
        const values = form.getValues()
        awbMutation.mutate(values)
    }

    const handleForwardingNext = async () => {
        if (!forwardingForm.deliveryVendorId || !forwardingForm.deliveryServiceMapId) {
            toast.error('Please select forwarding vendor and service')
            return
        }
        forwardingMutation.mutate()
    }

    const handleTabChange = (nextTab: string) => {
        if (nextTab === 'awb') {
            setActiveTab('awb')
            return
        }
        if (nextTab === 'forwarding') {
            if (!isAwbStepComplete) {
                toast.error('Complete AWB step first')
                return
            }
            setActiveTab('forwarding')
            return
        }
        if (nextTab === 'kyc') {
            if (!isAwbStepComplete || !isForwardingStepComplete) {
                toast.error('Complete Forwarding step first')
                return
            }
            setActiveTab('kyc')
        }
    }

    return (
        <Form {...form}>
            <form className="space-y-4 pb-20">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="rounded-md border border-border/60 bg-muted/50 p-1">
                        <TabsTrigger value="awb" className="rounded-md px-4 py-1.5 text-xs">AWB</TabsTrigger>
                        <TabsTrigger value="forwarding" className="rounded-md px-4 py-1.5 text-xs" disabled={!isAwbStepComplete}>Forwarding</TabsTrigger>
                        <TabsTrigger value="kyc" className="rounded-md px-4 py-1.5 text-xs" disabled={!isAwbStepComplete || !isForwardingStepComplete}>KYC Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="awb" className="space-y-4">
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
                                                <FloatingFormItem label="Shipper code (optional)">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} placeholder="Blank = auto-generate" className={FLOATING_INNER_CONTROL} />
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
                                            name="shipper.telephone"
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
                                                <FloatingFormItem label="Consignee code (optional)">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} placeholder="Blank = auto-generate" className={FLOATING_INNER_CONTROL} />
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
                                            name="consignee.telephone"
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
                    </TabsContent>

                    <TabsContent value="forwarding">
                        <OutlinedFormSection label="Forwarding Details" labelTone="navy">
                            <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
                                <FloatingFormItem label="Delivery AWB">
                                    <Input
                                        className={FLOATING_INNER_CONTROL}
                                        value={forwardingForm.deliveryAwb}
                                        onChange={(e) => updateForwardingForm({ deliveryAwb: e.target.value })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Forwarding AWB">
                                    <Input
                                        className={FLOATING_INNER_CONTROL}
                                        value={forwardingForm.forwardingAwb}
                                        onChange={(e) => updateForwardingForm({ forwardingAwb: e.target.value })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label={<>Vendor <span className="text-red-500">*</span></>}>
                                    <Combobox
                                        options={vendorsData?.data?.map((v) => ({ label: v.vendorName, value: v.id })) || []}
                                        value={forwardingForm.deliveryVendorId}
                                        onChange={(val) =>
                                            updateForwardingForm({
                                                deliveryVendorId: Number(val) || 0,
                                                deliveryServiceMapId: 0,
                                            })
                                        }
                                        placeholder="Select vendor"
                                        className={FLOATING_INNER_COMBO}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label={<>Service <span className="text-red-500">*</span></>}>
                                    <Combobox
                                        options={forwardingServiceOptions}
                                        value={forwardingForm.deliveryServiceMapId}
                                        onChange={(val) => updateForwardingForm({ deliveryServiceMapId: Number(val) || 0 })}
                                        placeholder={forwardingForm.deliveryVendorId > 0 ? "Select service" : "Select vendor first"}
                                        className={FLOATING_INNER_COMBO}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Total Amount">
                                    <Input
                                        type="number"
                                        className={FLOATING_INNER_CONTROL}
                                        value={forwardingForm.totalAmount || 0}
                                        onChange={(e) => updateForwardingForm({ totalAmount: Number(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                            </div>
                            <p className="pt-2 text-xs text-muted-foreground">Forwarding details are saved after shipment save/update.</p>
                        </OutlinedFormSection>
                    </TabsContent>

                    <TabsContent value="kyc">
                        <OutlinedFormSection label="KYC Upload" labelTone="navy">
                            <div className="flex justify-end border-b border-border/70 pb-3">
                                <Button type="button" variant="outline" size="sm" onClick={addKycRow}>
                                    <Plus className="mr-2 h-4 w-4" /> Add KYC Row
                                </Button>
                            </div>
                            <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b-0 bg-primary hover:bg-primary">
                                            <TableHead className="text-primary-foreground first:rounded-tl-md">Type</TableHead>
                                            <TableHead className="text-primary-foreground">Entry Type</TableHead>
                                            <TableHead className="text-primary-foreground">Entry Date</TableHead>
                                            <TableHead className="text-primary-foreground">File</TableHead>
                                            <TableHead className="w-[50px] text-primary-foreground last:rounded-tr-md" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {kycRows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell className="w-[220px]">
                                                    <Combobox
                                                        options={[
                                                            { label: "Aadhaar", value: "AADHAAR" },
                                                            { label: "PAN", value: "PAN" },
                                                            { label: "GST", value: "GST" },
                                                            { label: "Invoice", value: "INVOICE" },
                                                            { label: "Other", value: "OTHER" },
                                                        ]}
                                                        value={row.type}
                                                        onChange={(val) => updateKycRow(row.id, { type: String(val || "AADHAAR") })}
                                                        placeholder="Select type"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[200px]">
                                                    <Combobox
                                                        options={[
                                                            { label: "ID Proof", value: "ID_PROOF" },
                                                            { label: "Address Proof", value: "ADDRESS_PROOF" },
                                                            { label: "Invoice", value: "INVOICE" },
                                                            { label: "Other", value: "OTHER" },
                                                        ]}
                                                        value={row.entryType}
                                                        onChange={(val) => updateKycRow(row.id, { entryType: String(val || "ID_PROOF") })}
                                                        placeholder="Select entry type"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell className="w-[180px]">
                                                    <Input
                                                        type="date"
                                                        value={row.entryDate}
                                                        className="h-8"
                                                        onChange={(e) => updateKycRow(row.id, { entryDate: e.target.value })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="file"
                                                        className="h-8 cursor-pointer"
                                                        onChange={(e) => updateKycRow(row.id, { file: e.target.files?.[0] || null })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeKycRow(row.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <p className="pt-2 text-xs text-muted-foreground">KYC files are uploaded after shipment save/update using AWB number.</p>
                        </OutlinedFormSection>
                    </TabsContent>
                </Tabs>

                {/* Submit Buttons */}
                <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t bg-white pb-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/transactions/shipment')}
                        disabled={awbMutation.isPending || forwardingMutation.isPending || kycMutation.isPending}
                    >
                        Cancel
                    </Button>
                    {activeTab === 'forwarding' && (
                        <Button type="button" variant="outline" onClick={() => setActiveTab('awb')}>
                            Previous
                        </Button>
                    )}
                    {activeTab === 'kyc' && (
                        <Button type="button" variant="outline" onClick={() => setActiveTab('forwarding')}>
                            Previous
                        </Button>
                    )}
                    {activeTab === 'awb' && (
                        <Button
                            type="button"
                            onClick={handleAwbNext}
                            disabled={awbMutation.isPending}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {awbMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isAwbStepComplete ? 'Save AWB & Next' : 'Create AWB & Next'}
                        </Button>
                    )}
                    {activeTab === 'forwarding' && (
                        <Button type="button" onClick={handleForwardingNext} disabled={forwardingMutation.isPending}>
                            {forwardingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Forwarding & Next
                        </Button>
                    )}
                    {activeTab === 'kyc' && (
                        <Button type="button" onClick={() => kycMutation.mutate()} disabled={kycMutation.isPending}>
                            {kycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finish
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    )
}
