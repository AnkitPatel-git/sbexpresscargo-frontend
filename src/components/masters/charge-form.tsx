"use client"

import { useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
import { chargeService } from '@/services/masters/charge-service'
import { Charge } from '@/types/masters/charge'

const chargeSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    chargeType: z.enum(['FREIGHT', 'AIRWAYBILL', 'FUEL_SURCHARGE', 'DOCUMENTATION', 'OTHER']),
    calculationBase: z.enum(['CHARGE_WEIGHT', 'FLAT']),
    chargeRate: z.coerce.number().min(0, "Rate must be at least 0"),
    applyFuel: z.boolean(),
    applyTaxOnFuel: z.boolean(),
    applyTax: z.boolean(),
    hsnCode: z.string().optional().or(z.literal('')),
    sequence: z.coerce.number().min(1, "Sequence must be at least 1"),
    multipleCharges: z.boolean(),
})

type ChargeFormValues = z.infer<typeof chargeSchema>

interface ChargeFormProps {
    initialData?: Charge | null
}

export function ChargeForm({ initialData }: ChargeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<ChargeFormValues>({
        resolver: zodResolver(chargeSchema) as Resolver<ChargeFormValues>,
        defaultValues: {
            code: '',
            name: '',
            chargeType: 'FREIGHT',
            calculationBase: 'CHARGE_WEIGHT',
            chargeRate: 0,
            applyFuel: true,
            applyTaxOnFuel: true,
            applyTax: true,
            hsnCode: '',
            sequence: 1,
            multipleCharges: false,
        },
        values: initialData ? {
            code: initialData.code,
            name: initialData.name,
            chargeType: (initialData.chargeType as any) || 'FREIGHT',
            calculationBase: (initialData.calculationBase as any) || 'CHARGE_WEIGHT',
            chargeRate: Number(initialData.chargeRate),
            applyFuel: initialData.applyFuel,
            applyTaxOnFuel: initialData.applyTaxOnFuel,
            applyTax: initialData.applyTax,
            hsnCode: initialData.hsnCode || '',
            sequence: initialData.sequence,
            multipleCharges: initialData.multipleCharges,
        } : undefined
    })

    const mutation = useMutation({
        mutationFn: (data: ChargeFormValues) => {
            if (isEdit && initialData) {
                return chargeService.updateCharge(initialData.id, data)
            }
            return chargeService.createCharge(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['charges'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['charge', initialData.id] })
            }
            toast.success(`Charge ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/charge')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} charge`)
        }
    })

    function onSubmit(data: ChargeFormValues) {
        mutation.mutate(data)
    }

    const onInvalid = (errors: any) => {
        console.error("Form Validation Errors:", errors)
        const errorMessages = Object.entries(errors)
            .map(([field, error]: [string, any]) => `${field}: ${error.message}`)
            .join(", ")
        toast.error(`Validation Error: ${errorMessages || "Please check the form"}`)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Charge Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. CHG01" {...field} />
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
                                <FormLabel>Charge Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Freight Charge" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="chargeType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Charge Type</FormLabel>
                                <Select 
                                    key={field.value}
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="FREIGHT">FREIGHT</SelectItem>
                                        <SelectItem value="AIRWAYBILL">AIRWAYBILL</SelectItem>
                                        <SelectItem value="FUEL_SURCHARGE">FUEL SURCHARGE</SelectItem>
                                        <SelectItem value="DOCUMENTATION">DOCUMENTATION</SelectItem>
                                        <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="calculationBase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Calculation Base</FormLabel>
                                <Select 
                                    key={field.value}
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select base" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CHARGE_WEIGHT">CHARGE WEIGHT</SelectItem>
                                        <SelectItem value="FLAT">FLAT</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="chargeRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Charge Rate</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sequence"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sequence</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hsnCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>HSN Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="996511" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="applyFuel"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Apply Fuel</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="applyTaxOnFuel"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Apply Tax on Fuel</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 md:pt-0">
                        <FormField
                            control={form.control}
                            name="applyTax"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Apply Tax</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="multipleCharges"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Multiple Charges</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/charge')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Charge" : "Create Charge"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
