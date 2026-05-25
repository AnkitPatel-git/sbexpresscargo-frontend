"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
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
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { countryService } from '@/services/masters/country-service'
import { stateService } from '@/services/masters/state-service'
import { cityService } from '@/services/masters/city-service'
import { zoneService } from '@/services/masters/zone-service'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { ServiceablePincode, type ServiceablePincodeFormData } from '@/types/utilities/serviceable-pincode'

const pincodeSchema = z.object({
    countryId: z.number().min(1, "Country is required"),
    countryCode: z.string().min(1, "Country code is required"),
    stateId: z.number().min(1, "State is required"),
    zoneIds: z.array(z.number()).length(1, "Zone is required"),
    pinCode: z.string().min(1, "Pin Code is required"),
    cityId: z.number().min(1, "City is required"),
    areaName: z.string().min(1, "Area Name is required"),
    serviceable: z.boolean(),
    edl: z.boolean(),
    odaEdlDistanceKm: z
        .string()
        .optional()
        .refine(
            (s) => !s?.trim() || (!Number.isNaN(Number(s)) && Number(s) >= 0),
            { message: 'EDL distance must be a number ≥ 0' },
        ),
    tatWorkingDays: z
        .string()
        .optional()
        .refine(
            (s) =>
                !s?.trim() ||
                (!Number.isNaN(Number(s)) && Number(s) >= 0 && Number.isInteger(Number(s))),
            { message: 'TAT must be a whole number ≥ 0' },
        ),
    embargo: z.boolean().optional(),
})

type PincodeFormValues = z.infer<typeof pincodeSchema>

interface ServiceablePincodeFormProps {
    initialData?: ServiceablePincode | null
}

