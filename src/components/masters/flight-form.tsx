"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { flightService } from '@/services/masters/flight-service'
import { Flight, FlightFormData } from '@/types/masters/flight'

const flightSchema = z.object({
    flightCode: z.string().min(2, "Flight code must be at least 2 characters"),
    flightName: z.string().min(3, "Flight name must be at least 3 characters"),
    flightType: z.string().min(1, "Flight type is required"),
})

interface FlightFormProps {
    initialData?: Flight | null
}

export function FlightForm({ initialData }: FlightFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<FlightFormData>({
        resolver: zodResolver(flightSchema),
        defaultValues: {
            flightCode: initialData?.flightCode || '',
            flightName: initialData?.flightName || '',
            flightType: initialData?.flightType || 'PRIME',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                flightCode: initialData.flightCode,
                flightName: initialData.flightName,
                flightType: initialData.flightType,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: FlightFormData) => {
            if (isEdit && initialData) {
                return flightService.updateFlight(initialData.id, data)
            }
            return flightService.createFlight(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flights'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['flight', initialData.id] })
            }
            toast.success(`Flight ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/flights')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} flight`)
        }
    })

    function onSubmit(data: FlightFormData) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="flightCode"
                    render={({ field }) => (
                        <FloatingFormItem label="Flight Code">
                            <FormControl>
                                <Input placeholder="e.g. 6E101, AI201" {...field} className={FLOATING_INNER_CONTROL} />
                            </FormControl>
                        </FloatingFormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="flightName"
                    render={({ field }) => (
                        <FloatingFormItem label="Flight Name">
                            <FormControl>
                                <Input placeholder="e.g. IndiGo Prime 101" {...field} className={FLOATING_INNER_CONTROL} />
                            </FormControl>
                        </FloatingFormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="flightType"
                    render={({ field }) => (
                        <FloatingFormItem label="Flight Type">
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PRIME">Prime</SelectItem>
                                    <SelectItem value="GCR">GCR</SelectItem>
                                </SelectContent>
                            </Select>
                        </FloatingFormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/flights')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Flight" : "Create Flight"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
