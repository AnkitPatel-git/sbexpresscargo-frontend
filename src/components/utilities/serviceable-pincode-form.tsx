"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
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
import { Badge } from "@/components/ui/badge"
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { countryService } from '@/services/masters/country-service'
import { stateService } from '@/services/masters/state-service'
import { zoneService } from '@/services/masters/zone-service'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { ServiceablePincode, type ServiceablePincodeFormData } from '@/types/utilities/serviceable-pincode'

const pincodeSchema = z.object({
    countryId: z.number().min(1, "Country is required"),
    countryCode: z.string().min(1, "Country code is required"),
    stateId: z.number().min(1, "State is required"),
    zoneIds: z.array(z.number()).min(1, "At least one zone is required"),
    pinCode: z.string().min(1, "Pin Code is required"),
    cityName: z.string().min(1, "City Name is required"),
    areaName: z.string().min(1, "Area Name is required"),
    serviceable: z.boolean(),
    oda: z.boolean(),
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
    const [zoneOpen, setZoneOpen] = useState(false)
    const [countrySearch, setCountrySearch] = useState('')
    const [stateSearch, setStateSearch] = useState('')
    const [zoneSearch, setZoneSearch] = useState('')

    const debouncedCountrySearch = useDebounce(countrySearch, 300)
    const debouncedStateSearch = useDebounce(stateSearch, 300)
    const debouncedZoneSearch = useDebounce(zoneSearch, 300)

    const { data: countriesData } = useQuery({
        queryKey: ['countries-list', debouncedCountrySearch],
        queryFn: () => countryService.getCountries({ limit: 25, search: debouncedCountrySearch, sortBy: 'name', sortOrder: 'asc' }),
        enabled: countryOpen || !!initialData?.countryId,
        staleTime: 5 * 60 * 1000,
    })

    const defaultZoneIds = useMemo(() => {
        if (!initialData) return []
        if (initialData.zoneIds?.length) return initialData.zoneIds
        return initialData.zones?.map((z) => z.id) ?? []
    }, [initialData])

    const form = useForm<PincodeFormValues>({
        resolver: zodResolver(pincodeSchema),
        defaultValues: {
            countryId: initialData?.countryId ?? 0,
            countryCode: initialData?.country?.code ?? '',
            stateId: initialData?.stateId ?? 0,
            zoneIds: defaultZoneIds,
            pinCode: initialData?.pinCode ?? '',
            cityName: initialData?.cityName ?? '',
            areaName: initialData?.areaName ?? '',
            serviceable: initialData?.serviceable ?? true,
            oda: initialData?.oda ?? false,
        },
    })

    const selectedCountryId = useWatch({
        control: form.control,
        name: 'countryId',
    })

    const selectedZoneIds = useWatch({
        control: form.control,
        name: 'zoneIds',
    })

    const { data: statesData, isFetching: isStatesFetching } = useQuery({
        queryKey: ['states-list', selectedCountryId, debouncedStateSearch],
        queryFn: () => stateService.getStates({ limit: 25, search: debouncedStateSearch, sortBy: 'stateName', sortOrder: 'asc' }),
        enabled: !!selectedCountryId && (stateOpen || !!initialData?.stateId),
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
    const zoneOptions = useMemo(() => zonesData?.data ?? [], [zonesData?.data])

    const selectedCountry = useMemo(() => {
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
    }, [countryOptions, initialData, selectedCountryId])

    const selectedState = useMemo(() => {
        const selectedStateId = form.getValues('stateId')
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
    }, [form, initialData, stateOptions])

    const selectedZones = useMemo(() => {
        const zoneMap = new Map(zoneOptions.map((zone) => [zone.id, zone]))
        return selectedZoneIds.map((zoneId) => {
            const fromOptions = zoneMap.get(zoneId)
            if (fromOptions) return fromOptions
            return initialData?.zones?.find((zone) => zone.id === zoneId)
        }).filter((zone): zone is NonNullable<typeof zone> => Boolean(zone))
    }, [initialData?.zones, selectedZoneIds, zoneOptions])

    useEffect(() => {
        if (!selectedCountryId) return

        const selectedStateId = form.getValues('stateId')
        if (!selectedStateId) return

        const stateBelongsToCountry = stateOptions.some(
            (state) => state.id === selectedStateId && state.countryId === selectedCountryId
        )

        if (!stateBelongsToCountry) {
            form.setValue('stateId', 0, { shouldValidate: true })
        }
    }, [form, selectedCountryId, stateOptions])

    useEffect(() => {
        if (!countryOpen) setCountrySearch('')
    }, [countryOpen])

    useEffect(() => {
        if (!stateOpen) setStateSearch('')
    }, [stateOpen])

    useEffect(() => {
        if (!zoneOpen) setZoneSearch('')
    }, [zoneOpen])

    function toggleZone(zoneId: number) {
        const currentZoneIds = form.getValues('zoneIds')
        if (currentZoneIds.includes(zoneId)) {
            form.setValue('zoneIds', currentZoneIds.filter((id) => id !== zoneId), { shouldValidate: true })
            return
        }
        form.setValue('zoneIds', [...currentZoneIds, zoneId], { shouldValidate: true })
    }

    const mutation = useMutation({
        mutationFn: (data: PincodeFormValues) => {
            const payload: ServiceablePincodeFormData = {
                countryId: data.countryId,
                countryCode: data.countryCode,
                stateId: data.stateId,
                zoneIds: data.zoneIds,
                pinCode: data.pinCode,
                cityName: data.cityName,
                areaName: data.areaName,
                serviceable: data.serviceable,
                oda: data.oda,
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
                            <FloatingFormItem label="Country">
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
                            <FloatingFormItem label="State">
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
                            <FloatingFormItem label="Pin Code">
                                <FormControl>
                                    <Input placeholder="e.g. 452001" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="cityName"
                        render={({ field }) => (
                            <FloatingFormItem label="City Name">
                                <FormControl>
                                    <Input placeholder="e.g. Indore" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="areaName"
                        render={({ field }) => (
                            <FloatingFormItem label="Area Name">
                                <FormControl>
                                    <Input placeholder="e.g. Indore City" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="zoneIds"
                        render={({ field }) => (
                            <FloatingFormItem label="Zones">
                                <Popover open={zoneOpen} onOpenChange={setZoneOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    field.value.length === 0 && "text-muted-foreground"
                                                )}
                                            >
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedZones.length > 0 ? (
                                                        selectedZones.map((zone) => (
                                                            <Badge
                                                                variant="secondary"
                                                                key={zone.id}
                                                                className="mr-1 mb-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleZone(zone.id)
                                                                }}
                                                            >
                                                                {zone.name} ({zone.code})
                                                                <X className="ml-1 h-3 w-3 text-muted-foreground" />
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span>Select zones</span>
                                                    )}
                                                </div>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search zones..."
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
                                                            onSelect={() => toggleZone(zone.id)}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                    field.value.includes(zone.id)
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "opacity-50 [&_svg]:invisible"
                                                                )}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </div>
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

                    <div className="flex flex-col sm:flex-row gap-4 pt-2 md:col-span-2">
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
                            name="oda"
                            render={({ field }) => (
                                <FloatingFormItem label="ODA" itemClassName="flex-1">
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
