"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
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
import { countryService } from '@/services/masters/country-service'
import { Country, CountryFormData } from '@/types/masters/country'

const countrySchema = z.object({
    code: z.string().trim().min(2, "Country code must be at least 2 characters"),
    name: z.string().min(3, "Country name must be at least 3 characters"),
    weightUnit: z.string().min(1, "Weight unit is required"),
    currency: z.string().optional(),
    isdCode: z.string().optional(),
})

type CountryFormValues = z.infer<typeof countrySchema>

interface CountryFormProps {
    initialData?: Country | null
}

export function CountryForm({ initialData }: CountryFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<CountryFormValues>({
        resolver: zodResolver(countrySchema) as Resolver<CountryFormValues>,
        defaultValues: {
            code: initialData?.code?.trim() || '',
            name: initialData?.name || '',
            weightUnit: initialData?.weightUnit || 'KGS',
            currency: initialData?.currency ?? '',
            isdCode: initialData?.isdCode ?? '',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code.trim(),
                name: initialData.name,
                weightUnit: initialData.weightUnit,
                currency: initialData.currency ?? '',
                isdCode: initialData.isdCode ?? '',
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: CountryFormValues) => {
            const payload: CountryFormData = {
                code: data.code.trim(),
                name: data.name,
                weightUnit: data.weightUnit,
                ...(data.currency?.trim() ? { currency: data.currency.trim() } : {}),
                ...(data.isdCode?.trim() ? { isdCode: data.isdCode.trim() } : {}),
            }
            if (isEdit && initialData) {
                return countryService.updateCountry(initialData.id, payload)
            }
            return countryService.createCountry(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['countries'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['country', initialData.id] })
            }
            toast.success(`Country ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/countries')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} country`)
        }
    })

    function onSubmit(data: CountryFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FloatingFormItem label={<>Country Code <span className="text-red-500">*</span></>}>
                                <FormControl>
                                    <Input placeholder="e.g. IN" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FloatingFormItem label={<>Country Name <span className="text-red-500">*</span></>}>
                                <FormControl>
                                    <Input placeholder="e.g. India, United States" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="weightUnit"
                        render={({ field }) => (
                            <FloatingFormItem label={<>Weight Unit <span className="text-red-500">*</span></>}>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="KGS">KGS</SelectItem>
                                        <SelectItem value="LBS">LBS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FloatingFormItem label="Currency (optional)">
                                <FormControl>
                                    <Input placeholder="e.g. INR, USD" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="isdCode"
                    render={({ field }) => (
                        <FloatingFormItem label="ISD Code (optional)">
                            <FormControl>
                                <Input placeholder="e.g. +91, +1" {...field} className={FLOATING_INNER_CONTROL} />
                            </FormControl>
                        </FloatingFormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/countries')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Country" : "Create Country"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
