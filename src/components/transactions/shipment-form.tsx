"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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
    RotateCcw,
    FileUp,
    Download
} from "lucide-react"
import * as XLSX from "xlsx"

import { cn } from "@/lib/utils"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { pincodeDistanceService } from '@/services/utilities/pincode-distance-service'
import { shipmentSchema, ShipmentFormValues, Shipment, ShipmentCalculateResponse, ShipmentKycDocument } from '@/types/transactions/shipment'
import type { Shipper } from '@/types/masters/shipper'
import type { Consignee } from '@/types/masters/consignee'
import type { ServiceablePincode } from '@/types/utilities/serviceable-pincode'
import { useDebounce } from '@/hooks/use-debounce'

interface ShipmentFormProps {
    initialData?: Shipment | null
}

type ForwardingRow = {
    forwardingAwb: string
    deliveryVendorId: number
    deliveryServiceMapId: number
    vendorWeight: number
    vendorAmount: number
    vendorInvoice: string
    contractCharges: number
    otherCharges: number
    subTotal: number
    totalFuel: number
    igst: number
    cgst: number
    sgst: number
    totalAmount: number
}

type KycRow = {
    id: string
    type: string
    entryType: string
    entryDate: string
}

const generateKycRowId = () => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID()
    }
    return `kyc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Same pickup and delivery pincode would otherwise be 0 km; pricing uses a floor (see backend PincodeRouteDistanceService). */
const MIN_SAME_PINCODE_DISTANCE_KM = 10
const roundWeightKg = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return 0
    const baseKg = Math.floor(value)
    const gramsFraction = value - baseKg
    return gramsFraction > 0.1 ? baseKg + 1 : baseKg
}

const normalizeNumberValue = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
        const next = Number(value)
        return Number.isFinite(next) ? next : undefined
    }
    return undefined
}

const normalizePositiveNumberValue = (value: unknown): number | undefined => {
    const next = normalizeNumberValue(value)
    return typeof next === "number" && next > 0 ? next : undefined
}

const normalizePieceItem = (item: Partial<PieceItemForm> & Record<string, unknown>): PieceItemForm => ({
    contentId: normalizeNumberValue(item.contentId) || 0,
    quantity: normalizeNumberValue(item.quantity),
    measureValue: normalizeNumberValue(item.measureValue),
    measureUnit: strOrEmpty(item.measureUnit),
    totalValue: normalizeNumberValue(item.totalValue),
    invoiceDate: strOrEmpty(item.invoiceDate) || format(new Date(), 'yyyy-MM-dd'),
    invoiceNumber: strOrEmpty(item.invoiceNumber),
})

const normalizePieceRows = (rows?: ShipmentFormValues['piecesRows']): NonNullable<ShipmentFormValues['piecesRows']> => {
    if (!rows || rows.length === 0) {
        return [createEmptyPieceRow()]
    }

    return rows.map((row) => ({
        actualWeight: normalizeNumberValue(row.actualWeight) ?? normalizeNumberValue((row as Record<string, unknown>).actualWeightPerPc) ?? 0,
        pieces: normalizeNumberValue(row.pieces) || 0,
        length: normalizeNumberValue(row.length),
        breadth:
            normalizeNumberValue(row.breadth) ??
            normalizeNumberValue((row as Record<string, unknown>).width),
        height: normalizeNumberValue(row.height),
        division: normalizeNumberValue(row.division),
        volumetricWeight: normalizeNumberValue(row.volumetricWeight),
        chargeWeight: normalizeNumberValue(row.chargeWeight),
        items: (row.items && row.items.length > 0 ? row.items : [createEmptyPieceItem()]).map((item) => normalizePieceItem(item as Partial<PieceItemForm> & Record<string, unknown>)),
    }))
}

const buildShipmentFormValues = (shipment?: Shipment | null): ShipmentFormValues => {
    const shipmentRef = shipment as ShipmentFormSource | null
    const shipperRef = shipmentRef?.shipper ?? undefined
    const consigneeRef = shipmentRef?.consignee ?? undefined

    return {
        version: shipment?.version,
        awbNo: shipment?.awbNo || '',
        bookDate: toDateInputValue(shipment?.bookDate),
        bookTime: shipment?.bookTime || format(new Date(), "HH:mm"),
        referenceNo: shipment?.referenceNo || '',
        customerId: shipmentRef?.customerId || 0,
        clientId: shipmentRef?.customerId || 0,
        shipperId: shipmentRef?.shipperId || 0,
        consigneeId: shipmentRef?.consigneeId || 0,
        ewaybillNumber: shipmentRef?.ewaybillNumber || '',
        shipper: shipperRef ? {
            shipperName: shipperRef.shipperName || shipperRef.name || '',
            pinCodeId: shipperRef.pinCodeId ?? shipperRef.serviceablePincode?.id ?? undefined,
            shipperOrigin: '',
            contactPerson: shipperRef.contactPerson || '',
            address1: shipperRef.address1 || '',
            address2: shipperRef.address2 || '',
            pinCode: shipperRef.serviceablePincode?.pinCode || '',
            city: shipperRef.serviceablePincode?.cityName || '',
            state: shipperRef.state?.stateName || shipperRef.serviceablePincode?.state?.stateName || '',
            country: shipperRef.country?.name || shipperRef.serviceablePincode?.country?.name || '',
            telephone: shipperRef.telephone || '',
            mobile: shipperRef.mobile || '',
            email: shipperRef.email || '',
        } : undefined,
        consignee: consigneeRef ? {
            name: consigneeRef.consigneeName || consigneeRef.name || '',
            pinCodeId: consigneeRef.pinCodeId ?? consigneeRef.serviceablePincode?.id ?? undefined,
            destination: '',
            contactPerson: consigneeRef.contactPerson || '',
            address1: consigneeRef.address1 || '',
            address2: consigneeRef.address2 || '',
            pinCode: consigneeRef.serviceablePincode?.pinCode || '',
            city: consigneeRef.serviceablePincode?.cityName || '',
            state: consigneeRef.state?.stateName || consigneeRef.stateMaster?.stateName || consigneeRef.serviceablePincode?.state?.stateName || '',
            country: consigneeRef.country?.name || consigneeRef.serviceablePincode?.country?.name || '',
            telephone: consigneeRef.telephone || '',
            mobile: consigneeRef.mobile || '',
            email: consigneeRef.email || '',
        } : undefined,
        origin: shipmentRef?.origin || '',
        originCode: shipmentRef?.originCode || '',
        destination: shipmentRef?.destination || '',
        destinationCode: shipmentRef?.destinationCode || '',
        productId: shipmentRef?.productId || 0,
        vendorId: shipmentRef?.vendorId || 0,
        serviceMapId: shipmentRef?.serviceMapId || 0,
        shipmentValue: shipmentRef?.shipmentValue ?? 0,
        shipmentTotalValue: shipmentRef?.shipmentTotalValue ?? 0,
        fromZoneId: shipmentRef?.fromZoneId || 0,
        toZoneId: shipmentRef?.toZoneId || 0,
        reversePickup: shipmentRef?.reversePickup || false,
        appointmentDelivery: shipmentRef?.appointmentDelivery || false,
        floorDelivery: shipmentRef?.floorDelivery || false,
        floorCount: shipmentRef?.floorCount || 0,
        currency: shipmentRef?.currency || 'INR',
        pieces: shipmentRef?.pieces || 1,
        actualWeight: normalizeNumberValue(shipmentRef?.actualWeight) ?? normalizeNumberValue(shipmentRef?.declaredWeight) ?? 0,
        volumetricWeight: shipmentRef?.volumetricWeight || 0,
        chargeWeight: shipmentRef?.chargeWeight || 0,
        km: shipmentRef?.km || 0,
        isEdl: Boolean(shipmentRef?.isEdl) || Boolean(shipmentRef?.oda),
        odaEdlDistanceKm: shipmentRef?.odaEdlDistanceKm != null
            ? Number(shipmentRef.odaEdlDistanceKm)
            : 0,
        commercial: shipmentRef?.commercial || false,
        medicalCharges: shipmentRef?.medicalCharges ?? 0,
        paymentType: shipmentRef?.paymentType || 'CREDIT',
        instruction: shipmentRef?.instruction || '',
        serviceCenterId: shipmentRef?.serviceCenterId || 0,
        isCod: shipmentRef?.isCod || false,
        codAmount: shipmentRef?.codAmount || 0,
        piecesRows: normalizePieceRows(shipmentRef?.piecesRows),
        charges: [],
    }
}

const normalizeShipmentPayload = (values: ShipmentFormValues): ShipmentFormValues => {
    const payload: ShipmentFormValues = {
        awbNo: values.awbNo?.trim() || undefined,
        bookDate: toDateInputValue(values.bookDate),
        bookTime: values.bookTime?.trim() || undefined,
        referenceNo: values.referenceNo?.trim() || undefined,
        customerId: normalizePositiveNumberValue(values.customerId),
        clientId: normalizePositiveNumberValue(values.clientId ?? values.customerId),
        shipperId: normalizePositiveNumberValue(values.shipperId),
        consigneeId: normalizePositiveNumberValue(values.consigneeId),
        shipper: values.shipper
            ? {
                shipperCode: values.shipper.shipperCode?.trim() || undefined,
                shipperName: values.shipper.shipperName?.trim() || undefined,
                pinCodeId: normalizePositiveNumberValue(values.shipper.pinCodeId),
                contactPerson: values.shipper.contactPerson?.trim() || undefined,
                address1: values.shipper.address1?.trim() || undefined,
                address2: values.shipper.address2?.trim() || undefined,
                telephone: values.shipper.telephone?.trim() || undefined,
                mobile: values.shipper.mobile?.trim() || undefined,
                email: values.shipper.email?.trim() || undefined,
            } as NonNullable<ShipmentFormValues['shipper']>
            : undefined,
        consignee: values.consignee
            ? {
                code: values.consignee.code?.trim() || undefined,
                name: values.consignee.name?.trim() || undefined,
                pinCodeId: normalizePositiveNumberValue(values.consignee.pinCodeId),
                contactPerson: values.consignee.contactPerson?.trim() || undefined,
                address1: values.consignee.address1?.trim() || undefined,
                address2: values.consignee.address2?.trim() || undefined,
                telephone: values.consignee.telephone?.trim() || undefined,
                mobile: values.consignee.mobile?.trim() || undefined,
                email: values.consignee.email?.trim() || undefined,
            } as NonNullable<ShipmentFormValues['consignee']>
            : undefined,
        productId: normalizePositiveNumberValue(values.productId),
        fromZoneId: normalizePositiveNumberValue(values.fromZoneId),
        toZoneId: normalizePositiveNumberValue(values.toZoneId),
        shipmentTotalValue: normalizeNumberValue(values.shipmentTotalValue ?? values.shipmentValue),
        actualWeight: normalizeNumberValue(values.actualWeight) ?? 0,
        volumetricWeight: normalizeNumberValue(values.volumetricWeight) ?? 0,
        chargeWeight: normalizeNumberValue(values.chargeWeight) ?? 0,
        reversePickup: Boolean(values.reversePickup),
        appointmentDelivery: Boolean(values.appointmentDelivery),
        floorDelivery: Boolean(values.floorDelivery),
        floorCount: normalizeNumberValue(values.floorCount),
        km: normalizeNumberValue(values.km),
        isEdl: Boolean(values.isEdl),
        odaEdlDistanceKm: normalizeNumberValue(values.odaEdlDistanceKm),
        commercial: Boolean(values.commercial),
        paymentType: values.paymentType?.trim() || undefined,
        instruction: values.instruction?.trim() || undefined,
        serviceCenterId: normalizePositiveNumberValue(values.serviceCenterId),
        serviceMapId: normalizeNumberValue(values.serviceMapId),
        isCod: Boolean(values.isCod),
        codAmount: normalizeNumberValue(values.codAmount),
        piecesRows: normalizePieceRows(values.piecesRows).filter((row) => Number(row.pieces || 0) > 0),
        charges: (values.charges || []).map((row) => ({
            chargeId: normalizePositiveNumberValue(row.chargeId) ?? 0,
            description: row.description?.trim() || undefined,
            amount: normalizeNumberValue(row.amount) ?? 0,
            fuelApply: Boolean(row.fuelApply),
            taxApply: Boolean(row.taxApply),
            taxOnFuel: Boolean(row.taxOnFuel),
            chargeType: row.chargeType?.trim() || undefined,
        })),
    }

    return payload
}

const normalizeShipmentUpdatePayload = (values: ShipmentFormValues): ShipmentFormValues => {
    const { serviceMapId: _serviceMapId, ...payload } = normalizeShipmentPayload(values)
    return payload
}

const normalizeShipmentCalculatePayload = (values: ShipmentFormValues): ShipmentFormValues => {
    const { serviceMapId: _serviceMapId, charges: _charges, ...payload } = normalizeShipmentPayload(values)
    return payload
}

const normalizeForwardingPayload = (values: ForwardingRow) => ({
    forwardingAwb: values.forwardingAwb?.trim() || undefined,
    deliveryVendorId: normalizePositiveNumberValue(values.deliveryVendorId),
    deliveryServiceMapId: normalizePositiveNumberValue(values.deliveryServiceMapId),
    vendorWeight: normalizeNumberValue(values.vendorWeight),
    vendorAmount: normalizeNumberValue(values.vendorAmount),
    vendorInvoice: values.vendorInvoice?.trim() || undefined,
    contractCharges: normalizeNumberValue(values.contractCharges),
    otherCharges: normalizeNumberValue(values.otherCharges),
    subTotal: normalizeNumberValue(values.subTotal),
    totalFuel: normalizeNumberValue(values.totalFuel),
    igst: normalizeNumberValue(values.igst),
    cgst: normalizeNumberValue(values.cgst),
    sgst: normalizeNumberValue(values.sgst),
    totalAmount: normalizeNumberValue(values.totalAmount),
})

const buildPreviewFromSavedShipment = (shipment?: Shipment | null): ShipmentCalculateResponse | null => {
    if (!shipment) return null
    const rows = (shipment.charges || []).map((row) => ({
        type: 'RATE_CHARGE' as const,
        name: row.description || row.chargeType || `Charge ${row.chargeId || ''}`.trim(),
        amount: Number(row.amount) || 0,
        calculationBase: undefined,
        isPercentage: false,
    }))
    return {
        rateMasterId: shipment.rateMasterId ?? undefined,
        fromZoneId: shipment.fromZoneId ?? undefined,
        toZoneId: shipment.toZoneId ?? undefined,
        baseFreight: shipment.baseFreight != null ? Number(shipment.baseFreight) : undefined,
        totalAmount: shipment.totalAmount != null ? Number(shipment.totalAmount) : undefined,
        totalCharges: rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        rows,
    }
}

const toDateInputValue = (value?: string | null, fallback = new Date().toISOString().split('T')[0]) => {
    return value?.split('T')[0] || fallback
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
            breadth: parseNum(get(cells, "breadth")) ?? parseNum(get(cells, "width")),
            height: parseNum(get(cells, "height")),
            division: parseNum(get(cells, "division")),
            volumetricWeight: parseNum(get(cells, "volumetricWeight")),
            chargeWeight: parseNum(get(cells, "chargeWeight")),
            items: [createEmptyPieceItem()],
        }
    }).filter((row) => row.pieces > 0)
}

const parsePiecesExcel = (file: File): Promise<NonNullable<ShipmentFormValues["piecesRows"]>> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            try {
                const data = reader.result
                if (!data) throw new Error("Empty file")
                const workbook = XLSX.read(data, { type: "array" })
                const firstSheetName = workbook.SheetNames[0]
                if (!firstSheetName) throw new Error("No sheet found")
                const sheet = workbook.Sheets[firstSheetName]
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
                const csvHeader = "actualWeight,pieces,length,breadth,height,division,volumetricWeight,chargeWeight"
                const csvRows = rows.map((row) =>
                    [
                        row.actualWeight ?? row.actualWeightPerPc ?? "",
                        row.pieces ?? "",
                        row.length ?? "",
                        row.breadth ?? row.width ?? "",
                        row.height ?? "",
                        row.division ?? "",
                        row.volumetricWeight ?? "",
                        row.chargeWeight ?? "",
                    ].join(","),
                )
                resolve(parsePiecesCsv([csvHeader, ...csvRows].join("\n")))
            } catch (error) {
                reject(error)
            }
        }
        reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"))
        reader.readAsArrayBuffer(file)
    })

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
    return Number.isFinite(next) ? Math.max(0, next) : undefined
}

const decimalToFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
        const next = Number(value)
        return Number.isFinite(next) ? next : undefined
    }
    if (value && typeof value === 'object' && 'd' in (value as { d?: number[] })) {
        const decimal = value as { s?: number; e?: number; d?: number[] }
        const digits = Array.isArray(decimal.d) ? decimal.d.join('') : ''
        const exponent = decimal.e ?? 0
        const sign = decimal.s === -1 ? '-' : ''
        const parsed = Number(`${sign}${digits}e${exponent}`)
        return Number.isFinite(parsed) ? parsed : undefined
    }
    return undefined
}

const sanitizeArray = <T,>(value: Array<T | null | undefined> | null | undefined): T[] => {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is T => item != null)
}

const toSafeOptionLabel = (value: unknown, fallback: string) => {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    return fallback
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
    pinCodeId: undefined,
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
    pinCodeId: undefined,
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
    actualWeight: undefined,
    length: undefined,
    breadth: undefined,
    height: undefined,
    division: undefined,
    volumetricWeight: undefined,
    chargeWeight: undefined,
    items: [createEmptyPieceItem()],
})

type PieceRowForm = NonNullable<ShipmentFormValues['piecesRows']>[number]
type PieceItemList = NonNullable<PieceRowForm['items']>
type PieceItemForm = PieceItemList[number]

type ShipmentPartySource = {
    shipperCode?: string | null
    shipperName?: string | null
    consigneeName?: string | null
    name?: string | null
    code?: string | null
    pinCodeId?: number | null
    serviceablePincode?: {
        id?: number | null
        pinCode?: string | null
        cityName?: string | null
        state?: { stateName?: string | null } | null
        country?: { name?: string | null } | null
    } | null
    contactPerson?: string | null
    address1?: string | null
    address2?: string | null
    city?: string | null
    state?: { stateName?: string | null } | null
    stateMaster?: { stateName?: string | null } | null
    country?: { name?: string | null } | null
    telephone?: string | null
    mobile?: string | null
    email?: string | null
}

type ShipmentFormSource = Shipment & {
    customerId?: number | null
    shipperId?: number | null
    consigneeId?: number | null
    ewaybillNumber?: string | null
    origin?: string | null
    originCode?: string | null
    destination?: string | null
    destinationCode?: string | null
    vendorId?: number | null
    serviceMapId?: number | null
    shipmentValue?: number | null
    shipmentTotalValue?: number | null
    fromZoneId?: number | null
    toZoneId?: number | null
    reversePickup?: boolean | null
    appointmentDelivery?: boolean | null
    floorDelivery?: boolean | null
    floorCount?: number | null
    currency?: string | null
    pieces?: number | null
    actualWeight?: number | null
    volumetricWeight?: number | null
    chargeWeight?: number | null
    km?: number | null
    isEdl?: boolean | null
    odaEdlDistanceKm?: number | string | null
    commercial?: boolean | null
    oda?: boolean | null
    medicalCharges?: number | null
    paymentType?: string | null
    serviceCenterId?: number | null
    isCod?: boolean | null
    codAmount?: number | null
    shipper?: ShipmentPartySource | null
    consignee?: ShipmentPartySource | null
    piecesRows?: ShipmentFormValues['piecesRows']
    charges?: ShipmentFormValues['charges']
}

function shipperFromMaster(s: Shipper): NonNullable<ShipmentFormValues['shipper']> {
    const shipper = s as ShipmentPartySource
    return {
        shipperCode: strOrEmpty(shipper.shipperCode),
        shipperName: strOrEmpty(shipper.shipperName),
        pinCodeId: shipper.pinCodeId ?? shipper.serviceablePincode?.id ?? undefined,
        shipperOrigin: '',
        contactPerson: strOrEmpty(shipper.contactPerson),
        address1: strOrEmpty(shipper.address1),
        address2: strOrEmpty(shipper.address2),
        pinCode: strOrEmpty(shipper.serviceablePincode?.pinCode),
        city: strOrEmpty(shipper.city ?? shipper.serviceablePincode?.cityName),
        state: strOrEmpty(shipper.state?.stateName ?? shipper.serviceablePincode?.state?.stateName),
        country: strOrEmpty(shipper.country?.name ?? shipper.serviceablePincode?.country?.name),
        telephone: strOrEmpty(shipper.telephone),
        mobile: strOrEmpty(shipper.mobile),
        email: strOrEmpty(shipper.email),
    }
}

function consigneeFromMaster(c: Consignee): NonNullable<ShipmentFormValues['consignee']> {
    const consignee = c as ShipmentPartySource
    return {
        code: strOrEmpty(consignee.code),
        name: strOrEmpty(consignee.name),
        pinCodeId: consignee.pinCodeId ?? consignee.serviceablePincode?.id ?? undefined,
        destination: '',
        contactPerson: strOrEmpty(consignee.contactPerson),
        address1: strOrEmpty(consignee.address1),
        address2: strOrEmpty(consignee.address2),
        pinCode: strOrEmpty(consignee.serviceablePincode?.pinCode),
        city: strOrEmpty(consignee.city ?? consignee.serviceablePincode?.cityName),
        state: strOrEmpty(consignee.stateMaster?.stateName ?? consignee.state?.stateName ?? consignee.serviceablePincode?.state?.stateName),
        country: strOrEmpty(consignee.country?.name ?? consignee.serviceablePincode?.country?.name),
        telephone: strOrEmpty(consignee.telephone),
        mobile: strOrEmpty(consignee.mobile),
        email: strOrEmpty(consignee.email),
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
    const [isForwardingStepComplete, setIsForwardingStepComplete] = useState(Boolean(initialData?.forwarding))
    const [forwardingForm, setForwardingForm] = useState<ForwardingRow>(() => {
        const existing = initialData?.forwarding
        return {
            forwardingAwb: existing?.forwardingAwb || "",
            deliveryVendorId: existing?.deliveryVendorId || 0,
            deliveryServiceMapId: existing?.deliveryServiceMapId || 0,
            vendorWeight: Number(existing?.vendorWeight || 0),
            vendorAmount: Number(existing?.vendorAmount || 0),
            vendorInvoice: existing?.vendorInvoice || "",
            contractCharges: Number(existing?.contractCharges || 0),
            otherCharges: Number(existing?.otherCharges || 0),
            subTotal: Number(existing?.subTotal || 0),
            totalFuel: Number(existing?.totalFuel || 0),
            igst: Number(existing?.igst || 0),
            cgst: Number(existing?.cgst || 0),
            sgst: Number(existing?.sgst || 0),
            totalAmount: Number(existing?.totalAmount || 0),
        }
    })
    const [kycRows, setKycRows] = useState<KycRow[]>([
        { id: generateKycRowId(), type: "AADHAAR", entryType: "ID_PROOF", entryDate: format(new Date(), "yyyy-MM-dd") },
    ])
    const existingKycDocuments: ShipmentKycDocument[] = initialData?.kycDocuments || []
    const [chargePreview, setChargePreview] = useState<ShipmentCalculateResponse | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')
    const [shipperSearch, setShipperSearch] = useState('')
    const [consigneeSearch, setConsigneeSearch] = useState('')
    const [contentSearch, setContentSearch] = useState('')
    const [productSearch, setProductSearch] = useState('')
    const [vendorSearch, setVendorSearch] = useState('')
    const [serviceMapSearch, setServiceMapSearch] = useState('')
    const [serviceCenterSearch, setServiceCenterSearch] = useState('')
    const [piecesImportOpen, setPiecesImportOpen] = useState(false)
    const [piecesExcelFile, setPiecesExcelFile] = useState<File | null>(null)
    const [shipperPincodeSearch, setShipperPincodeSearch] = useState('')
    const [consigneePincodeSearch, setConsigneePincodeSearch] = useState('')
    const [selectedShipperPincode, setSelectedShipperPincode] = useState<ServiceablePincode | null>(null)
    const [selectedConsigneePincode, setSelectedConsigneePincode] = useState<ServiceablePincode | null>(null)
    const [suppressShipperErrors, setSuppressShipperErrors] = useState(false)
    const [suppressConsigneeErrors, setSuppressConsigneeErrors] = useState(false)
    const chargePreviewRows = useMemo(() => {
        if (!chargePreview) return []
        const baseRow = typeof chargePreview.baseFreight === 'number'
            ? [{
                type: 'BASE' as const,
                name: 'Base Freight',
                amount: chargePreview.baseFreight,
                calculationBase: 'BASE_FREIGHT',
                fuelApply: chargePreview.baseFreightFuelApply === true,
            }]
            : []
        const sortedRows = [...(chargePreview.rows || [])].sort((a, b) => {
            const isEdlA = /(?:\bEDL\b|ODA)/i.test(`${a.name || ''} ${(a as { chargeType?: string }).chargeType || ''}`)
            const isEdlB = /(?:\bEDL\b|ODA)/i.test(`${b.name || ''} ${(b as { chargeType?: string }).chargeType || ''}`)
            const isFuelA = /(?:\bFUEL\b)/i.test(`${a.name || ''} ${(a as { chargeType?: string }).chargeType || ''}`)
            const isFuelB = /(?:\bFUEL\b)/i.test(`${b.name || ''} ${(b as { chargeType?: string }).chargeType || ''}`)
            if (isFuelA !== isFuelB) return isFuelA ? 1 : -1
            if (isEdlA !== isEdlB) return isEdlA ? -1 : 1
            const sequenceA = Number.isFinite(a.sequence) ? Number(a.sequence) : Number.MAX_SAFE_INTEGER
            const sequenceB = Number.isFinite(b.sequence) ? Number(b.sequence) : Number.MAX_SAFE_INTEGER
            if (sequenceA !== sequenceB) return sequenceA - sequenceB
            return a.name.localeCompare(b.name)
        })
        return [...baseRow, ...sortedRows]
    }, [chargePreview])

    const debouncedCustomerSearch = useDebounce(customerSearch.trim(), 300)
    const debouncedShipperSearch = useDebounce(shipperSearch.trim(), 300)
    const debouncedConsigneeSearch = useDebounce(consigneeSearch.trim(), 300)
    const debouncedContentSearch = useDebounce(contentSearch.trim(), 300)
    const debouncedProductSearch = useDebounce(productSearch.trim(), 300)
    const debouncedVendorSearch = useDebounce(vendorSearch.trim(), 300)
    const debouncedServiceMapSearch = useDebounce(serviceMapSearch.trim(), 300)
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

    const shipperPincodeOptions = sanitizeArray(shipperPincodeOptionsData?.data)
    const consigneePincodeOptions = sanitizeArray(consigneePincodeOptionsData?.data)
    const contentOptions = sanitizeArray(contentsQuery.data?.data)
    const serviceCenterOptions = sanitizeArray(serviceCentersData?.data)
    const customerOptions = sanitizeArray(customersData?.data)
    const shipperOptions = sanitizeArray(shippersData?.data)
    const consigneeOptions = sanitizeArray(consigneesData?.data)
    const productOptions = sanitizeArray(productsData?.data)
    const vendorOptions = sanitizeArray(vendorsData?.data)
    const customerComboboxOptions = customerOptions
        .map((customer) => {
            const value = normalizeMasterSelectId(customer.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(customer.name, `Customer #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const shipperComboboxOptions = shipperOptions
        .map((shipper) => {
            const value = normalizeMasterSelectId(shipper.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(shipper.shipperName, `Shipper #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const consigneeComboboxOptions = consigneeOptions
        .map((consignee) => {
            const value = normalizeMasterSelectId(consignee.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(consignee.name, `Consignee #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const productComboboxOptions = productOptions
        .map((product) => {
            const value = normalizeMasterSelectId(product.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(product.productName, `Product #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const serviceCenterComboboxOptions = serviceCenterOptions
        .map((serviceCenter) => {
            const value = normalizeMasterSelectId(serviceCenter.id)
            if (value <= 0) return null
            const code = toSafeOptionLabel(serviceCenter.code, '')
            const name = toSafeOptionLabel(serviceCenter.name, '')
            return {
                label: code && name ? `${code} - ${name}` : code || name || `Service Center #${value}`,
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const vendorComboboxOptions = vendorOptions
        .map((vendor) => {
            const value = normalizeMasterSelectId(vendor.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(vendor.vendorName, `Vendor #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const form = useForm<ShipmentFormValues>({
        resolver: zodResolver(shipmentSchema) as Resolver<ShipmentFormValues>,
        defaultValues: buildShipmentFormValues(initialData),
    })

    const { fields: pieceFields, append: appendPiece, remove: removePiece } = useFieldArray({
        control: form.control,
        name: "piecesRows"
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
        mutationFn: () => shipmentService.calculateCharges(normalizeShipmentCalculatePayload(form.getValues())),
        onSuccess: (response) => {
            setChargePreview(response.data)
            const editableCharges = (response.data?.rows || []).map((row) => ({
                chargeId: normalizePositiveNumberValue(row.chargeId) ?? 0,
                description: row.name,
                amount: Math.round(Number(row.amount) || 0),
                fuelApply: row.type !== 'CONDITION' ? true : false,
                taxApply: false,
                taxOnFuel: false,
            }))
            form.setValue('charges', editableCharges, { shouldDirty: true, shouldValidate: true })
            toast.success("Charges calculated")
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, "Failed to calculate charges"))
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset(buildShipmentFormValues(initialData))
        }
    }, [initialData, form])

    const watchedShipperId = form.watch('shipperId')
    const watchedConsigneeId = form.watch('consigneeId')
    const watchedCustomerId = form.watch('customerId')
    const watchedProductId = form.watch('productId')
    const watchedBookDate = form.watch('bookDate')
    const watchedBookTime = form.watch('bookTime')
    const watchedFromZoneId = form.watch('fromZoneId')
    const watchedToZoneId = form.watch('toZoneId')
    const watchedFloorDelivery = form.watch('floorDelivery')
    const watchedFloorCount = form.watch('floorCount')
    const watchedIsCod = form.watch('isCod')
    const watchedReversePickup = form.watch('reversePickup')
    const watchedAppointmentDelivery = form.watch('appointmentDelivery')
    const watchedShipmentTotalValue = form.watch('shipmentTotalValue')
    const watchedActualWeight = form.watch('actualWeight')
    const watchedVolumetricWeight = form.watch('volumetricWeight')
    const watchedKm = form.watch('km')
    const watchedIsEdl = form.watch('isEdl')
    const watchedOdaEdlDistanceKm = form.watch('odaEdlDistanceKm')
    const watchedPiecesRowsForPricing = form.watch('piecesRows')
    const watchedShipperPinCode = form.watch('shipper.pinCode')
    const watchedConsigneePinCode = form.watch('consignee.pinCode')

    const { data: customerVolumetricsData } = useQuery({
        queryKey: ['shipment-customer-volumetrics', watchedCustomerId],
        queryFn: () => customerService.getCustomerVolumetrics(normalizeMasterSelectId(watchedCustomerId)),
        enabled: normalizeMasterSelectId(watchedCustomerId) > 0,
    })

    const customerVolumetricOptions = sanitizeArray(customerVolumetricsData?.data)

    const debouncedShipperPinCode = useDebounce((watchedShipperPinCode || '').trim(), 400)
    const debouncedConsigneePinCode = useDebounce((watchedConsigneePinCode || '').trim(), 400)
    const autoPricingTriggerKey = useMemo(
        () =>
            JSON.stringify({
                customerId: watchedCustomerId,
                productId: watchedProductId,
                bookDate: watchedBookDate,
                bookTime: watchedBookTime,
                fromZoneId: watchedFromZoneId,
                toZoneId: watchedToZoneId,
                reversePickup: watchedReversePickup,
                appointmentDelivery: watchedAppointmentDelivery,
                floorDelivery: watchedFloorDelivery,
                floorCount: watchedFloorCount,
                shipmentTotalValue: watchedShipmentTotalValue,
                km: watchedKm,
                isEdl: watchedIsEdl,
                odaEdlDistanceKm: watchedOdaEdlDistanceKm,
                piecesRows: watchedPiecesRowsForPricing,
                shipperId: watchedShipperId,
                consigneeId: watchedConsigneeId,
                shipperPinCode: watchedShipperPinCode,
                consigneePinCode: watchedConsigneePinCode,
            }),
        [
            watchedCustomerId,
            watchedProductId,
            watchedBookDate,
            watchedBookTime,
            watchedFromZoneId,
            watchedToZoneId,
            watchedReversePickup,
            watchedAppointmentDelivery,
            watchedFloorDelivery,
            watchedFloorCount,
            watchedShipmentTotalValue,
            watchedKm,
            watchedIsEdl,
            watchedOdaEdlDistanceKm,
            watchedPiecesRowsForPricing,
            watchedShipperId,
            watchedConsigneeId,
            watchedShipperPinCode,
            watchedConsigneePinCode,
        ],
    )
    const debouncedAutoPricingTriggerKey = useDebounce(autoPricingTriggerKey, 650)

    useEffect(() => {
        if (!isEdit || !savedShipment?.id) return
        if (!normalizeMasterSelectId(watchedCustomerId) || !normalizeMasterSelectId(watchedProductId)) return
        if (!(normalizeMasterSelectId(watchedShipperId) > 0 || (watchedShipperPinCode || '').trim())) return
        if (!(normalizeMasterSelectId(watchedConsigneeId) > 0 || (watchedConsigneePinCode || '').trim())) return
        let cancelled = false
        ;(async () => {
            try {
                const response = await shipmentService.calculateCharges(normalizeShipmentCalculatePayload(form.getValues()))
                if (!cancelled) {
                    setChargePreview(response.data)
                }
            } catch {
                // Silent in auto mode; explicit Calculate button shows toast.
            }
        })()
        return () => {
            cancelled = true
        }
    }, [debouncedAutoPricingTriggerKey, isEdit, savedShipment?.id, watchedCustomerId, watchedProductId, watchedShipperId, watchedConsigneeId, watchedShipperPinCode, watchedConsigneePinCode, form])

    const prevShipperIdRef = useRef<number>(0)
    const prevConsigneeIdRef = useRef<number>(0)
    const isShipperLocked = normalizeMasterSelectId(watchedShipperId) > 0
    const isConsigneeLocked = normalizeMasterSelectId(watchedConsigneeId) > 0

    const clearShipperBlock = () => {
        form.setValue('shipperId', 0, { shouldDirty: true, shouldValidate: false })
        form.setValue('fromZoneId', 0, { shouldDirty: true, shouldValidate: false })
        ;([
            'shipper.shipperName',
            'shipper.pinCodeId',
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
            'consignee.pinCodeId',
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
        const selectedZones = sanitizeArray(selected?.zones)
        if (scope === 'shipper') {
            form.setValue('shipper.pinCode', pinCode, { shouldDirty: true, shouldValidate: true })
            form.setValue('shipper.pinCodeId', selected?.id, { shouldDirty: true, shouldValidate: true })
            form.setValue('fromZoneId', selectedZones.length === 1 ? selectedZones[0].id : 0, { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.city', selected?.areaName || selected?.cityName || '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.state', selected?.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.country', selected?.country?.name || '', { shouldDirty: false, shouldValidate: false })
            setSelectedShipperPincode(selected ?? null)
            setShipperPincodeSearch('')
            return
        }

        form.setValue('consignee.pinCode', pinCode, { shouldDirty: true, shouldValidate: true })
        form.setValue('consignee.pinCodeId', selected?.id, { shouldDirty: true, shouldValidate: true })
        form.setValue('toZoneId', selectedZones.length === 1 ? selectedZones[0].id : 0, { shouldDirty: false, shouldValidate: false })
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
    const shipperZoneOptions = useMemo(() => sanitizeArray(shipperPincodeSource?.zones), [shipperPincodeSource])
    const consigneeZoneOptions = useMemo(() => sanitizeArray(consigneePincodeSource?.zones), [consigneePincodeSource])
    const shipperZoneComboboxOptions = shipperZoneOptions
        .map((zone) => {
            const value = normalizeMasterSelectId(zone.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(zone.name || zone.code, `Zone #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)
    const consigneeZoneComboboxOptions = consigneeZoneOptions
        .map((zone) => {
            const value = normalizeMasterSelectId(zone.id)
            if (value <= 0) return null
            return {
                label: toSafeOptionLabel(zone.name || zone.code, `Zone #${value}`),
                value,
            }
        })
        .filter((option): option is { label: string; value: number } => option != null)

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
            if ((form.getValues('km') || 0) !== MIN_SAME_PINCODE_DISTANCE_KM) {
                form.setValue('km', MIN_SAME_PINCODE_DISTANCE_KM, { shouldDirty: false, shouldValidate: false })
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
        if (shipperZoneOptions.length === 0) return
        if (shipperZoneOptions.some((zone) => zone.id === watchedFromZoneId)) return
        form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
    }, [form, shipperZoneOptions, watchedFromZoneId])

    useEffect(() => {
        if (!watchedToZoneId) return
        if (consigneeZoneOptions.length === 0) return
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
            if (!initialData) {
                form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
            form.setValue('shipper.pinCodeId', undefined, { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (!lookup) {
            setSelectedShipperPincode(null)
            if (!initialData) {
                form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
            form.setValue('shipper.pinCodeId', undefined, { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('shipper.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (normalizeMasterSelectId(watchedShipperId) <= 0) {
            setSelectedShipperPincode(lookup)
        }
        form.setValue('shipper.pinCodeId', lookup.id, { shouldDirty: false, shouldValidate: false })
        const lookupZones = sanitizeArray(lookup.zones)
        form.setValue('fromZoneId', lookupZones.length === 1 ? lookupZones[0].id : form.getValues('fromZoneId'), { shouldDirty: false, shouldValidate: false })
        form.setValue('shipper.city', lookup.areaName || lookup.cityName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('shipper.state', lookup.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('shipper.country', lookup.country?.name || '', { shouldDirty: false, shouldValidate: false })
    }, [debouncedShipperPinCode, form, initialData, shipperPincodeData?.data, watchedShipperId])

    useEffect(() => {
        const lookup = consigneePincodeData?.data?.[0]
        if (normalizeMasterSelectId(watchedConsigneeId) > 0) return
        if (debouncedConsigneePinCode.length < 6) {
            setSelectedConsigneePincode(null)
            if (!initialData) {
                form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
            form.setValue('consignee.pinCodeId', undefined, { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (!lookup) {
            setSelectedConsigneePincode(null)
            if (!initialData) {
                form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
            form.setValue('consignee.pinCodeId', undefined, { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.city', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.state', '', { shouldDirty: false, shouldValidate: false })
            form.setValue('consignee.country', '', { shouldDirty: false, shouldValidate: false })
            return
        }

        if (normalizeMasterSelectId(watchedConsigneeId) <= 0) {
            setSelectedConsigneePincode(lookup)
        }
        form.setValue('consignee.pinCodeId', lookup.id, { shouldDirty: false, shouldValidate: false })
        const lookupZones = sanitizeArray(lookup.zones)
        form.setValue('toZoneId', lookupZones.length === 1 ? lookupZones[0].id : form.getValues('toZoneId'), { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.city', lookup.areaName || lookup.cityName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.state', lookup.state?.stateName || '', { shouldDirty: false, shouldValidate: false })
        form.setValue('consignee.country', lookup.country?.name || '', { shouldDirty: false, shouldValidate: false })
    }, [consigneePincodeData?.data, debouncedConsigneePinCode, form, initialData, watchedConsigneeId])

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
                if (!initialData) {
                    form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
                }
            }
            return
        }

        if (prev > 0) {
            form.setValue('shipper', EMPTY_SHIPPER_BLOCK, { shouldDirty: false, shouldValidate: false })
            setSelectedShipperPincode(null)
            if (!initialData) {
                form.setValue('fromZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
        }
    }, [watchedShipperId, shippersData?.data, form, initialData])

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
                if (!initialData) {
                    form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
                }
            }
            return
        }

        if (prev > 0) {
            form.setValue('consignee', EMPTY_CONSIGNEE_BLOCK, { shouldDirty: false, shouldValidate: false })
            setSelectedConsigneePincode(null)
            if (!initialData) {
                form.setValue('toZoneId', 0, { shouldDirty: false, shouldValidate: false })
            }
        }
    }, [watchedConsigneeId, consigneesData?.data, form, initialData])

    // --- Automatic Calculations ---

    // 1. Piece volumetric totals. Surface products use customer/product CFT with 27000; all others use 5000.
    const watchedPiecesRows = form.watch('piecesRows')
    const selectedProduct = useMemo(
        () => productOptions.find((product) => normalizeMasterSelectId(product.id) === normalizeMasterSelectId(watchedProductId)),
        [productOptions, watchedProductId],
    )
    const isSurfaceProduct = useMemo(() => {
        const productName = typeof selectedProduct?.productName === 'string' ? selectedProduct.productName.toLowerCase() : ''
        return productName.includes('surface')
    }, [selectedProduct])
    const surfaceCft = useMemo(() => {
        if (!isSurfaceProduct) return 0
        const productId = normalizeMasterSelectId(watchedProductId)
        const match = customerVolumetricOptions.find(
            (item) => normalizeMasterSelectId(item.productId) === productId,
        )
        const cft = decimalToFiniteNumber(match?.cft)
        return cft && cft > 0 ? cft : 0
    }, [customerVolumetricOptions, isSurfaceProduct, watchedProductId])
    const weightCalcKey = useDebounce(
        JSON.stringify(
            (watchedPiecesRows || []).map((row) => ({
                actualWeight: Number(row.actualWeight) || 0,
                pieces: Number(row.pieces) || 0,
                length: Number(row.length) || 0,
                breadth: Number(row.breadth) || 0,
                height: Number(row.height) || 0,
                items: (row.items || []).map((item) => ({
                    totalValue: Number(item.totalValue) || 0,
                })),
            })),
        ),
        250,
    )
    useEffect(() => {
        const calcRows = JSON.parse(weightCalcKey) as Array<{
            actualWeight: number
            pieces: number
            length: number
            breadth: number
            height: number
            items: Array<{ totalValue: number }>
        }>
        if (calcRows.length === 0) return

        const rowVolumetrics = calcRows.map((row) => {
            const pcs = Math.max(0, Number(row.pieces) || 0)
            const length = Math.max(0, Number(row.length) || 0)
            const breadth = Math.max(0, Number(row.breadth) || 0)
            const height = Math.max(0, Number(row.height) || 0)
            if (pcs <= 0 || length <= 0 || breadth <= 0 || height <= 0) return 0
            const lbh = length * breadth * height
            return roundWeightKg(
                isSurfaceProduct
                    ? ((lbh / 27000) * surfaceCft) * pcs
                    : (lbh / 5000) * pcs,
            )
        })

        rowVolumetrics.forEach((volWeight, index) => {
            form.setValue(`piecesRows.${index}.volumetricWeight`, volWeight, { shouldValidate: true })
        })

        const totalPcs = calcRows.reduce((sum, row) => sum + (Number(row.pieces) || 0), 0)
        const bookingTotalValue = calcRows.reduce(
            (sum, row) => sum + row.items.reduce((itemSum, item) => itemSum + (Number(item.totalValue) || 0), 0),
            0,
        )
        const totalVolumetricWeight = rowVolumetrics.reduce((sum, value) => sum + value, 0)
        form.setValue('pieces', Math.round(totalPcs), { shouldValidate: true })
        form.setValue('volumetricWeight', totalVolumetricWeight, { shouldValidate: true })
        // On edit, preserve backend booking total until user changes piece/item rows.
        if (!(isEdit && !form.formState.isDirty)) {
            form.setValue('shipmentTotalValue', Math.round(bookingTotalValue), { shouldValidate: true })
        }
    }, [form, isSurfaceProduct, surfaceCft, weightCalcKey]);

    useEffect(() => {
        const manualActualWeight = Math.max(0, Number(watchedActualWeight) || 0)
        const manualVolumetricWeight = Math.max(0, Number(watchedVolumetricWeight) || 0)
        const nextChargeWeight = roundWeightKg(Math.max(manualActualWeight, manualVolumetricWeight))
        const currentChargeWeight = Math.max(0, Number(form.getValues('chargeWeight')) || 0)
        if (nextChargeWeight !== currentChargeWeight) {
            form.setValue('chargeWeight', nextChargeWeight, { shouldValidate: true })
        }
    }, [form, watchedActualWeight, watchedVolumetricWeight]);

    // --- End Calculations ---

    const awbMutation = useMutation({
        mutationFn: (values: ShipmentFormValues) => {
            const targetId = savedShipment?.id || initialData?.id
            if (targetId) {
                return shipmentService.updateShipment(targetId, normalizeShipmentUpdatePayload(values))
            }
            return shipmentService.createShipment(normalizeShipmentPayload(values))
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
            toast.success(`Shipment booking ${isEdit || savedShipment ? 'updated' : 'created'} successfully`)
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, `Failed to ${isEdit || savedShipment ? 'update' : 'create'} shipment booking`))
        }
    })

    const forwardingMutation = useMutation({
        mutationFn: async () => {
            if (!savedShipment?.id || !savedShipment.version) {
                throw new Error('Please create shipment booking first')
            }
            return shipmentService.upsertForwarding(savedShipment.id, {
                version: Number(savedShipment.version),
                ...normalizeForwardingPayload(forwardingForm),
            })
        },
        onSuccess: (response) => {
            const nextVersion = ((response?.data as { shipment?: { version?: number } })?.shipment?.version) || savedShipment?.version
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
                throw new Error('Please create shipment booking first')
            }
            for (const row of kycRows) {
                await shipmentService.uploadKyc(savedShipment.id, {
                    type: row.type,
                    entryType: row.entryType,
                    entryDate: row.entryDate || undefined,
                })
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipments'] })
            toast.success('Shipment booking process completed')
            router.push('/transactions/shipment')
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, 'Failed to upload KYC'))
        },
    })

    const [downloadingPiecesTemplate, setDownloadingPiecesTemplate] = useState(false)

    const downloadPiecesExcelTemplate = async () => {
        setDownloadingPiecesTemplate(true)
        try {
            const sheet = XLSX.utils.aoa_to_sheet([
                [
                    "actualWeight",
                    "pieces",
                    "length",
                    "breadth",
                    "height",
                    "division",
                    "volumetricWeight",
                    "chargeWeight",
                ],
                [500, 1, 10, 10, 10, 5000, 0, 0],
                ["", "", "", "", "", "", "", ""],
            ])
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, sheet, "pieces")
            XLSX.writeFile(workbook, "shipment-pieces-template.xlsx")
            toast.success("Excel template downloaded")
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to download template"))
        } finally {
            setDownloadingPiecesTemplate(false)
        }
    }

    const handlePiecesExcelImport = async () => {
        if (!piecesExcelFile) return
        try {
            const parsed = await parsePiecesExcel(piecesExcelFile)
            form.setValue('piecesRows', parsed, { shouldValidate: true })
            toast.success(`${parsed.length} piece row(s) imported`)
            setPiecesImportOpen(false)
            setPiecesExcelFile(null)
        } catch {
            toast.error('Unable to parse uploaded Excel file')
        }
    }

    const updateForwardingForm = (patch: Partial<ForwardingRow>) => {
        setForwardingForm((prev) => ({ ...prev, ...patch }))
    }

    const forwardingServiceOptions = sanitizeArray(serviceMapsData?.data)
        .filter((sm) => sm.vendorId === forwardingForm.deliveryVendorId)
        .map((sm) => ({
            label: `${sm.serviceType} (${sm.id})`,
            value: sm.id,
        }))

    const addKycRow = () => {
        setKycRows((prev) => [
            ...prev,
            { id: generateKycRowId(), type: "AADHAAR", entryType: "ID_PROOF", entryDate: format(new Date(), "yyyy-MM-dd") },
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
                                            <FloatingFormItem required label="Book Date" itemClassName="md:col-span-1">
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
                                            <FloatingFormItem required label="Client Name" itemClassName="md:col-span-1">
                                                <FormControl>
                                                    <Combobox
                                                        options={customerComboboxOptions}
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
                                                            options={shipperComboboxOptions}
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
                                                <FloatingFormItem suppressError={suppressShipperErrors} label="Telephone">
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
                                                            options={shipperZoneComboboxOptions}
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
                                                            options={consigneeComboboxOptions}
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
                                                <FloatingFormItem suppressError={suppressConsigneeErrors} label="Telephone">
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
                                                            options={consigneeZoneComboboxOptions}
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
                                        <FloatingFormItem required label="Product">
                                            <FormControl>
                                                <Combobox
                                                    options={productComboboxOptions}
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
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="shipmentTotalValue"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Booking Total Value">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
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
                                        name="km"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Total Distance (KM)">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
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
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <FormField
                                        control={form.control}
                                        name="actualWeight"
                                        render={({ field }) => (
                                            <FloatingFormItem required label="Actual Weight">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
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
                                        name="volumetricWeight"
                                        render={({ field }) => (
                                            <FloatingFormItem required label="Total Vol. Weight">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
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
                                            <FloatingFormItem required label="Charge Weight">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className={FLOATING_INNER_CONTROL}
                                                        {...field}
                                                        value={numberInputValue(field.value)}
                                                        disabled
                                                    />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="rounded-md border border-border/70 bg-muted/20 p-2.5">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <FormField
                                                control={form.control}
                                                name="isEdl"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-normal leading-none">ODA/EDL</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="floorDelivery"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-normal leading-none">Floor Delivery</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="reversePickup"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-normal leading-none">Reverse Pickup</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="appointmentDelivery"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-normal leading-none">Appointment Delivery</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="commercial"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-normal leading-none">Commercial</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="isCod"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-normal leading-none">COD</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <FormField
                                            control={form.control}
                                            name="odaEdlDistanceKm"
                                            render={({ field }) => (
                                                <FloatingFormItem required={watchedIsEdl} label="EDL distance (km)">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                        min="0"
                                                            className={FLOATING_INNER_CONTROL}
                                                            {...field}
                                                            value={numberInputValue(field.value)}
                                                            onChange={(e) => field.onChange(parseOptionalNumberInput(e.target.value))}
                                                            disabled={!watchedIsEdl}
                                                        />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="floorCount"
                                            render={({ field }) => (
                                                <FloatingFormItem required={watchedFloorDelivery} label="Floor Count">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                        min="0"
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
                                            name="codAmount"
                                            render={({ field }) => (
                                                <FloatingFormItem label="COD Amount">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                        min="0"
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
                                                    options={serviceCenterComboboxOptions}
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
                        </FormSection>
                        </div>
                    </div>
                </div>

                {/* Section 5: Piece Details */}
                <OutlinedFormSection label="Piece Details" labelTone="navy">
                    <div className="flex flex-wrap items-end justify-end gap-2 border-b border-border/70 pb-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Import pieces from Excel"
                            onClick={() => setPiecesImportOpen(true)}
                        >
                            <FileUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPiece(createEmptyPieceRow())}>
                            <Plus className="mr-2 h-4 w-4" /> Add Piece
                        </Button>
                    </div>
                    <Dialog
                        open={piecesImportOpen}
                        onOpenChange={(open) => {
                            setPiecesImportOpen(open)
                            if (!open) setPiecesExcelFile(null)
                        }}
                    >
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Import Piece Details</DialogTitle>
                                <DialogDescription>
                                    Download template, fill rows in Excel, then upload the file.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-center gap-2"
                                    disabled={downloadingPiecesTemplate}
                                    onClick={() => void downloadPiecesExcelTemplate()}
                                >
                                    <Download className="h-4 w-4" />
                                    {downloadingPiecesTemplate ? "Downloading..." : "Download Excel template"}
                                </Button>
                                <input
                                    id="shipment-pieces-excel-input"
                                    type="file"
                                    accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null
                                        if (!file) {
                                            setPiecesExcelFile(null)
                                            return
                                        }
                                        const lower = file.name.toLowerCase()
                                        if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
                                            toast.error("Only .xlsx or .xls files are allowed")
                                            event.target.value = ""
                                            setPiecesExcelFile(null)
                                            return
                                        }
                                        setPiecesExcelFile(file)
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => document.getElementById('shipment-pieces-excel-input')?.click()}
                                >
                                    {piecesExcelFile ? `Selected: ${piecesExcelFile.name}` : "Choose Excel file (.xlsx / .xls)"}
                                </Button>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setPiecesImportOpen(false)}>
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!piecesExcelFile}
                                    onClick={() => void handlePiecesExcelImport()}
                                >
                                    Upload & import
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                        <Table>
                            <TableBody>
                                {pieceFields.map((field, index) => (
                                    <Fragment key={field.id}>
                                        <TableRow className="bg-primary/10 backdrop-blur-sm hover:bg-primary/15">
                                            <TableCell className="w-[58px] text-xs font-medium">Pcs</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...form.register(`piecesRows.${index}.pieces` as const, {
                                                        valueAsNumber: true,
                                                        onChange: (event) => {
                                                            if (Number(event.target.value) < 0) event.target.value = "0"
                                                        },
                                                    })}
                                                    className="h-8 w-16"
                                                />
                                            </TableCell>
                                            <TableCell className="w-[40px] text-xs font-medium">L</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...form.register(`piecesRows.${index}.length` as const, {
                                                            valueAsNumber: true,
                                                            onChange: (event) => {
                                                                if (Number(event.target.value) < 0) event.target.value = "0"
                                                            },
                                                        })}
                                                        className="h-8 w-16"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">cm</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[40px] text-xs font-medium">B</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...form.register(`piecesRows.${index}.breadth` as const, {
                                                            valueAsNumber: true,
                                                            onChange: (event) => {
                                                                if (Number(event.target.value) < 0) event.target.value = "0"
                                                            },
                                                        })}
                                                        className="h-8 w-16"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">cm</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[40px] text-xs font-medium">H</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        {...form.register(`piecesRows.${index}.height` as const, {
                                                            valueAsNumber: true,
                                                            onChange: (event) => {
                                                                if (Number(event.target.value) < 0) event.target.value = "0"
                                                            },
                                                        })}
                                                        className="h-8 w-16"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">cm</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[58px] text-xs font-medium">Vol. Wt</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        {...form.register(`piecesRows.${index}.volumetricWeight` as const, { valueAsNumber: true })}
                                                        className="h-8 w-20"
                                                        disabled
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">kg</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removePiece(index)} disabled={pieceFields.length <= 1}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={11} className="border-t-0 pb-4 pt-0">
                                                <div className="space-y-3 rounded-md border border-dashed border-border/70 bg-background/80 p-3">
                                                    <div className="space-y-3">
                                                        {(watchedPiecesRows?.[index]?.items || []).map((item, itemIndex) => (
                                                            <div key={`${field.id}-item-${itemIndex}`} className="rounded-md border border-border/60 bg-card p-3">
                                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                                    <span className="text-xs font-medium text-muted-foreground">
                                                                        Item {itemIndex + 1}
                                                                        {itemIndex === 0 && (
                                                                            <span className="font-normal opacity-70 ml-1">
                                                                                | At least one item is required for every piece.
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        {itemIndex === 0 ? (
                                                                            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => addPieceItem(index)}>
                                                                                <Plus className="mr-2 h-4 w-4" /> Add Item
                                                                            </Button>
                                                                        ) : (
                                                                            <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => removePieceItem(index, itemIndex)}>
                                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="grid gap-2 lg:grid-cols-4">
                                                                    <div className="min-w-0">
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
                                                                    </div>
                                                                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:col-span-3 xl:grid-cols-6">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`piecesRows.${index}.items.${itemIndex}.quantity` as const}
                                                                            render={({ field: itemField }) => (
                                                                                <FloatingFormItem label="Quantity">
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="1"
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
                                                                                <FloatingFormItem label="M. Value">
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="0"
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
                                                                                <FloatingFormItem label="Unit">
                                                                                    <Select value={itemField.value || ""} onValueChange={itemField.onChange}>
                                                                                        <FormControl>
                                                                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                                                                <SelectValue placeholder="Unit" />
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
                                                                                            min="0"
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
                                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
                    </div>
                    <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-0 bg-primary hover:bg-primary">
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Charge
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">
                                        Amount
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-primary-foreground">Fuel</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chargePreviewRows.map((row, index) => (
                                    <TableRow key={`${row.type}-${row.name}-${index}`}>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>{row.amount}</TableCell>
                                        <TableCell>
                                            {row.type === 'BASE'
                                                ? 'Yes'
                                                : (row as { fuelApply?: boolean }).fuelApply === true
                                                    ? 'Yes'
                                                    : 'No'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {chargePreviewRows.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                            No calculated charges yet. Click &quot;Calculate Charges&quot;.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {chargePreview && (
                        <div className="mt-3 rounded-md border border-border/70 bg-muted/20 p-3 text-sm">
                            <div className="flex flex-wrap gap-4">
                                <p><span className="text-muted-foreground">Total Amount:</span> {chargePreview.totalAmount ?? "—"}</p>
                            </div>
                        </div>
                    )}
                </OutlinedFormSection>

                    </TabsContent>

                    <TabsContent value="forwarding">
                        <OutlinedFormSection label="Forwarding Details" labelTone="navy">
                            <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2 xl:grid-cols-3">
                                <FloatingFormItem label="Forwarding AWB">
                                    <Input
                                        className={FLOATING_INNER_CONTROL}
                                        value={forwardingForm.forwardingAwb}
                                        onChange={(e) => updateForwardingForm({ forwardingAwb: e.target.value })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem required label="Vendor">
                                    <Combobox
                                        options={vendorComboboxOptions}
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
                                <FloatingFormItem required label="Service">
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
                                <FloatingFormItem label="Vendor Weight">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.vendorWeight)}
                                        onChange={(e) => updateForwardingForm({ vendorWeight: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Vendor Amount">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.vendorAmount)}
                                        onChange={(e) => updateForwardingForm({ vendorAmount: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Vendor Invoice">
                                    <Input
                                        className={FLOATING_INNER_CONTROL}
                                        value={forwardingForm.vendorInvoice}
                                        onChange={(e) => updateForwardingForm({ vendorInvoice: e.target.value })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Contract Charges">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.contractCharges)}
                                        onChange={(e) => updateForwardingForm({ contractCharges: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Other Charges">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.otherCharges)}
                                        onChange={(e) => updateForwardingForm({ otherCharges: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Sub Total">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.subTotal)}
                                        onChange={(e) => updateForwardingForm({ subTotal: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Total Fuel">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.totalFuel)}
                                        onChange={(e) => updateForwardingForm({ totalFuel: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="IGST">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.igst)}
                                        onChange={(e) => updateForwardingForm({ igst: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="CGST">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.cgst)}
                                        onChange={(e) => updateForwardingForm({ cgst: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="SGST">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={numberInputValue(forwardingForm.sgst)}
                                        onChange={(e) => updateForwardingForm({ sgst: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                                <FloatingFormItem label="Total Amount">
                                    <Input
                                        type="number"
                                                        min="0"
                                        className={FLOATING_INNER_CONTROL}
                                        value={forwardingForm.totalAmount || 0}
                                        onChange={(e) => updateForwardingForm({ totalAmount: parseOptionalNumberInput(e.target.value) || 0 })}
                                    />
                                </FloatingFormItem>
                            </div>
                            <p className="pt-2 text-xs text-muted-foreground">Forwarding details are saved after shipment booking save/update.</p>
                        </OutlinedFormSection>
                    </TabsContent>

                    <TabsContent value="kyc">
                        <OutlinedFormSection label="KYC Upload" labelTone="navy">
                            {existingKycDocuments.length > 0 && (
                                <div className="mb-4 overflow-hidden rounded-md border border-border/70 bg-muted/20">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b-0 bg-primary hover:bg-primary">
                                                <TableHead className="text-primary-foreground first:rounded-tl-md">Type</TableHead>
                                                <TableHead className="text-primary-foreground">Entry Type</TableHead>
                                                <TableHead className="text-primary-foreground">Entry Date</TableHead>
                                                <TableHead className="text-primary-foreground last:rounded-tr-md">Document</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {existingKycDocuments.map((doc) => (
                                                <TableRow key={doc.id}>
                                                    <TableCell>{doc.type}</TableCell>
                                                    <TableCell>{doc.entryType || '—'}</TableCell>
                                                    <TableCell>{doc.entryDate ? doc.entryDate.split('T')[0] : '—'}</TableCell>
                                                    <TableCell>{doc.documentPath || '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
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
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeKycRow(row.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <p className="pt-2 text-xs text-muted-foreground">KYC files are uploaded after shipment booking save/update using AWB number.</p>
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
