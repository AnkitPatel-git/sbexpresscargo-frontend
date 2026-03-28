"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
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
import { Country } from '@/types/masters/country'

const countrySchema = z.object({
    code: z.string().min(2, "Country code must be at least 2 characters"),
    name: z.string().min(3, "Country name must be at least 3 characters"),
    weightUnit: z.string().min(1, "Weight unit is required"),
    currency: z.string().min(1, "Currency is required"),
    isdCode: z.string().min(1, "ISD Code is required"),
})

type CountryFormValues = z.infer<typeof countrySchema>

interface CountryDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    country?: Country | null
}

export function CountryDrawer({ open, onOpenChange, country }: CountryDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!country

    const form = useForm<CountryFormValues>({
        resolver: zodResolver(countrySchema),
        defaultValues: {
            code: '',
            name: '',
            weightUnit: 'KGS',
            currency: '',
            isdCode: '',
        }
    })

    useEffect(() => {
        if (country) {
            form.reset({
                code: country.code,
                name: country.name,
                weightUnit: country.weightUnit,
                currency: country.currency,
                isdCode: country.isdCode,
            })
        } else {
            form.reset({
                code: '',
                name: '',
                weightUnit: 'KGS',
                currency: '',
                isdCode: '',
            })
        }
    }, [country, form])

    const mutation = useMutation({
        mutationFn: (data: CountryFormValues) => {
            if (isEdit && country) {
                return countryService.updateCountry(country.id, data)
            }
            return countryService.createCountry(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['countries'] })
            toast.success(`Country ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} country`)
        }
    })

    function onSubmit(data: CountryFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Country" : "Create Country"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the country details below." : "Enter the details for the new country."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="flex justify-end gap-3 pt-6 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Country" : "Create Country"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
