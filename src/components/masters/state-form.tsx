"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { stateService } from '@/services/masters/state-service'
import { countryService } from '@/services/masters/country-service'
import { State, StateFormData } from '@/types/masters/state'
const stateSchema = z.object({
    countryId: z.number().min(1, "Country is required"),
    stateName: z.string().min(3, "State name must be at least 3 characters"),
    gstAlias: z.string().min(2, "GST Alias is required"),
    unionTerritory: z.boolean(),
})

interface StateFormProps {
    initialData?: State | null
}

export function StateForm({ initialData }: StateFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const { data: countriesData } = useQuery({
        queryKey: ['countries-list'],
        queryFn: () => countryService.getCountries({ limit: 100 }),
    })

    const form = useForm<StateFormData>({
        resolver: zodResolver(stateSchema) as Resolver<StateFormData>,
        defaultValues: {
            countryId: initialData?.countryId || 0,
            stateName: initialData?.stateName || '',
            gstAlias: initialData?.gstAlias || '',
            unionTerritory: initialData?.unionTerritory || false,
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                countryId: initialData.countryId,
                stateName: initialData.stateName,
                gstAlias: initialData.gstAlias,
                unionTerritory: initialData.unionTerritory,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: StateFormData) => {
            if (isEdit && initialData) {
                return stateService.updateState(initialData.id, data)
            }
            return stateService.createState(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['states'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['state', initialData.id] })
            }
            toast.success(`State ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/states')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} state`)
        }
    })

    function onSubmit(data: StateFormData) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="gstAlias"
                        render={({ field }) => (
                            <FloatingFormItem label="GST Alias">
                                <FormControl>
                                    <Input placeholder="e.g. 07, 27" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="stateName"
                    render={({ field }) => (
                        <FloatingFormItem label="State Name">
                            <FormControl>
                                <Input placeholder="e.g. Delhi, Maharashtra" {...field} className={FLOATING_INNER_CONTROL} />
                            </FormControl>
                        </FloatingFormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="countryId"
                    render={({ field }) => (
                        <FloatingFormItem label="Country*">
                            <Select
                                onValueChange={(val) => field.onChange(parseInt(val))}
                                value={field.value ? field.value.toString() : ""}
                            >
                                <FormControl>
                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {countriesData?.data?.map((country) => (
                                        <SelectItem key={country.id} value={country.id.toString()}>
                                            {country.name} ({country.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FloatingFormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="unionTerritory"
                    render={({ field }) => (
                        <FloatingFormItem label="Union Territory">
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

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/states')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? "Update State" : "Create State"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
