"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import { FloatingFormItem, FLOATING_INNER_COMBO, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item"
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
import { Checkbox } from "@/components/ui/checkbox"
import { vendorServiceablePincodeService } from '@/services/utilities/vendor-serviceable-pincode-service'
import { vendorService } from '@/services/masters/vendor-service'
import { serviceMapService } from '@/services/masters/service-map-service'
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { zoneService } from '@/services/masters/zone-service'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import {
    VendorServiceablePincode,
    type VendorServiceablePincodeFormData,
} from '@/types/utilities/vendor-serviceable-pincode'
import type { ServiceablePincode } from '@/types/utilities/serviceable-pincode'
import type { Zone } from '@/types/masters/zone'

const formSchema = z.object({
    vendorId: z.number().min(1, "Vendor is required"),
    serviceablePincodeId: z.number().min(1, "Master pincode is required"),
    /** null = all services for the vendor */
    serviceMapId: z.number().min(1).nullable(),
    zoneId: z.number().min(1, "Zone is required"),
    serviceable: z.boolean(),
    edl: z.boolean(),
    odaEdlDistanceKm: z
        .string()
        .optional()
        .refine(
            (s) => !s?.trim() || (!Number.isNaN(Number(s)) && Number(s) >= 0),
            { message: 'EDL distance must be a number ≥ 0' },
        ),
})

type FormValues = z.infer<typeof formSchema>

interface VendorServiceablePincodeFormProps {
    initialData?: VendorServiceablePincode | null
}

function formatDistanceInitial(value: unknown): string {
    if (value == null || value === '') return ''
    if (typeof value === 'number' || typeof value === 'string') return String(value)
    if (value && typeof value === 'object' && 'd' in (value as { d?: number[] })) {
        const decimal = value as { s?: number; e?: number; d?: number[] }
        const digits = Array.isArray(decimal.d) ? decimal.d.join('') : ''
        const exponent = decimal.e ?? 0
        const sign = decimal.s === -1 ? '-' : ''
        const parsed = Number(`${sign}${digits}e${exponent}`)
        return Number.isFinite(parsed) ? String(parsed) : ''
    }
    return ''
}

