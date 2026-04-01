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
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
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
import { zoneService } from '@/services/masters/zone-service'
import { State, StateFormData } from '@/types/masters/state'

const stateSchema = z.object({
    stateCode: z.string().min(2, "State code must be at least 2 characters"),
    stateName: z.string().min(3, "State name must be at least 3 characters"),
    productType: z.string().min(1, "Product type is required"),
    zoneId: z.number().min(1, "Zone is required"),
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

    const { data: zonesData } = useQuery({
        queryKey: ['zones-list'],
        queryFn: () => zoneService.getZones({ limit: 100 }),
    })

    const form = useForm<StateFormData>({
        resolver: zodResolver(stateSchema) as Resolver<StateFormData>,
        defaultValues: {
            stateCode: initialData?.stateCode || '',
            stateName: initialData?.stateName || '',
            productType: initialData?.productType || 'DOMESTIC',
            zoneId: initialData?.zoneId || 0,
            gstAlias: initialData?.gstAlias || '',
            unionTerritory: initialData?.unionTerritory || false,
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                stateCode: initialData.stateCode,
                stateName: initialData.stateName,
                productType: initialData.productType,
                zoneId: initialData.zoneId,
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
                        name="stateCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. DL, MH" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="gstAlias"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>GST Alias</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 07, 27" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="stateName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>State Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Delhi, Maharashtra" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="productType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                        <SelectItem value="INTERNATIONAL">International</SelectItem>
                                        <SelectItem value="LOCAL">Local</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="zoneId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone</FormLabel>
                                <Select
                                    onValueChange={(val) => field.onChange(parseInt(val))}
                                    value={field.value ? field.value.toString() : ""}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select zone" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {zonesData?.data?.map((zone) => (
                                            <SelectItem key={zone.id} value={zone.id.toString()}>
                                                {zone.name} ({zone.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="unionTerritory"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Union Territory
                                </FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
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
