"use client"

import { ChangeEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react'
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
    Calculator,
    RotateCcw
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
    FLOATING_INNER_SELECT_TRIGGER,
    FLOATING_INNER_TEXTAREA,
    OutlinedFieldShell,
    OutlinedFormSection,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { contentService } from '@/services/masters/content-service'
import { shipperService } from '@/services/masters/shipper-service'
import { consigneeService } from '@/services/masters/consignee-service'
import { productService } from '@/services/masters/product-service'
import { vendorService } from '@/services/masters/vendor-service'
import { serviceMapService } from '@/services/masters/service-map-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { chargeService } from '@/services/masters/charge-service'
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { pincodeDistanceService } from '@/services/utilities/pincode-distance-service'
import { shipmentSchema, ShipmentFormValues, Shipment, ShipmentCalculateResponse } from '@/types/transactions/shipment'
import { omitEmptyCodeFields } from '@/lib/master-code-schema'
import type { Shipper } from '@/types/masters/shipper'
import type { Consignee } from '@/types/masters/consignee'
import type { ServiceablePincode } from '@/types/utilities/serviceable-pincode'
import { useDebounce } from '@/hooks/use-debounce'

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

    const optionalNumberKeys = [
        "customerId",
        "clientId",
        "shipperId",
        "consigneeId",
        "productId",
        "fromZoneId",
        "toZoneId",
        "shipmentTotalValue",
        "serviceCenterId",
        "serviceMapId",
        "vendorId",
        "codAmount",
        "shipmentValue",
        "pieces",
        "actualWeight",
        "chargeWeight",
        "volumetricWeight",
        "floorCount",
        "km",
    ] as const

    optionalNumberKeys.forEach((key) => {
        const currentValue = (payload as Record<string, unknown>)[key]
        if (typeof currentValue === "number" && currentValue <= 0) {
            ;(payload as Record<string, unknown>)[key] = undefined
        }
    })

    payload.clientId = payload.customerId
    payload.shipmentTotalValue = payload.shipmentTotalValue ?? payload.shipmentValue
    payload.shipmentValue = undefined
    payload.pieces = undefined
    payload.actualWeight = undefined
    payload.volumetricWeight = undefined
    payload.chargeWeight = undefined

    if (!payload.awbNo?.trim()) {
        payload.awbNo = undefined
    }

    ;(["origin", "originCode", "destination", "destinationCode", "currency", "medicalCharges", "manifestNo", "manifestDate", "invoiceNo", "debitNoteNo", "creditNoteNo", "flightNo"] as const).forEach((key) => {
        payload[key] = undefined
    })

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
        const actualWeight = parseNum(get(cells, "actualWeight"))
        const fallbackActualWeight = parseNum(get(cells, "actualWeightPerPc"))
        return {
            actualWeight: actualWeight ?? fallbackActualWeight ?? 0,
            pieces: parseNum(get(cells, "pieces")) || 0,
            length: parseNum(get(cells, "length")),
            width: parseNum(get(cells, "width")),
            height: parseNum(get(cells, "height")),
            division: parseNum(get(cells, "division")),
            volumetricWeight: parseNum(get(cells, "volumetricWeight")),
            chargeWeight: parseNum(get(cells, "chargeWeight")),
            items: [createEmptyPieceItem()],
        }
    }).filter((row) => row.pieces > 0)
}

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) return error.message
    return fallback
}

const strOrEmpty = (v: string | null | undefined) => (v == null ? '' : String(v))

const requiredFieldLabel = (label: string, required: boolean) => (
    <>
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
    </>
)

const formatServiceablePincodeLabel = (pincode: ServiceablePincode) =>
    pincode.pinCode

const numberInputValue = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    return ''
}

const parseOptionalNumberInput = (value: string) => {
    if (!value.trim()) return undefined
    const next = Number(value)
    return Number.isFinite(next) ? next : undefined
}

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
}

const createEmptyPieceItem = (): PieceItemForm => ({
    contentId: 0,
    quantity: 1,
    measureValue: undefined,
    measureUnit: '',
    totalValue: 0,
    invoiceDate: format(new Date(), 'yyyy-MM-dd'),
    invoiceNumber: '',
})

const createEmptyPieceRow = (): PieceRowForm => ({
    pieces: 1,
    actualWeight: 0,
    length: undefined,
    width: undefined,
    height: undefined,
    division: undefined,
    volumetricWeight: undefined,
    chargeWeight: undefined,
    items: [createEmptyPieceItem()],
})

const normalizePieceRows = (rows?: ShipmentFormValues['piecesRows']): NonNullable<ShipmentFormValues['piecesRows']> => {
    if (!rows || rows.length === 0) {
        return [createEmptyPieceRow()]
    }

    return rows.map((row) => ({
        ...row,
        actualWeight: Number((row as Record<string, unknown>).actualWeight ?? (row as Record<string, unknown>).actualWeightPerPc ?? 0) || 0,
        items: row.items && row.items.length > 0 ? row.items : [createEmptyPieceItem()],
    }))
}

