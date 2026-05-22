"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormField } from "@/components/ui/form"
import { FloatingFormItem, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cityService } from "@/services/masters/city-service"
import { stateService } from "@/services/masters/state-service"
import { City, CityFormData } from "@/types/masters/city"
import type { Country } from "@/types/masters/country"
import { CountryFloatingAsyncSelect } from "@/components/masters/floating-master-async-selects"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"

const citySchema = z.object({
    countryId: z.number().min(1, "Country is required"),
    stateId: z.number().min(1, "State is required"),
    cityName: z.string().min(2, "City name must be at least 2 characters"),
})

interface CityFormProps {
    initialData?: City | null
}

export function CityForm({ initialData }: CityFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [stateOpen, setStateOpen] = useState(false)
    const [stateSearch, setStateSearch] = useState("")
    const debouncedStateSearch = useDebounce(stateSearch, 300)

    const extraCountries = useMemo((): Country[] | undefined => {
        const c = initialData?.country
        if (!c || !initialData?.countryId) return undefined
        return [{ id: c.id, code: c.code, name: c.name, weightUnit: "KGS" as const }]
    }, [initialData?.country, initialData?.countryId])

    const form = useForm<CityFormData>({
        resolver: zodResolver(citySchema) as Resolver<CityFormData>,
        defaultValues: {
            countryId: initialData?.countryId || 0,
            stateId: initialData?.stateId || 0,
            cityName: initialData?.cityName || "",
        },
    })

    const selectedCountryId = form.watch("countryId")

    const { data: statesData, isFetching: isStatesFetching } = useQuery({
        queryKey: ["states-list-city-form", selectedCountryId, debouncedStateSearch],
        queryFn: () =>
            stateService.getStates({
                limit: 50,
                search: debouncedStateSearch,
                sortBy: "stateName",
                sortOrder: "asc",
            }),
        enabled: !!selectedCountryId && (stateOpen || !!initialData?.stateId),
        staleTime: 5 * 60 * 1000,
    })

    const stateOptions = useMemo(
        () =>
            (statesData?.data ?? []).filter(
                (state) => !selectedCountryId || state.countryId === selectedCountryId,
            ),
        [selectedCountryId, statesData?.data],
    )

    const selectedStateId = form.watch("stateId")
    const selectedState = useMemo(() => {
        const fromList = stateOptions.find((s) => s.id === selectedStateId)
        if (fromList) return fromList
        if (initialData?.stateId === selectedStateId && initialData.state) {
            return { id: initialData.stateId, stateName: initialData.state.stateName, countryId: initialData.countryId }
        }
        return null
    }, [initialData, selectedStateId, stateOptions])

    useEffect(() => {
        if (initialData) {
            form.reset({
                countryId: initialData.countryId,
                stateId: initialData.stateId,
                cityName: initialData.cityName,
            })
        }
    }, [initialData, form])

    useEffect(() => {
        if (!selectedCountryId) return
        const sid = form.getValues("stateId")
        if (!sid) return
        const ok = stateOptions.some((s) => s.id === sid && s.countryId === selectedCountryId)
        if (!ok && stateOptions.length > 0) {
            form.setValue("stateId", 0, { shouldValidate: true })
        }
    }, [form, selectedCountryId, stateOptions])

    const mutation = useMutation({
        mutationFn: (data: CityFormData) => {
            if (isEdit && initialData) {
                return cityService.updateCity(initialData.id, data)
            }
            return cityService.createCity(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cities"] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ["city", initialData.id] })
            }
            toast.success(`City ${isEdit ? "updated" : "created"} successfully`)
            router.push("/masters/cities")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} city`)
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="countryId"
                        render={({ field }) => (
                            <FloatingFormItem required label="Country*">
                                <CountryFloatingAsyncSelect
                                    triggerRef={field.ref}
                                    value={field.value}
                                    onChange={field.onChange}
                                    queryKeyScope={`city-${String(initialData?.id ?? "new")}`}
                                    extraCountries={extraCountries}
                                />
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="stateId"
                        render={({ field }) => (
                            <FloatingFormItem required label="State*">
                                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                disabled={!selectedCountryId}
                                                className={cn(
                                                    FLOATING_INNER_CONTROL,
                                                    "w-full justify-between font-normal",
                                                    !field.value && "text-muted-foreground",
                                                )}
                                            >
                                                {selectedState?.stateName || "Select state"}
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
                                                {isStatesFetching ? (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
                                                ) : (
                                                    <>
                                                        <CommandEmpty>No state found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {stateOptions.map((state) => (
                                                                <CommandItem
                                                                    key={state.id}
                                                                    value={String(state.id)}
                                                                    onSelect={() => {
                                                                        field.onChange(state.id)
                                                                        setStateOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === state.id ? "opacity-100" : "opacity-0",
                                                                        )}
                                                                    />
                                                                    {state.stateName}
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
                        name="cityName"
                        render={({ field }) => (
                            <FloatingFormItem required label="City Name*">
                                <FormControl>
                                    <Input className={FLOATING_INNER_CONTROL} {...field} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push("/masters/cities")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