export function ServiceablePincodeForm({ initialData }: ServiceablePincodeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [countryOpen, setCountryOpen] = useState(false)
    const [stateOpen, setStateOpen] = useState(false)
    const [cityOpen, setCityOpen] = useState(false)
    const [zoneOpen, setZoneOpen] = useState(false)
    const [countrySearch, setCountrySearch] = useState('')
    const [stateSearch, setStateSearch] = useState('')
    const [citySearch, setCitySearch] = useState('')
    const [zoneSearch, setZoneSearch] = useState('')

    const [pickedCountry, setPickedCountry] = useState<{
        id: number
        name: string
        code: string
    } | null>(() =>
        initialData?.country && initialData.countryId
            ? {
                  id: initialData.countryId,
                  name: initialData.country.name,
                  code: initialData.country.code,
              }
            : null,
    )
    const [pickedState, setPickedState] = useState<{ id: number; stateName: string } | null>(() =>
        initialData?.state && initialData.stateId
            ? { id: initialData.stateId, stateName: initialData.state.stateName }
            : null,
    )
    const [pickedCity, setPickedCity] = useState<{ id: number; cityName: string } | null>(() =>
        initialData?.cityId && (initialData.city?.cityName || initialData.cityName)
            ? {
                  id: initialData.cityId,
                  cityName: initialData.city?.cityName ?? initialData.cityName ?? '',
              }
            : null,
    )
    const [pickedZone, setPickedZone] = useState<{ id: number; name: string; code: string } | null>(() => {
        const z = initialData?.zones?.[0]
        if (!z) return null
        return { id: z.id, name: z.name, code: z.code }
    })

    const debouncedCountrySearch = useDebounce(countrySearch, 300)
    const debouncedStateSearch = useDebounce(stateSearch, 300)
    const debouncedCitySearch = useDebounce(citySearch, 300)
    const debouncedZoneSearch = useDebounce(zoneSearch, 300)

    const defaultZoneIds = useMemo(() => {
        if (!initialData) return []
        if (initialData.zoneIds?.length) return [initialData.zoneIds[0]]
        const fromZones = initialData.zones?.map((z) => z.id) ?? []
        return fromZones.length ? [fromZones[0]] : []
    }, [initialData])

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

    const form = useForm<PincodeFormValues>({
        resolver: zodResolver(pincodeSchema),
        defaultValues: {
            countryId: initialData?.countryId ?? 0,
            countryCode: initialData?.country?.code ?? '',
            stateId: initialData?.stateId ?? 0,
            zoneIds: defaultZoneIds,
            pinCode: initialData?.pinCode ?? '',
            cityId: initialData?.cityId ?? initialData?.city?.id ?? 0,
            areaName: initialData?.areaName ?? '',
            serviceable: initialData?.serviceable ?? true,
            edl: Boolean(initialData?.edl) || Boolean(initialData?.oda),
            odaEdlDistanceKm: formatDistanceInitial(initialData?.odaEdlDistanceKm),
            tatWorkingDays: initialData?.tatWorkingDays != null ? String(initialData.tatWorkingDays) : '',
            embargo: initialData?.embargo ?? false,
        },
    })

    const selectedCountryId = useWatch({
        control: form.control,
        name: 'countryId',
    })

    const selectedStateId = useWatch({
        control: form.control,
        name: 'stateId',
    })

    const selectedZoneIds = useWatch({
        control: form.control,
        name: 'zoneIds',
    })

    const selectedCityId = useWatch({
        control: form.control,
        name: 'cityId',
    })

    const { data: countriesData } = useQuery({
        queryKey: ['countries-list', debouncedCountrySearch],
        queryFn: () => countryService.getCountries({ limit: 25, search: debouncedCountrySearch, sortBy: 'name', sortOrder: 'asc' }),
        enabled: countryOpen || !!selectedCountryId,
        staleTime: 5 * 60 * 1000,
    })

    const { data: statesData, isFetching: isStatesFetching } = useQuery({
        queryKey: ['states-list', selectedCountryId, debouncedStateSearch],
        queryFn: () => stateService.getStates({ limit: 25, search: debouncedStateSearch, sortBy: 'stateName', sortOrder: 'asc' }),
        enabled: !!selectedCountryId && (stateOpen || !!selectedStateId),
        staleTime: 5 * 60 * 1000,
    })

    const { data: citiesData, isFetching: isCitiesFetching } = useQuery({
        queryKey: ['cities-list-pincode', selectedCountryId, selectedStateId, debouncedCitySearch],
        queryFn: () =>
            cityService.getCities({
                limit: 50,
                search: debouncedCitySearch,
                sortBy: 'cityName',
                sortOrder: 'asc',
                countryId: selectedCountryId || undefined,
                stateId: selectedStateId || undefined,
            }),
        enabled: !!selectedCountryId && !!selectedStateId && (cityOpen || !!selectedCityId),
        staleTime: 5 * 60 * 1000,
    })

    const { data: zonesData, isFetching: isZonesFetching } = useQuery({
        queryKey: ['zones-list', selectedCountryId, debouncedZoneSearch],
        queryFn: () => zoneService.getZones({
            limit: 25,
            search: debouncedZoneSearch,
            sortBy: 'name',
            sortOrder: 'asc',
            zoneType: 'DOMESTIC',
            countryId: selectedCountryId || undefined,
        }),
        enabled: zoneOpen || selectedZoneIds.length > 0,
        staleTime: 5 * 60 * 1000,
    })

    const countryOptions = useMemo(() => countriesData?.data ?? [], [countriesData?.data])
    const stateOptions = useMemo(
        () => (statesData?.data ?? []).filter((state) => !selectedCountryId || state.countryId === selectedCountryId),
        [selectedCountryId, statesData?.data]
    )
    const cityOptions = useMemo(() => citiesData?.data ?? [], [citiesData?.data])
    const zoneOptions = useMemo(() => zonesData?.data ?? [], [zonesData?.data])

    const selectedCity = useMemo(() => {
        if (pickedCity && pickedCity.id === selectedCityId) {
            return pickedCity
        }
        const fromList = cityOptions.find((c) => c.id === selectedCityId)
        if (fromList) return fromList
        if (initialData?.cityId === selectedCityId && initialData.city) {
            return { id: initialData.cityId!, cityName: initialData.city.cityName }
        }
        if (initialData?.cityId === selectedCityId && initialData.cityName) {
            return { id: initialData.cityId!, cityName: initialData.cityName }
        }
        return null
    }, [cityOptions, initialData, pickedCity, selectedCityId])

    const selectedCountry = useMemo(() => {
        if (pickedCountry && pickedCountry.id === selectedCountryId) {
            return pickedCountry
        }
        if (countryOptions.length > 0) {
            const country = countryOptions.find((item) => item.id === selectedCountryId)
            if (country) return country
        }
        if (initialData?.countryId === selectedCountryId && initialData.country) {
            return {
                id: initialData.countryId,
                code: initialData.country.code,
                name: initialData.country.name,
            }
        }
        return null
    }, [countryOptions, initialData, pickedCountry, selectedCountryId])

    const selectedState = useMemo(() => {
        if (pickedState && pickedState.id === selectedStateId) {
            return pickedState
        }
        if (stateOptions.length > 0) {
            const state = stateOptions.find((item) => item.id === selectedStateId)
            if (state) return state
        }
        if (initialData?.stateId === selectedStateId && initialData.state) {
            return {
                id: initialData.stateId,
                stateName: initialData.state.stateName,
            }
        }
        return null
    }, [initialData, pickedState, selectedStateId, stateOptions])

    const selectedZoneId = selectedZoneIds[0] ?? 0

    const selectedZone = useMemo(() => {
        if (pickedZone && pickedZone.id === selectedZoneId) {
            return pickedZone
        }
        const fromOptions = zoneOptions.find((zone) => zone.id === selectedZoneId)
        if (fromOptions) return fromOptions
        return initialData?.zones?.find((zone) => zone.id === selectedZoneId) ?? null
    }, [initialData?.zones, pickedZone, selectedZoneId, zoneOptions])

    useEffect(() => {
        if (!selectedCountryId) {
            setPickedCountry(null)
            setPickedState(null)
            setPickedCity(null)
            return
        }
        if (pickedCountry && pickedCountry.id !== selectedCountryId) {
            setPickedState(null)
            setPickedCity(null)
        }

        const sid = form.getValues('stateId')
        if (!sid) return

        const stateBelongsToCountry = stateOptions.some(
            (state) => state.id === sid && state.countryId === selectedCountryId,
        )

        if (!stateBelongsToCountry && stateOptions.length > 0) {
            form.setValue('stateId', 0, { shouldValidate: true })
            form.setValue('cityId', 0, { shouldValidate: true })
            setPickedState(null)
            setPickedCity(null)
        }
    }, [form, pickedCountry, selectedCountryId, stateOptions])

    useEffect(() => {
        if (!selectedStateId) return
        const cid = form.getValues('cityId')
        if (!cid) return
        const ok = cityOptions.some((c) => c.id === cid)
        if (!ok && cityOptions.length > 0) {
            form.setValue('cityId', 0, { shouldValidate: true })
        }
    }, [form, selectedStateId, cityOptions])

    useEffect(() => {
        if (!countryOpen) setCountrySearch('')
    }, [countryOpen])

    useEffect(() => {
        if (!stateOpen) setStateSearch('')
    }, [stateOpen])

    useEffect(() => {
        if (!cityOpen) setCitySearch('')
    }, [cityOpen])

    useEffect(() => {
        if (!zoneOpen) setZoneSearch('')
    }, [zoneOpen])

    useEffect(() => {
        if (!initialData) return
        form.reset({
            countryId: initialData.countryId ?? 0,
            countryCode: initialData.country?.code ?? '',
            stateId: initialData.stateId ?? 0,
            zoneIds: initialData.zoneIds?.length
                ? [initialData.zoneIds[0]]
                : initialData.zones?.length
                  ? [initialData.zones[0].id]
                  : [],
            pinCode: initialData.pinCode ?? '',
            cityId: initialData.cityId ?? initialData.city?.id ?? 0,
            areaName: initialData.areaName ?? '',
            serviceable: initialData.serviceable ?? true,
            edl: Boolean(initialData.edl) || Boolean(initialData.oda),
            odaEdlDistanceKm: formatDistanceInitial(initialData.odaEdlDistanceKm),
            tatWorkingDays: initialData.tatWorkingDays != null ? String(initialData.tatWorkingDays) : '',
            embargo: initialData.embargo ?? false,
        })
    }, [initialData])

    function selectZone(zoneId: number, zone?: { id: number; name: string; code: string }) {
        form.setValue('zoneIds', [zoneId], { shouldValidate: true })
        if (zone) {
            setPickedZone({ id: zone.id, name: zone.name, code: zone.code })
        }
        setZoneOpen(false)
    }

    const mutation = useMutation({
        mutationFn: (data: PincodeFormValues) => {
            const payload: ServiceablePincodeFormData = {
                countryId: data.countryId,
                countryCode: data.countryCode,
                stateId: data.stateId,
                zoneIds: data.zoneIds,
                pinCode: data.pinCode,
                cityId: data.cityId,
                areaName: data.areaName,
                serviceable: data.serviceable,
                edl: data.edl,
            }
            const odaKm = data.odaEdlDistanceKm?.trim()
            if (odaKm) {
                payload.odaEdlDistanceKm = Number(odaKm)
            }
            const tat = data.tatWorkingDays?.trim()
            if (tat) {
                payload.tatWorkingDays = Number(tat)
            }
            if (data.embargo !== undefined) {
                payload.embargo = data.embargo
            }

            if (isEdit && initialData) {
                return serviceablePincodeService.updateServiceablePincode(initialData.id, payload)
            }
            return serviceablePincodeService.createServiceablePincode(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['serviceable-pincode', initialData.id] })
            }
            toast.success(`Serviceable Pincode ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/utilities/serviceable-pincodes')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} serviceable pincode`)
        }
    })

    function onSubmit(data: PincodeFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="countryId"
                        render={({ field }) => (
                            <FloatingFormItem required label="Country">
                                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedCountry
                                                        ? `${selectedCountry.name} (${selectedCountry.code})`
                                                        : "Search country"}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search country..."
                                                value={countrySearch}
                                                onValueChange={setCountrySearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No country found.</CommandEmpty>
                                                <CommandGroup>
                                                    {countryOptions.map((country) => (
                                                        <CommandItem
                                                            key={country.id}
                                                            value={`${country.name} ${country.code}`}
                                                            onSelect={() => {
                                                                field.onChange(country.id)
                                                                form.setValue('countryCode', country.code, { shouldValidate: true })
                                                                setPickedCountry({
                                                                    id: country.id,
                                                                    name: country.name,
                                                                    code: country.code,
                                                                })
                                                                setPickedState(null)
                                                                setPickedCity(null)
                                                                form.setValue('stateId', 0, { shouldValidate: true })
                                                                form.setValue('cityId', 0, { shouldValidate: true })
                                                                setCountryOpen(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", country.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {country.name} ({country.code})
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {countryOpen && countriesData === undefined ? (
                                                    <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading countries...
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
                        name="stateId"
                        render={({ field }) => (
                            <FloatingFormItem required label="State">
                                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!selectedCountryId}
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {selectedState?.stateName ?? (selectedCountryId ? "Search state" : "Select country first")}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search state..."
                                                value={stateSearch}
                                                onValueChange={setStateSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>{selectedCountryId ? "No state found." : "Select country first."}</CommandEmpty>
                                                <CommandGroup>
                                                    {stateOptions.map((state) => (
                                                        <CommandItem
                                                            key={state.id}
                                                            value={state.stateName}
                                                            onSelect={() => {
                                                                field.onChange(state.id)
                                                                setPickedState({
                                                                    id: state.id,
                                                                    stateName: state.stateName,
                                                                })
                                                                setPickedCity(null)
                                                                form.setValue('cityId', 0, { shouldValidate: true })
                                                                setStateOpen(false)
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", state.id === field.value ? "opacity-100" : "opacity-0")} />
                                                            {state.stateName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                {isStatesFetching ? (
                                                    <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Loading states...
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
                        name="pinCode"
                        render={({ field }) => (
                            <FloatingFormItem required label="Pin Code">
                                <FormControl>
                                    <Input placeholder="e.g. 452001" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cityId"
                        render={({ field }) => (
                            <FloatingFormItem required label="City">
                                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                disabled={!selectedCountryId || !selectedStateId}
                                                className={cn(FLOATING_INNER_COMBO, 'w-full justify-between font-normal', !field.value && 'text-muted-foreground')}
                                            >
                                                {selectedCity?.cityName || 'Select city'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput placeholder="Search city..." value={citySearch} onValueChange={setCitySearch} />
                                            <CommandList>
                                                {isCitiesFetching ? (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No city found. Add it in City Master.</CommandEmpty>
                                                        <CommandGroup>
                                                            {cityOptions.map((city) => (
                                                                <CommandItem
                                                                    key={city.id}
                                                                    value={String(city.id)}
                                                                    onSelect={() => {
                                                                        field.onChange(city.id)
                                                                        setPickedCity({
                                                                            id: city.id,
                                                                            cityName: city.cityName,
                                                                        })
                                                                        setCityOpen(false)
                                                                    }}
                                                                >
                                                                    <Check className={cn('mr-2 h-4 w-4', field.value === city.id ? 'opacity-100' : 'opacity-0')} />
                                                                    {city.cityName}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </>
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="areaName"
                        render={({ field }) => (
                            <FloatingFormItem required label="Area Name">
                                <FormControl>
                                    <Input placeholder="e.g. Indore City" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
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

                    <FormField
                        control={form.control}
                        name="tatWorkingDays"
                        render={({ field }) => (
                            <FloatingFormItem label="TAT (working days)">
                                <FormControl>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Optional"
                                        {...field}
                                        value={field.value ?? ''}
                                        className={FLOATING_INNER_CONTROL}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="zoneIds"
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
                                                    !selectedZone && "text-muted-foreground"
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
                                                            onSelect={() => selectZone(zone.id, zone)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value[0] === zone.id ? "opacity-100" : "opacity-0"
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

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-2 md:col-span-2">
                        <FormField
                            control={form.control}
                            name="embargo"
                            render={({ field }) => (
                                <FloatingFormItem label="Embargo" itemClassName="flex-1 min-w-[140px]">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value ?? false}
                                                onCheckedChange={(v) => field.onChange(Boolean(v))}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />

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
                        onClick={() => router.push('/utilities/serviceable-pincodes')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Pincode" : "Create Pincode"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
