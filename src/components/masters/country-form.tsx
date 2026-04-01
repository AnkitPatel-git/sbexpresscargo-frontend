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
import { countryService } from '@/services/masters/country-service'
import { Country, CountryFormData } from '@/types/masters/country'

const countrySchema = z.object({
    code: z.string().min(2, "Country code must be at least 2 characters"),
    name: z.string().min(3, "Country name must be at least 3 characters"),
    weightUnit: z.string().min(1, "Weight unit is required"),
    currency: z.string().min(1, "Currency is required"),
    isdCode: z.string().min(1, "ISD Code is required"),
})

interface CountryFormProps {
    initialData?: Country | null
}

export function CountryForm({ initialData }: CountryFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<CountryFormData>({
        resolver: zodResolver(countrySchema),
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            weightUnit: initialData?.weightUnit || 'KGS',
            currency: initialData?.currency || '',
            isdCode: initialData?.isdCode || '',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code,
                name: initialData.name,
                weightUnit: initialData.weightUnit,
                currency: initialData.currency,
                isdCode: initialData.isdCode,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: CountryFormData) => {
            if (isEdit && initialData) {
                return countryService.updateCountry(initialData.id, data)
            }
            return countryService.createCountry(data)
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

    function onSubmit(data: CountryFormData) {
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
                            <FormItem>
                                <FormLabel>Country Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. IND, USA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. India, United States" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="weightUnit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Weight Unit</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="KGS">KGS</SelectItem>
                                        <SelectItem value="LBS">LBS</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. INR, USD" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="isdCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ISD Code</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. +91, +1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
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