export function VendorServiceablePincodeForm({ initialData }: VendorServiceablePincodeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const [vendorOpen, setVendorOpen] = useState(false)
    const [pincodeOpen, setPincodeOpen] = useState(false)
    const [serviceOpen, setServiceOpen] = useState(false)
    const [zoneOpen, setZoneOpen] = useState(false)
    const [vendorSearch, setVendorSearch] = useState('')
    const [pincodeSearch, setPincodeSearch] = useState('')
    const [zoneSearch, setZoneSearch] = useState('')

    const debouncedVendorSearch = useDebounce(vendorSearch, 300)
    const debouncedPincodeSearch = useDebounce(pincodeSearch, 300)
    const debouncedZoneSearch = useDebounce(zoneSearch, 300)

    const [pickedVendor, setPickedVendor] = useState<{
        id: number
        vendorName: string
        vendorCode: string
    } | null>(() =>
        initialData?.vendorId && initialData.vendor
            ? {
                  id: initialData.vendorId,
                  vendorName: initialData.vendor.vendorName,
                  vendorCode: initialData.vendor.vendorCode,
              }
            : null,
    )

    const [pickedPincode, setPickedPincode] = useState<{
        id: number
        pinCode: string
        cityName: string
        areaName: string
    } | null>(() => {
        const pin = initialData?.serviceablePincode
        if (!pin?.id) return null
        return {
            id: pin.id,
            pinCode: pin.pinCode ?? initialData?.pinCode ?? '',
            cityName: pin.cityName ?? initialData?.cityName ?? '',
            areaName: pin.areaName ?? initialData?.areaName ?? '',
        }
    })

    const [pickedService, setPickedService] = useState<{
        id: number
        serviceType: string
    } | null>(() =>
        initialData?.serviceMapId && initialData.serviceMap
            ? {
                  id: initialData.serviceMapId,
                  serviceType: initialData.serviceMap.serviceType ?? `Service #${initialData.serviceMapId}`,
              }
            : null,
    )

    const [pickedZone, setPickedZone] = useState<{ id: number; name: string; code: string } | null>(() => {
        const z = initialData?.zone
        if (!z) return null
        return { id: z.id, name: z.name, code: z.code }
    })

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            vendorId: initialData?.vendorId ?? 0,
            serviceablePincodeId: initialData?.serviceablePincodeId ?? 0,
            serviceMapId: initialData?.serviceMapId ?? null,
            zoneId: initialData?.zoneId ?? 0,
            serviceable: initialData?.serviceable ?? true,
            edl: Boolean(initialData?.edl),
            odaEdlDistanceKm: formatDistanceInitial(initialData?.odaEdlDistanceKm),
        },
    })

    const selectedVendorId = useWatch({ control: form.control, name: 'vendorId' })
    const selectedPincodeId = useWatch({ control: form.control, name: 'serviceablePincodeId' })
    const selectedServiceMapId = useWatch({ control: form.control, name: 'serviceMapId' })
    const selectedZoneId = useWatch({ control: form.control, name: 'zoneId' })

    const { data: vendorsData, isFetching: isVendorsFetching } = useQuery({
        queryKey: ['vendors-list-vsp', debouncedVendorSearch],
        queryFn: () =>
            vendorService.getVendors({
                limit: 50,
                search: debouncedVendorSearch,
                sortBy: 'vendorCode',
                sortOrder: 'asc',
            }),
        enabled: vendorOpen || !!selectedVendorId,
        staleTime: 5 * 60 * 1000,
    })

    const { data: pincodesData, isFetching: isPincodesFetching } = useQuery({
        queryKey: ['serviceable-pincodes-vsp', debouncedPincodeSearch],
        queryFn: () =>
            serviceablePincodeService.getServiceablePincodes({
                limit: 50,
                search: debouncedPincodeSearch,
                sortBy: 'pinCode',
                sortOrder: 'asc',
            }),
        enabled: pincodeOpen || !!selectedPincodeId,
        staleTime: 5 * 60 * 1000,
    })

    const { data: serviceMapsData, isFetching: isServiceMapsFetching } = useQuery({
        queryKey: ['service-maps-by-vendor-vsp', selectedVendorId],
        queryFn: () => serviceMapService.getServiceMapsByVendor(selectedVendorId),
        enabled: selectedVendorId > 0,
        staleTime: 5 * 60 * 1000,
    })

    const { data: vendorZonesData, isFetching: isVendorZonesFetching } = useQuery({
        queryKey: ['zones-list-vsp-vendor', debouncedZoneSearch],
        queryFn: () =>
            zoneService.getZones({
                limit: 50,
                search: debouncedZoneSearch,
                sortBy: 'name',
                sortOrder: 'asc',
                zoneType: 'VENDOR',
            }),
        enabled: zoneOpen || !!selectedZoneId,
        staleTime: 5 * 60 * 1000,
    })

    const { data: allZonesData } = useQuery({
        queryKey: ['zones-list-vsp-all', debouncedZoneSearch],
        queryFn: () =>
            zoneService.getZones({
                limit: 50,
                search: debouncedZoneSearch,
                sortBy: 'name',
                sortOrder: 'asc',
            }),
        enabled: zoneOpen && (vendorZonesData?.data?.length ?? 0) === 0 && !isVendorZonesFetching,
        staleTime: 5 * 60 * 1000,
    })

    const vendorOptions = useMemo(() => {
        const fromApi = vendorsData?.data ?? []
        const seen = new Set(fromApi.map((v) => v.id))
        const extras = []
        if (pickedVendor?.id && !seen.has(pickedVendor.id)) {
            extras.push({
                id: pickedVendor.id,
                vendorCode: pickedVendor.vendorCode,
                vendorName: pickedVendor.vendorName,
            })
        }
        return [...extras, ...fromApi]
    }, [pickedVendor, vendorsData?.data])

    const pincodeOptions = useMemo(() => {
        const fromApi = pincodesData?.data ?? []
        const seen = new Set(fromApi.map((p) => p.id))
        const extras: ServiceablePincode[] = []
        if (pickedPincode?.id && !seen.has(pickedPincode.id)) {
            extras.push({
                id: pickedPincode.id,
                countryId: 0,
                stateId: 0,
                pinCode: pickedPincode.pinCode,
                cityName: pickedPincode.cityName,
                areaName: pickedPincode.areaName,
                serviceable: true,
            })
        }
        return [...extras, ...fromApi]
    }, [pickedPincode, pincodesData?.data])

    const serviceMapOptions = useMemo(() => {
        const fromApi = serviceMapsData?.data ?? []
        const seen = new Set(fromApi.map((s) => s.id))
        const extras: Array<{ id: number; serviceType: string | null }> = []
        if (pickedService?.id && !seen.has(pickedService.id)) {
            extras.push({ id: pickedService.id, serviceType: pickedService.serviceType })
        }
        return [...extras, ...fromApi]
    }, [pickedService, serviceMapsData?.data])

    const zoneOptions = useMemo(() => {
        const vendorZones = vendorZonesData?.data ?? []
        const allZones = allZonesData?.data ?? []
        const base = vendorZones.length > 0 ? vendorZones : allZones
        const seen = new Set(base.map((z) => z.id))
        const extras: Zone[] = []
        if (pickedZone?.id && !seen.has(pickedZone.id)) {
            extras.push({
                id: pickedZone.id,
                code: pickedZone.code,
                name: pickedZone.name,
                zoneType: (initialData?.zone?.zoneType === 'DOMESTIC' ? 'DOMESTIC' : 'VENDOR') as 'DOMESTIC' | 'VENDOR',
                countryId: null,
                createdAt: '',
                updatedAt: '',
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
            })
        }
        return [...extras, ...base]
    }, [allZonesData?.data, initialData?.zone?.zoneType, pickedZone, vendorZonesData?.data])

    const selectedVendor = useMemo(() => {
        if (pickedVendor && pickedVendor.id === selectedVendorId) return pickedVendor
        const fromList = vendorOptions.find((v) => v.id === selectedVendorId)
        if (fromList) {
            return {
                id: fromList.id,
                vendorName: fromList.vendorName,
                vendorCode: fromList.vendorCode,
            }
        }
        if (initialData?.vendorId === selectedVendorId && initialData.vendor) {
            return initialData.vendor
        }
        return null
    }, [initialData, pickedVendor, selectedVendorId, vendorOptions])

    const selectedPincode = useMemo(() => {
        if (pickedPincode && pickedPincode.id === selectedPincodeId) return pickedPincode
        const fromList = pincodeOptions.find((p) => p.id === selectedPincodeId)
        if (fromList) {
            return {
                id: fromList.id,
                pinCode: fromList.pinCode,
                cityName: fromList.cityName,
                areaName: fromList.areaName,
            }
        }
        if (initialData?.serviceablePincodeId === selectedPincodeId && initialData.serviceablePincode) {
            const pin = initialData.serviceablePincode
            return {
                id: pin.id,
                pinCode: pin.pinCode,
                cityName: pin.cityName,
                areaName: pin.areaName ?? '',
            }
        }
        return null
    }, [initialData, pickedPincode, pincodeOptions, selectedPincodeId])

    const selectedService = useMemo(() => {
        if (selectedServiceMapId == null) return null
        if (pickedService && pickedService.id === selectedServiceMapId) return pickedService
        const fromList = serviceMapOptions.find((s) => s.id === selectedServiceMapId)
        if (fromList) {
            return {
                id: fromList.id,
                serviceType: fromList.serviceType ?? `Service #${fromList.id}`,
            }
        }
        if (initialData?.serviceMapId === selectedServiceMapId && initialData.serviceMap) {
            return {
                id: initialData.serviceMap.id,
                serviceType: initialData.serviceMap.serviceType ?? `Service #${initialData.serviceMap.id}`,
            }
        }
        return null
    }, [initialData, pickedService, selectedServiceMapId, serviceMapOptions])

    const selectedZone = useMemo(() => {
        if (pickedZone && pickedZone.id === selectedZoneId) return pickedZone
        const fromOptions = zoneOptions.find((z) => z.id === selectedZoneId)
        if (fromOptions) return fromOptions
        if (initialData?.zoneId === selectedZoneId && initialData.zone) {
            return initialData.zone
        }
        return null
    }, [initialData, pickedZone, selectedZoneId, zoneOptions])

    useEffect(() => {
        if (!vendorOpen) setVendorSearch('')
    }, [vendorOpen])

    useEffect(() => {
        if (!pincodeOpen) setPincodeSearch('')
    }, [pincodeOpen])

    useEffect(() => {
        if (!zoneOpen) setZoneSearch('')
    }, [zoneOpen])

    useEffect(() => {
        // Changing vendor clears service unless it still belongs to the new vendor list.
        if (!(selectedVendorId > 0)) {
            form.setValue('serviceMapId', null)
            setPickedService(null)
            return
        }
        if (selectedServiceMapId == null) return
        const stillValid = (serviceMapsData?.data ?? []).some((s) => s.id === selectedServiceMapId)
        if (!stillValid && pickedService?.id !== selectedServiceMapId) {
            form.setValue('serviceMapId', null)
            setPickedService(null)
        }
    }, [form, pickedService?.id, selectedServiceMapId, selectedVendorId, serviceMapsData?.data])

    useEffect(() => {
        if (!initialData) return
        form.reset({
            vendorId: initialData.vendorId ?? 0,
            serviceablePincodeId: initialData.serviceablePincodeId ?? 0,
            serviceMapId: initialData.serviceMapId ?? null,
            zoneId: initialData.zoneId ?? 0,
            serviceable: initialData.serviceable ?? true,
            edl: Boolean(initialData.edl),
            odaEdlDistanceKm: formatDistanceInitial(initialData.odaEdlDistanceKm),
        })
        if (initialData.vendor) {
            setPickedVendor({
                id: initialData.vendorId,
                vendorName: initialData.vendor.vendorName,
                vendorCode: initialData.vendor.vendorCode,
            })
        }
        if (initialData.serviceablePincode) {
            setPickedPincode({
                id: initialData.serviceablePincodeId,
                pinCode: initialData.serviceablePincode.pinCode ?? initialData.pinCode ?? '',
                cityName: initialData.serviceablePincode.cityName ?? initialData.cityName ?? '',
                areaName: initialData.serviceablePincode.areaName ?? initialData.areaName ?? '',
            })
        }
        if (initialData.serviceMapId && initialData.serviceMap) {
            setPickedService({
                id: initialData.serviceMapId,
                serviceType: initialData.serviceMap.serviceType ?? `Service #${initialData.serviceMapId}`,
            })
        } else {
            setPickedService(null)
        }
        if (initialData.zone) {
            setPickedZone({
                id: initialData.zone.id,
                name: initialData.zone.name,
                code: initialData.zone.code,
            })
        }
    }, [form, initialData])

    const mutation = useMutation({
        mutationFn: (data: FormValues) => {
            const payload: VendorServiceablePincodeFormData = {
                vendorId: data.vendorId,
                serviceablePincodeId: data.serviceablePincodeId,
                serviceMapId: data.serviceMapId ?? null,
                zoneId: data.zoneId,
                serviceable: data.serviceable,
                edl: data.edl,
            }
            const odaKm = data.odaEdlDistanceKm?.trim()
            if (odaKm) {
                payload.odaEdlDistanceKm = Number(odaKm)
            }

            if (isEdit && initialData) {
                return vendorServiceablePincodeService.updateVendorServiceablePincode(initialData.id, payload)
            }
            return vendorServiceablePincodeService.createVendorServiceablePincode(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-serviceable-pincodes'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['vendor-serviceable-pincode', initialData.id] })
            }
            toast.success(`Vendor pincode ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/utilities/vendor-serviceable-pincodes')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} vendor pincode`)
        },
    })

    function onSubmit(data: FormValues) {
        mutation.mutate(data)
    }

    const isZonesFetching = isVendorZonesFetching

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="vendorId"
                        render={({ field }) => (
                            <FloatingFormItem required label="Vendor">
                                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground",
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedVendor
                                                        ? `${selectedVendor.vendorName} (${selectedVendor.vendorCode})`
                                                        : "Search vendor"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search vendor..."
                                                value={vendorSearch}
                                                onValueChange={setVendorSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No vendor found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {vendorOptions.map((vendor) => (
                                                        <CommandItem
                                                            key={vendor.id}
                                                            value={`${vendor.vendorName} ${vendor.vendorCode}`}
                                                            onSelect={() => {
                                                                field.onChange(vendor.id)
                                                                setPickedVendor({
                                                                    id: vendor.id,
                                                                    vendorName: vendor.vendorName,
                                                                    vendorCode: vendor.vendorCode,
                                                                })
                                                                form.setValue('serviceMapId', null)
                                                                setPickedService(null)
                                                                setVendorOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    vendor.id === field.value ? "opacity-100" : "opacity-0",
                                                                )}
                                                            />
                                                            {vendor.vendorName} ({vendor.vendorCode})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {isVendorsFetching ? (
                                                    <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading vendors...
                                                    </div>
                                                ) : null}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceablePincodeId"
                        render={({ field }) => (
                            <FloatingFormItem required label="Master Pincode">
                                <Popover open={pincodeOpen} onOpenChange={setPincodeOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground",
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedPincode
                                                        ? `${selectedPincode.pinCode} — ${selectedPincode.cityName}${selectedPincode.areaName ? `, ${selectedPincode.areaName}` : ''}`
                                                        : "Search master pincode"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search pincode..."
                                                value={pincodeSearch}
                                                onValueChange={setPincodeSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No pincode found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {pincodeOptions.map((pin) => (
                                                        <CommandItem
                                                            key={pin.id}
                                                            value={`${pin.pinCode} ${pin.cityName} ${pin.areaName}`}
                                                            onSelect={() => {
                                                                field.onChange(pin.id)
                                                                setPickedPincode({
                                                                    id: pin.id,
                                                                    pinCode: pin.pinCode,
                                                                    cityName: pin.cityName,
                                                                    areaName: pin.areaName,
                                                                })
                                                                setPincodeOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    pin.id === field.value ? "opacity-100" : "opacity-0",
                                                                )}
                                                            />
                                                            {pin.pinCode} — {pin.cityName}
                                                            {pin.areaName ? `, ${pin.areaName}` : ''}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {isPincodesFetching ? (
                                                    <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading pincodes...
                                                    </div>
                                                ) : null}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceMapId"
                        render={({ field }) => (
                            <FloatingFormItem label="Vendor Service (optional)">
                                <Popover open={serviceOpen} onOpenChange={setServiceOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!(selectedVendorId > 0)}
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    field.value == null && "text-muted-foreground",
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedService
                                                        ? selectedService.serviceType
                                                        : selectedVendorId > 0
                                                          ? "All services"
                                                          : "Select vendor first"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search service..." />
                                            <CommandList>
                                                <CommandEmpty>No service found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    <CommandItem
                                                        value="all-services"
                                                        onSelect={() => {
                                                            field.onChange(null)
                                                            setPickedService(null)
                                                            setServiceOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                field.value == null ? "opacity-100" : "opacity-0",
                                                            )}
                                                        />
                                                        All services
                                                    </CommandItem>
                                                    {serviceMapOptions.map((sm) => (
                                                        <CommandItem
                                                            key={sm.id}
                                                            value={`${sm.serviceType ?? ''} ${sm.id}`}
                                                            onSelect={() => {
                                                                field.onChange(sm.id)
                                                                setPickedService({
                                                                    id: sm.id,
                                                                    serviceType: sm.serviceType ?? `Service #${sm.id}`,
                                                                })
                                                                setServiceOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    sm.id === field.value ? "opacity-100" : "opacity-0",
                                                                )}
                                                            />
                                                            {sm.serviceType || `Service #${sm.id}`}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {isServiceMapsFetching ? (
                                                    <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading services...
                                                    </div>
                                                ) : null}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="zoneId"
                        render={({ field }) => (
                            <FloatingFormItem required label="Zone">
                                <Popover open={zoneOpen} onOpenChange={setZoneOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !selectedZone && "text-muted-foreground",
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedZone
                                                        ? `${selectedZone.name} (${selectedZone.code})`
                                                        : "Search zone"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search zone..."
                                                value={zoneSearch}
                                                onValueChange={setZoneSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No zones found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {zoneOptions.map((zone) => (
                                                        <CommandItem
                                                            key={zone.id}
                                                            value={`${zone.name} ${zone.code}`}
                                                            onSelect={() => {
                                                                field.onChange(zone.id)
                                                                setPickedZone({
                                                                    id: zone.id,
                                                                    name: zone.name,
                                                                    code: zone.code,
                                                                })
                                                                setZoneOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value === zone.id ? "opacity-100" : "opacity-0",
                                                                )}
                                                            />
                                                            {zone.name} ({zone.code})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {isZonesFetching ? (
                                                    <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading zones...
                                                    </div>
                                                ) : null}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="odaEdlDistanceKm"
                        render={({ field }) => (
                            <FloatingFormItem label="EDL distance (km)">
                                <FormControl>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Optional"
                                        {...field}
                                        value={field.value ?? ''}
                                        className={FLOATING_INNER_CONTROL}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-2 md:col-span-2">
                        <FormField
                            control={form.control}
                            name="serviceable"
                            render={({ field }) => (
                                <FloatingFormItem label="Serviceable" itemClassName="flex-1">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(Boolean(v))}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="edl"
                            render={({ field }) => (
                                <FloatingFormItem label="EDL (extended delivery)" itemClassName="flex-1">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(Boolean(v))}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push('/utilities/vendor-serviceable-pincodes')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Vendor Pincode" : "Create Vendor Pincode"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