type PieceRowForm = NonNullable<ShipmentFormValues['piecesRows']>[number]
type PieceItemList = NonNullable<PieceRowForm['items']>
type PieceItemForm = PieceItemList[number]

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
        state: strOrEmpty(s.state?.stateName ?? s.serviceablePincode?.state?.stateName),
        country: strOrEmpty(s.country?.name ?? s.serviceablePincode?.country?.name),
        telephone: strOrEmpty(s.telephone),
        mobile: strOrEmpty(s.mobile),
        email: strOrEmpty(s.email),
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
        state: strOrEmpty(c.stateMaster?.stateName ?? c.state?.stateName ?? c.serviceablePincode?.state?.stateName),
        country: strOrEmpty(c.country?.name ?? c.serviceablePincode?.country?.name),
        telephone: strOrEmpty(c.telephone),
        mobile: strOrEmpty(c.mobile),
        email: strOrEmpty(c.email),
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
    const [chargePreview, setChargePreview] = useState<ShipmentCalculateResponse | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')
    const [shipperSearch, setShipperSearch] = useState('')
    const [consigneeSearch, setConsigneeSearch] = useState('')
    const [contentSearch, setContentSearch] = useState('')
    const [productSearch, setProductSearch] = useState('')
    const [vendorSearch, setVendorSearch] = useState('')
    const [serviceMapSearch, setServiceMapSearch] = useState('')
    const [chargeSearch, setChargeSearch] = useState('')
    const [serviceCenterSearch, setServiceCenterSearch] = useState('')
    const [piecesCsvName, setPiecesCsvName] = useState('No file chosen')
    const [shipperPincodeSearch, setShipperPincodeSearch] = useState('')
    const [consigneePincodeSearch, setConsigneePincodeSearch] = useState('')
    const [selectedShipperPincode, setSelectedShipperPincode] = useState<ServiceablePincode | null>(null)
    const [selectedConsigneePincode, setSelectedConsigneePincode] = useState<ServiceablePincode | null>(null)
    const [suppressShipperErrors, setSuppressShipperErrors] = useState(false)
    const [suppressConsigneeErrors, setSuppressConsigneeErrors] = useState(false)

    const debouncedCustomerSearch = useDebounce(customerSearch.trim(), 300)
    const debouncedShipperSearch = useDebounce(shipperSearch.trim(), 300)
    const debouncedConsigneeSearch = useDebounce(consigneeSearch.trim(), 300)
    const debouncedContentSearch = useDebounce(contentSearch.trim(), 300)
    const debouncedProductSearch = useDebounce(productSearch.trim(), 300)
    const debouncedVendorSearch = useDebounce(vendorSearch.trim(), 300)
    const debouncedServiceMapSearch = useDebounce(serviceMapSearch.trim(), 300)
    const debouncedChargeSearch = useDebounce(chargeSearch.trim(), 300)
    const debouncedServiceCenterSearch = useDebounce(serviceCenterSearch.trim(), 300)
    const debouncedShipperPincodeSearch = useDebounce(shipperPincodeSearch.trim(), 300)
    const debouncedConsigneePincodeSearch = useDebounce(consigneePincodeSearch.trim(), 300)

    // Lookup Data
    const { data: customersData } = useQuery({
        queryKey: ['customers-list', debouncedCustomerSearch],
        queryFn: () => customerService.getCustomers({ limit: 10, search: debouncedCustomerSearch || undefined }),
    })

    const { data: shippersData } = useQuery({
        queryKey: ['shippers-list', debouncedShipperSearch],
        queryFn: () => shipperService.getShippers({ limit: 10, search: debouncedShipperSearch || undefined }),
    })

    const { data: consigneesData } = useQuery({
        queryKey: ['consignees-list', debouncedConsigneeSearch],
        queryFn: () => consigneeService.getConsignees({ limit: 10, search: debouncedConsigneeSearch || undefined }),
    })

    const { data: productsData } = useQuery({
        queryKey: ['products-list', debouncedProductSearch],
        queryFn: () => productService.getProducts({ limit: 10, search: debouncedProductSearch || undefined }),
    })

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors-list', debouncedVendorSearch],
        queryFn: () => vendorService.getVendors({ limit: 10, search: debouncedVendorSearch || undefined }),
    })

    const { data: serviceMapsData } = useQuery({
        queryKey: ['service-maps-list', forwardingForm.deliveryVendorId, debouncedServiceMapSearch],
        queryFn: () => serviceMapService.getServiceMaps({ limit: 10, search: debouncedServiceMapSearch || undefined, vendorId: forwardingForm.deliveryVendorId || undefined }),
    })

    const { data: masterChargesData } = useQuery({
        queryKey: ['master-charges-list', debouncedChargeSearch],
        queryFn: () => chargeService.getCharges({ limit: 10, search: debouncedChargeSearch || undefined }),
    })

    const contentsQuery = useQuery({
        queryKey: ['shipment-content-options', debouncedContentSearch],
        queryFn: () => contentService.getContents({
            limit: 10,
            search: debouncedContentSearch || undefined,
            sortBy: 'contentName',
            sortOrder: 'asc',
        }),
    })

    const { data: serviceCentersData } = useQuery({
        queryKey: ['shipment-service-centers', debouncedServiceCenterSearch],
        queryFn: () => serviceCenterService.getServiceCenters({
            page: 1,
            limit: 10,
            search: debouncedServiceCenterSearch || undefined,
            sortBy: 'code',
            sortOrder: 'asc',
        }),
    })

    const { data: shipperPincodeOptionsData } = useQuery({
        queryKey: ['shipment-shipper-pincode-options', debouncedShipperPincodeSearch],
        queryFn: () => serviceablePincodeService.getServiceablePincodes({ limit: 10, page: 1, search: debouncedShipperPincodeSearch || undefined, sortBy: 'pinCode', sortOrder: 'asc' }),
        staleTime: 5 * 60 * 1000,
    })

    const { data: consigneePincodeOptionsData } = useQuery({
        queryKey: ['shipment-consignee-pincode-options', debouncedConsigneePincodeSearch],
        queryFn: () => serviceablePincodeService.getServiceablePincodes({ limit: 10, page: 1, search: debouncedConsigneePincodeSearch || undefined, sortBy: 'pinCode', sortOrder: 'asc' }),
        staleTime: 5 * 60 * 1000,
    })

    const shipperPincodeOptions = shipperPincodeOptionsData?.data ?? []
    const consigneePincodeOptions = consigneePincodeOptionsData?.data ?? []
    const contentOptions = contentsQuery.data?.data ?? []
    const serviceCenterOptions = serviceCentersData?.data ?? []
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
            ewaybillNumber: initialData?.ewaybillNumber || '',
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
            shipmentTotalValue: initialData?.shipmentTotalValue || 0,
            fromZoneId: initialData?.fromZoneId || 0,
            toZoneId: initialData?.toZoneId || 0,
            reversePickup: initialData?.reversePickup || false,
            appointmentDelivery: initialData?.appointmentDelivery || false,
            floorDelivery: initialData?.floorDelivery || false,
            floorCount: initialData?.floorCount || 0,
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
            serviceCenterId: initialData?.serviceCenterId || 0,
            isCod: initialData?.isCod || false,
            codAmount: initialData?.codAmount || 0,
            piecesRows: normalizePieceRows(initialData?.piecesRows),
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

    const addPieceItem = (pieceIndex: number) => {
        const currentItems = form.getValues(`piecesRows.${pieceIndex}.items`) || []
        form.setValue(`piecesRows.${pieceIndex}.items`, [...currentItems, createEmptyPieceItem()], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }

    const removePieceItem = (pieceIndex: number, itemIndex: number) => {
        const currentItems = form.getValues(`piecesRows.${pieceIndex}.items`) || []
        if (currentItems.length <= 1) return
        form.setValue(
            `piecesRows.${pieceIndex}.items`,
            currentItems.filter((_, index) => index !== itemIndex),
            { shouldDirty: true, shouldValidate: true }
        )
    }

    const updatePieceItem = (pieceIndex: number, itemIndex: number, patch: Partial<PieceItemForm>) => {
        const currentItems = form.getValues(`piecesRows.${pieceIndex}.items`) || []
        form.setValue(
            `piecesRows.${pieceIndex}.items`,
            currentItems.map((item, index) => (index === itemIndex ? { ...item, ...patch } : item)),
            { shouldDirty: true, shouldValidate: true }
        )
    }

    const calculateMutation = useMutation({
        mutationFn: () => shipmentService.calculateCharges(normalizeShipmentPayload(form.getValues())),
        onSuccess: (response) => {
            setChargePreview(response.data)
            toast.success("Charges calculated")
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to calculate charges"))
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                bookDate: initialData.bookDate.split('T')[0],
                clientId: initialData.customerId,
                version: initialData.version,
                piecesRows: normalizePieceRows(initialData.piecesRows),
                charges: initialData.charges || [],
            })
        }
    }, [initialData, form])

    const watchedShipperId = form.watch('shipperId')
    const watchedConsigneeId = form.watch('consigneeId')
    const watchedFromZoneId = form.watch('fromZoneId')
    const watchedToZoneId = form.watch('toZoneId')
    const watchedFloorDelivery = form.watch('floorDelivery')
    const watchedIsCod = form.watch('isCod')
    const watchedShipperPinCode = form.watch('shipper.pinCode')
    const watchedConsigneePinCode = form.watch('consignee.pinCode')
    const debouncedShipperPinCode = useDebounce((watchedShipperPinCode || '').trim(), 400)
    const debouncedConsigneePinCode = useDebounce((watchedConsigneePinCode || '').trim(), 400)

    const prevShipperIdRef = useRef<number>(0)
    const prevConsigneeIdRef = useRef<number>(0)
    const isShipperLocked = normalizeMasterSelectId(watchedShipperId) > 0
    const isConsigneeLocked = normalizeMasterSelectId(watchedConsigneeId) > 0

    const clearShipperBlock = () => {
        form.setValue('shipperId', 0, { shouldDirty: true, shouldValidate: false })
        form.setValue('fromZoneId', 0, { shouldDirty: true, shouldValidate: false })
        ;([
            'shipper.shipperName',
            'shipper.shipperOrigin',
            'shipper.contactPerson',
            'shipper.address1',
            'shipper.address2',
            'shipper.pinCode',
            'shipper.city',
            'shipper.state',
            'shipper.country',
            'shipper.telephone',
            'shipper.mobile',
            'shipper.email',
        ] as const).forEach((name) => {
            form.resetField(name, { defaultValue: '' })
        })
        setSelectedShipperPincode(null)
        setShipperPincodeSearch('')
        setSuppressShipperErrors(true)
        form.clearErrors()
    }

    const clearConsigneeBlock = () => {
        form.setValue('consigneeId', 0, { shouldDirty: true, shouldValidate: false })
        form.setValue('toZoneId', 0, { shouldDirty: true, shouldValidate: false })
        ;([
            'consignee.name',
            'consignee.destination',
            'consignee.contactPerson',
            'consignee.address1',
            'consignee.address2',
            'consignee.pinCode',
            'consignee.city',
            'consignee.state',
            'consignee.country',
            'consignee.telephone',
            'consignee.mobile',
            'consignee.email',
        ] as const).forEach((name) => {
            form.resetField(name, { defaultValue: '' })
        })
        setSelectedConsigneePincode(null)
        setConsigneePincodeSearch('')
        setSuppressConsigneeErrors(true)
        form.clearErrors()
    }

    const applySelectedPincode = (scope: 'shipper' | 'consignee', pinCode: string) => {
        const selected = (scope === 'shipper' ? shipperPincodeOptions : consigneePincodeOptions).find((item) => item.pinCode === pinCode)
        if (scope === 'shipper') {
            form.setValue('shipper.pinCode', pinCode, { shouldDirty: true, shouldValidate: true })
            form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.city', selected?.areaName || selected?.cityName || '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.state', selected?.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.country', selected?.country?.name || '', { shouldDirty: false, shouldValidate: false })
            setSelectedShipperPincode(selected ?? null)
            setShipperPincodeSearch('')
            return
        }

        form.setValue('consignee.pinCode', pinCode, { shouldDirty: true, shouldValidate: true })
        form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.city', selected?.areaName || selected?.cityName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.state', selected?.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.country', selected?.country?.name || '', { shouldDirty: false, shouldValidate: false })
        setSelectedConsigneePincode(selected ?? null)
        setConsigneePincodeSearch('')
    }

    const { data: shipperPincodeData } = useQuery({
        queryKey: ['shipment-shipper-pincode', debouncedShipperPinCode],
        queryFn: () => serviceablePincodeService.getServiceablePincodes({ pinCode: debouncedShipperPinCode, limit: 1, page: 1 }),
        enabled: debouncedShipperPinCode.length >= 6,
        staleTime: 5 * 60 * 1000,
    })

    const { data: consigneePincodeData } = useQuery({
        queryKey: ['shipment-consignee-pincode', debouncedConsigneePinCode],
        queryFn: () => serviceablePincodeService.getServiceablePincodes({ pinCode: debouncedConsigneePinCode, limit: 1, page: 1 }),
        enabled: debouncedConsigneePinCode.length >= 6,
        staleTime: 5 * 60 * 1000,
    })

    const { data: pincodeDistanceData } = useQuery({
        queryKey: ['shipment-pincode-distance', watchedShipperPinCode, watchedConsigneePinCode],
        queryFn: () => pincodeDistanceService.getPincodeDistance((watchedShipperPinCode || '').trim(), (watchedConsigneePinCode || '').trim()),
        enabled: (watchedShipperPinCode || '').trim().length >= 6 && (watchedConsigneePinCode || '').trim().length >= 6,
        staleTime: 60 * 60 * 1000,
    })

    const shipperPincodeSource = normalizeMasterSelectId(watchedShipperId) > 0
        ? shipperPincodeData?.data?.[0] ?? null
        : selectedShipperPincode ?? shipperPincodeData?.data?.[0] ?? null
    const consigneePincodeSource = normalizeMasterSelectId(watchedConsigneeId) > 0
        ? consigneePincodeData?.data?.[0] ?? null
        : selectedConsigneePincode ?? consigneePincodeData?.data?.[0] ?? null
    const shipperZoneOptions = useMemo(() => shipperPincodeSource?.zones ?? [], [shipperPincodeSource])
    const consigneeZoneOptions = useMemo(() => consigneePincodeSource?.zones ?? [], [consigneePincodeSource])

    useEffect(() => {
        const shipperPin = (watchedShipperPinCode || '').trim()
        const consigneePin = (watchedConsigneePinCode || '').trim()

        if (shipperPin.length < 6 || consigneePin.length < 6) {
            if ((form.getValues('km') || 0) !== 0) {
                form.setValue('km', 0, { shouldDirty: false, shouldValidate: false })
            }
            return
        }

        if (shipperPin === consigneePin) {
            if ((form.getValues('km') || 0) !== 0) {
                form.setValue('km', 0, { shouldDirty: false, shouldValidate: false })
            }
            return
        }

        const distanceKm = pincodeDistanceData?.data?.distanceKm
        if (typeof distanceKm === 'number' && Number.isFinite(distanceKm)) {
            if (Math.abs((form.getValues('km') || 0) - distanceKm) > 0.01) {
                form.setValue('km', distanceKm, { shouldDirty: false, shouldValidate: false })
            }
        }
    }, [form, pincodeDistanceData?.data?.distanceKm, watchedConsigneePinCode, watchedShipperPinCode])

    useEffect(() => {
        if (!watchedFromZoneId) return
        if (shipperZoneOptions.some((zone) => zone.id === watchedFromZoneId)) return
        form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
    }, [form, shipperZoneOptions, watchedFromZoneId])

    useEffect(() => {
        if (!watchedToZoneId) return
        if (consigneeZoneOptions.some((zone) => zone.id === watchedToZoneId)) return
        form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
    }, [consigneeZoneOptions, form, watchedToZoneId])

    useEffect(() => {
        if (!watchedFloorDelivery && (form.getValues('floorCount') || 0) !== 0) {
            form.setValue('floorCount', 0, { shouldDirty: false, shouldValidate: false })
        }
    }, [form, watchedFloorDelivery])

    useEffect(() => {
        if (!watchedIsCod && (form.getValues('codAmount') || 0) !== 0) {
            form.setValue('codAmount', 0, { shouldDirty: false, shouldValidate: false })
        }
    }, [form, watchedIsCod])

    useEffect(() => {
        const lookup = shipperPincodeData?.data?.[0]
        if (normalizeMasterSelectId(watchedShipperId) > 0) return
        if (debouncedShipperPinCode.length < 6) {
            setSelectedShipperPincode(null)
            form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (!lookup) {
            setSelectedShipperPincode(null)
            form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (normalizeMasterSelectId(watchedShipperId) <= 0) {
            setSelectedShipperPincode(lookup)
        }
        form.setValue('shipper.city', lookup.areaName || lookup.cityName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('shipper.state', lookup.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('shipper.country', lookup.country?.name || '', { shouldDirty: false, shouldValidate: false })
    }, [debouncedShipperPinCode, form, shipperPincodeData?.data, watchedShipperId])

    useEffect(() => {
        const lookup = consigneePincodeData?.data?.[0]
        if (normalizeMasterSelectId(watchedConsigneeId) > 0) return
        if (debouncedConsigneePinCode.length < 6) {
            setSelectedConsigneePincode(null)
            form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (!lookup) {
            setSelectedConsigneePincode(null)
            form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (normalizeMasterSelectId(watchedConsigneeId) <= 0) {
            setSelectedConsigneePincode(lookup)
        }
        form.setValue('consignee.city', lookup.areaName || lookup.cityName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.state', lookup.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.country', lookup.country?.name || '', { shouldDirty: false, shouldValidate: false })
    }, [consigneePincodeData?.data, debouncedConsigneePinCode, form, watchedConsigneeId])

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
                setSelectedShipperPincode(null)
                form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
            return
        }

        if (prev > 0) {
            form.setValue('shipper', EMPTY_SHIPPER_BLOCK, { shouldDirty: false, shouldValidate: false })
            setSelectedShipperPincode(null)
            form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
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
                setSelectedConsigneePincode(null)
                form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
            return
        }

        if (prev > 0) {
            form.setValue('consignee', EMPTY_CONSIGNEE_BLOCK, { shouldDirty: false, shouldValidate: false })
            setSelectedConsigneePincode(null)
            form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
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
            const weightPerPc = Number(row.actualWeight) || 0;
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
        if (Math.abs((form.getValues('chargeWeight') || 0) - chargeWeight) > 0.001) {
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
        onSuccess: ({ blob, filename }) => {
            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = filename
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
            setPiecesCsvName(file.name)
            const raw = await file.text()
            const parsed = parsePiecesCsv(raw)
            form.setValue('piecesRows', parsed, { shouldValidate: true })
            toast.success(`${parsed.length} piece row(s) imported`)
        } catch {
            setPiecesCsvName('No file chosen')
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
        setSuppressShipperErrors(false)
        setSuppressConsigneeErrors(false)
        const valid = await form.trigger([
            'bookDate',
            'customerId',
            'productId',
            'fromZoneId',
            'toZoneId',
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
                                            <FloatingFormItem label="AWB No (optional)" itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Input {...field} value={field.value || ""} placeholder="Leave blank for auto-generate" className={FLOATING_INNER_CONTROL} />
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
                                            <FloatingFormItem label={<>Client Name <span className="text-red-500">*</span></>} itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Combobox
                                                        options={customersData?.data?.map((c) => ({ label: c.name, value: c.id })) || []}
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="Select customer"
                                                        searchPlaceholder="Search customer..."
                                                        searchValue={customerSearch}
                                                        onSearchValueChange={setCustomerSearch}
                                                        className={FLOATING_INNER_COMBO}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ewaybillNumber"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Ewaybill No (optional)" itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Input {...field} value={field.value || ""} placeholder="Enter ewaybill number" className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                        </FormSection>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                            <FormSection title="Shipper Details" contentClassName="space-y-3 p-3 pt-6">
                                    <div className="flex items-stretch gap-2">
                                        <FormField
                                            control={form.control}
                                            name="shipperId"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Shipper Master" itemClassName="flex-1">
                                                    <FormControl>
                                                        <Combobox
                                                            options={shippersData?.data?.map((s) => ({ label: s.shipperName, value: s.id })) || []}
                                                            value={field.value}
                                                            onChange={(v) => field.onChange(normalizeMasterSelectId(v))}
                                                            placeholder="Select shipper"
                                                            searchPlaceholder="Search shipper..."
                                                            searchValue={shipperSearch}
                                                            onSearchValueChange={setShipperSearch}
                                                            className={FLOATING_INNER_COMBO}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={clearShipperBlock}
                                            className="h-[46px] w-[46px] self-end rounded-full bg-[#1c2a48] text-white hover:bg-[#16233e] hover:text-white"
                                            aria-label="Reset shipper block"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="shipper.shipperName"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("Company Name", !isShipperLocked)} itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isShipperLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.contactPerson"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("Contact Person Name", !isShipperLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isShipperLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.mobile"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("Mobile No.", !isShipperLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isShipperLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.telephone"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("Telephone", !isShipperLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isShipperLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.email"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("E-Mail", !isShipperLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isShipperLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.address1"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("Address", !isShipperLocked)} itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isShipperLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.pinCode"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("Pincode", !isShipperLocked)}>
                                                    <FormControl>
                                                        {isShipperLocked ? (
                                                            <Input {...field} value={field.value || ""} disabled className={FLOATING_INNER_CONTROL} />
                                                        ) : (
                                                            <Combobox
                                                                options={shipperPincodeOptions.map((pincode) => ({ label: formatServiceablePincodeLabel(pincode), value: pincode.pinCode }))}
                                                                value={field.value || ""}
                                                                onChange={(value) => applySelectedPincode('shipper', value ? String(value) : '')}
                                                                placeholder="Select pincode"
                                                                searchPlaceholder="Search pincode..."
                                                                emptyMessage="No serviceable pincode found"
                                                                searchValue={shipperPincodeSearch}
                                                                onSearchValueChange={setShipperPincodeSearch}
                                                                className={FLOATING_INNER_COMBO}
                                                            />
                                                        )}
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="fromZoneId"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label={requiredFieldLabel("From Zone", true)}>
                                                    <FormControl>
                                                        <Combobox
                                                            options={shipperZoneOptions.map((zone) => ({ label: zone.name || zone.code, value: zone.id }))}
                                                            value={field.value}
                                                            onChange={(value) => field.onChange(normalizeMasterSelectId(value))}
                                                            placeholder={shipperZoneOptions.length > 0 ? "Select zone" : "Select pincode first"}
                                                            searchPlaceholder="Search zone..."
                                                            disabled={!shipperPincodeSource}
                                                            className={FLOATING_INNER_COMBO}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.city"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label="City">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} readOnly disabled placeholder="Auto-filled from pincode" className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.state"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label="State">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} readOnly disabled placeholder="Auto-filled from pincode" className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="shipper.country"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressShipperErrors} label="Country">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} readOnly disabled placeholder="Auto-filled from pincode" className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                    </div>
                            </FormSection>

                            <FormSection title="Consignee Details" contentClassName="space-y-3 p-3 pt-6">
                                    <div className="flex items-stretch gap-2">
                                        <FormField
                                            control={form.control}
                                            name="consigneeId"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Consignee Master" itemClassName="flex-1">
                                                    <FormControl>
                                                        <Combobox
                                                            options={consigneesData?.data?.map((c) => ({ label: c.name, value: c.id })) || []}
                                                            value={field.value}
                                                            onChange={(v) => field.onChange(normalizeMasterSelectId(v))}
                                                            placeholder="Select consignee"
                                                            searchPlaceholder="Search consignee..."
                                                            searchValue={consigneeSearch}
                                                            onSearchValueChange={setConsigneeSearch}
                                                            className={FLOATING_INNER_COMBO}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={clearConsigneeBlock}
                                            className="h-[46px] w-[46px] self-end rounded-full bg-[#1c2a48] text-white hover:bg-[#16233e] hover:text-white"
                                            aria-label="Reset consignee block"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="consignee.name"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("Company Name", !isConsigneeLocked)} itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isConsigneeLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.contactPerson"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("Contact Person Name", !isConsigneeLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isConsigneeLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.mobile"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("Mobile No.", !isConsigneeLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isConsigneeLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.telephone"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("Telephone", !isConsigneeLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isConsigneeLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.email"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("E-Mail", !isConsigneeLocked)}>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isConsigneeLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.address1"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("Address", !isConsigneeLocked)} itemClassName="col-span-2">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} disabled={isConsigneeLocked} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.pinCode"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("Pincode", !isConsigneeLocked)}>
                                                    <FormControl>
                                                        {isConsigneeLocked ? (
                                                            <Input {...field} value={field.value || ""} disabled className={FLOATING_INNER_CONTROL} />
                                                        ) : (
                                                            <Combobox
                                                                options={consigneePincodeOptions.map((pincode) => ({ label: formatServiceablePincodeLabel(pincode), value: pincode.pinCode }))}
                                                                value={field.value || ""}
                                                                onChange={(value) => applySelectedPincode('consignee', value ? String(value) : '')}
                                                                placeholder="Select pincode"
                                                                searchPlaceholder="Search pincode..."
                                                                emptyMessage="No serviceable pincode found"
                                                                searchValue={consigneePincodeSearch}
                                                                onSearchValueChange={setConsigneePincodeSearch}
                                                                className={FLOATING_INNER_COMBO}
                                                            />
                                                        )}
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="toZoneId"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label={requiredFieldLabel("To Zone", true)}>
                                                    <FormControl>
                                                        <Combobox
                                                            options={consigneeZoneOptions.map((zone) => ({ label: zone.name || zone.code, value: zone.id }))}
                                                            value={field.value}
                                                            onChange={(value) => field.onChange(normalizeMasterSelectId(value))}
                                                            placeholder={consigneeZoneOptions.length > 0 ? "Select zone" : "Select pincode first"}
                                                            searchPlaceholder="Search zone..."
                                                            disabled={!consigneePincodeSource}
                                                            className={FLOATING_INNER_COMBO}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.city"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label="City">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} readOnly disabled placeholder="Auto-filled from pincode" className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.state"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label="State">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} readOnly disabled placeholder="Auto-filled from pincode" className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="consignee.country"
                                            render={({ field }) => (
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label="Country">
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ""} readOnly disabled placeholder="Auto-filled from pincode" className={FLOATING_INNER_CONTROL} />
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
                                                    searchPlaceholder="Search product..."
                                                    searchValue={productSearch}
                                                    onSearchValueChange={setProductSearch}
                                                    className={FLOATING_INNER_COMBO}
                                                />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <FormField
                                        control={form.control}
                                        name="shipmentTotalValue"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Shipment Total Value">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        className={FLOATING_INNER_CONTROL}
                                                        {...field}
                                                        value={numberInputValue(field.value)}
                                                        onChange={(e) => field.onChange(parseOptionalNumberInput(e.target.value))}
                                                        disabled={!watchedFloorDelivery}
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
                                                        value={numberInputValue(field.value)}
                                                        onChange={(e) => field.onChange(parseOptionalNumberInput(e.target.value))}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="chargeWeight"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Charge Weight">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        className={FLOATING_INNER_CONTROL}
                                                        {...field}
                                                        value={numberInputValue(field.value)}
                                                        onChange={(e) => field.onChange(parseOptionalNumberInput(e.target.value))}
                                                        disabled
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                    <FormField
                                        control={form.control}
                                        name="reversePickup"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Reverse Pickup">
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
                                        name="appointmentDelivery"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Appointment Delivery">
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
                                        name="floorDelivery"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Floor Delivery">
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
                                        name="floorCount"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Floor Count">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        className={FLOATING_INNER_CONTROL}
                                                        {...field}
                                                        value={numberInputValue(field.value)}
                                                        onChange={(e) => field.onChange(parseOptionalNumberInput(e.target.value))}
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                                        name="paymentType"
                                        render={({ field }) => (
                                            <FloatingFormItem label={<>Payment Type <span className="text-red-500">*</span></>}>
                                                <FormControl>
                                                        <Combobox
                                                            options={[
                                                                { label: "Prepaid", value: "PREPAID" },
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
                                <FormField
                                    control={form.control}
                                    name="instruction"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Instruction">
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    value={field.value || ""}
                                                    placeholder="Handle with care..."
                                                    className={FLOATING_INNER_TEXTAREA}
                                                />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceCenterId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Service Center">
                                            <FormControl>
                                                <Combobox
                                                    options={serviceCenterOptions.map((sc) => ({
                                                        label: `${sc.code} - ${sc.name}`,
                                                        value: sc.id,
                                                    }))}
                                                    value={field.value || 0}
                                                    onChange={(val) => field.onChange(normalizeMasterSelectId(val))}
                                                    placeholder="Select service center"
                                                    searchPlaceholder="Search service center..."
                                                    searchValue={serviceCenterSearch}
                                                    onSearchValueChange={setServiceCenterSearch}
                                                    className={FLOATING_INNER_COMBO}
                                                />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="isCod"
                                        render={({ field }) => (
                                            <FloatingFormItem label="COD">
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
                                        name="codAmount"
                                        render={({ field }) => (
                                            <FloatingFormItem label="COD Amount">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        className={FLOATING_INNER_CONTROL}
                                                        {...field}
                                                        value={numberInputValue(field.value)}
                                                        onChange={(e) => field.onChange(parseOptionalNumberInput(e.target.value))}
                                                        disabled={!watchedIsCod}
                                                    />
                                                </FormControl>
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
                        <OutlinedFieldShell label="Import CSV" className="w-full min-w-[200px] sm:w-[230px] !pt-1.5 !pb-0.5">
                            <div className="flex h-8 items-center gap-2">
                                <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => document.getElementById('shipment-pieces-csv-input')?.click()}>
                                    Choose file
                                </Button>
                                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                                    {piecesCsvName}
                                </span>
                            </div>
                            <input
                                id="shipment-pieces-csv-input"
                                type="file"
                                accept=".csv"
                                onChange={handlePiecesCsvUpload}
                                className="hidden"
                            />
                        </OutlinedFieldShell>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPiece(createEmptyPieceRow())}>
                            <Plus className="mr-2 h-4 w-4" /> Add Piece
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-0 bg-primary hover:bg-primary">
                                    <TableHead className="whitespace-nowrap text-primary-foreground first:rounded-tl-md">
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
                                    <Fragment key={field.id}>
                                        <TableRow>
                                            <TableCell>
                                                <Input type="number" {...form.register(`piecesRows.${index}.pieces` as const, { valueAsNumber: true })} className="h-8 w-16" />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" step="0.01" {...form.register(`piecesRows.${index}.actualWeight` as const, { valueAsNumber: true })} className="h-8 w-20" />
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
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removePiece(index)} disabled={pieceFields.length <= 1}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={7} className="border-t-0 pb-4 pt-0">
                                                <div className="space-y-3 rounded-md border border-dashed border-border/70 bg-background/80 p-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-medium">Items</p>
                                                            <p className="text-xs text-muted-foreground">At least one item is required for every piece.</p>
                                                        </div>
                                                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => addPieceItem(index)}>
                                                            <Plus className="mr-2 h-4 w-4" /> Add Item
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {(watchedPiecesRows?.[index]?.items || []).map((item, itemIndex) => (
                                                            <div key={`${field.id}-item-${itemIndex}`} className="rounded-md border border-border/60 bg-card p-3">
                                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-medium text-muted-foreground">Item {itemIndex + 1}</span>
                                                                    <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => removePieceItem(index, itemIndex)} disabled={(watchedPiecesRows?.[index]?.items || []).length <= 1}>
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.contentId` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label={requiredFieldLabel("Content", true)} itemClassName="min-w-0">
                                                                                <FormControl>
                                                                                    <Combobox
                                                                                        options={contentOptions.map((content) => ({
                                                                                            label: `${content.contentCode} - ${content.contentName}`,
                                                                                            value: content.id,
                                                                                        }))}
                                                                                        value={itemField.value || ""}
                                                                                        onChange={(val) => {
                                                                                            const nextValue = typeof val === "number" ? val : Number(val)
                                                                                            itemField.onChange(Number.isFinite(nextValue) ? nextValue : 0)
                                                                                        }}
                                                                                        placeholder="Select content"
                                                                                        searchPlaceholder="Search content..."
                                                                                        emptyMessage="No content found."
                                                                                        searchValue={contentSearch}
                                                                                        onSearchValueChange={setContentSearch}
                                                                                        isSearching={contentsQuery.isLoading}
                                                                                        className="h-8"
                                                                                    />
                                                                                </FormControl>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.quantity` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label="Quantity">
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={numberInputValue(itemField.value)}
                                                                                        onChange={(event) => itemField.onChange(parseOptionalNumberInput(event.target.value))}
                                                                                        className={FLOATING_INNER_CONTROL}
                                                                                    />
                                                                                </FormControl>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.measureValue` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label="Measure Value">
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={numberInputValue(itemField.value)}
                                                                                        onChange={(event) => itemField.onChange(parseOptionalNumberInput(event.target.value))}
                                                                                        className={FLOATING_INNER_CONTROL}
                                                                                    />
                                                                                </FormControl>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.measureUnit` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label="Measure Unit">
                                                                                <Select value={itemField.value || ""} onValueChange={itemField.onChange}>
                                                                                    <FormControl>
                                                                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                                                            <SelectValue placeholder="Select unit" />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        {["PCS", "KG", "METER", "LITER"].map((unit) => (
                                                                                            <SelectItem key={unit} value={unit}>
                                                                                                {unit}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.totalValue` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label="Total Value">
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={numberInputValue(itemField.value)}
                                                                                        onChange={(event) => itemField.onChange(parseOptionalNumberInput(event.target.value))}
                                                                                        className={FLOATING_INNER_CONTROL}
                                                                                    />
                                                                                </FormControl>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.invoiceDate` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label="Invoice Date">
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="date"
                                                                                        value={itemField.value || ""}
                                                                                        onChange={itemField.onChange}
                                                                                        className={FLOATING_INNER_CONTROL}
                                                                                    />
                                                                                </FormControl>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`piecesRows.${index}.items.${itemIndex}.invoiceNumber` as const}
                                                                        render={({ field: itemField }) => (
                                                                            <FloatingFormItem label="Invoice No.">
                                                                                <FormControl>
                                                                                    <Input
                                                                                        value={itemField.value || ""}
                                                                                        onChange={itemField.onChange}
                                                                                        placeholder="INV/001"
                                                                                        className={FLOATING_INNER_CONTROL}
                                                                                    />
                                                                                </FormControl>
                                                                            </FloatingFormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </Fragment>
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
                    <div className="flex flex-wrap justify-end gap-2 border-b border-border/70 pb-3">
                        <Button type="button" variant="outline" size="sm" onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending}>
                            <Calculator className="mr-2 h-4 w-4" /> Calculate Charges
                        </Button>
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
                                                searchPlaceholder="Search charge..."
                                                searchValue={chargeSearch}
                                                onSearchValueChange={setChargeSearch}
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
                    {chargePreview && (
                        <div className="mt-3 rounded-md border border-border/70 bg-muted/20 p-3 text-sm">
                            <div className="flex flex-wrap gap-4">
                                <p><span className="text-muted-foreground">Base Freight:</span> {chargePreview.baseFreight ?? "—"}</p>
                                <p><span className="text-muted-foreground">Total Charges:</span> {chargePreview.totalCharges ?? "—"}</p>
                                <p><span className="text-muted-foreground">Total Amount:</span> {chargePreview.totalAmount ?? "—"}</p>
                            </div>
                            {chargePreview.rows?.length > 0 && (
                                <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {chargePreview.rows.map((row, index) => (
                                        <div key={`${row.type}-${index}`} className="rounded border border-border bg-card p-2 text-xs">
                                            <div className="font-medium">{row.name}</div>
                                            <div className="text-muted-foreground">{row.type} | {row.amount}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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
                                        searchPlaceholder="Search vendor..."
                                        searchValue={vendorSearch}
                                        onSearchValueChange={setVendorSearch}
                                        className={FLOATING_INNER_COMBO}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label={<>Service <span className="text-red-500">*</span></>}>
                                    <Combobox
                                        options={forwardingServiceOptions}
                                        value={forwardingForm.deliveryServiceMapId}
                                        onChange={(val) => updateForwardingForm({ deliveryServiceMapId: Number(val) || 0 })}
                                        placeholder={forwardingForm.deliveryVendorId > 0 ? "Select service" : "Select vendor first"}
                                        searchPlaceholder="Search service..."
                                        searchValue={serviceMapSearch}
                                        onSearchValueChange={setServiceMapSearch}
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
