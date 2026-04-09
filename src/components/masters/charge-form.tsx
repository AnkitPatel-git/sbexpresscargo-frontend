"use client"

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
import { chargeService } from '@/services/masters/charge-service'
import { Charge, type ChargeTypeEnums } from '@/types/masters/charge'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

function normalizeChargeTypeFromApi(raw: string | null | undefined): ChargeTypeEnums {
    if (!raw) return 'FREIGHT'
    if (raw === 'FUEL_SURCHARGE') return 'FUEL'
    if (raw === 'DOCUMENTATION') return 'OTHER'
    const allowed: ChargeTypeEnums[] = ['FREIGHT', 'AIRWAYBILL', 'FUEL', 'OBC', 'FLAT', 'OTHER']
    return allowed.includes(raw as ChargeTypeEnums) ? (raw as ChargeTypeEnums) : 'FREIGHT'
}

const CALC_BASES = ['CHARGE_WEIGHT', 'FLAT', 'ACTUAL_WEIGHT', 'FREIGHT', 'SHIPMENT_VALUE'] as const
type CalculationBaseField = (typeof CALC_BASES)[number]

function normalizeCalculationBaseFromApi(raw: string | null | undefined): CalculationBaseField {
    if (raw && (CALC_BASES as readonly string[]).includes(raw)) {
        return raw as CalculationBaseField
    }
    return 'CHARGE_WEIGHT'
}

const chargeSchema = z.object({
    code: optionalMasterCode(2),
    name: z.string().min(3, "Name must be at least 3 characters"),
    chargeType: z.enum(['FREIGHT', 'AIRWAYBILL', 'FUEL', 'OBC', 'FLAT', 'OTHER']),
    calculationBase: z.enum([
        'CHARGE_WEIGHT',
        'FLAT',
        'ACTUAL_WEIGHT',
        'FREIGHT',
        'SHIPMENT_VALUE',
    ]),
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
            chargeType: normalizeChargeTypeFromApi(initialData.chargeType),
            calculationBase: normalizeCalculationBaseFromApi(initialData.calculationBase),
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
            const payload = omitEmptyCodeFields(data, ['code']) as ChargeFormValues
            if (isEdit && initialData) {
                return chargeService.updateCharge(initialData.id, {
                    ...payload,
                    version: initialData.version ?? 1,
                })
            }
            return chargeService.createCharge(payload)
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
                            <FloatingFormItem label="Charge Code (optional)">
                                <FormControl>
                                    <Input placeholder="Blank = auto-generate" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FloatingFormItem label="Charge Name">
                                <FormControl>
                                    <Input placeholder="e.g. Freight Charge" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="chargeType"
                        render={({ field }) => (
                            <FloatingFormItem label="Charge Type">
                                <Select
                                    key={field.value}
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="FREIGHT">FREIGHT</SelectItem>
                                        <SelectItem value="AIRWAYBILL">AIRWAYBILL</SelectItem>
                                        <SelectItem value="FUEL">FUEL</SelectItem>
                                        <SelectItem value="OBC">OBC</SelectItem>
                                        <SelectItem value="FLAT">FLAT</SelectItem>
                                        <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="calculationBase"
                        render={({ field }) => (
                            <FloatingFormItem label="Calculation Base">
                                <Select
                                    key={field.value}
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select base" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="CHARGE_WEIGHT">CHARGE WEIGHT</SelectItem>
                                        <SelectItem value="FLAT">FLAT</SelectItem>
                                        <SelectItem value="ACTUAL_WEIGHT">ACTUAL WEIGHT</SelectItem>
                                        <SelectItem value="FREIGHT">FREIGHT</SelectItem>
                                        <SelectItem value="SHIPMENT_VALUE">SHIPMENT VALUE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="chargeRate"
                        render={({ field }) => (
                            <FloatingFormItem label="Charge Rate">
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className={FLOATING_INNER_CONTROL}
                                        {...field}
                                        value={field.value === undefined || field.value === null ? "" : field.value}
                                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sequence"
                        render={({ field }) => (
                            <FloatingFormItem label="Sequence">
                                <FormControl>
                                    <Input
                                        type="number"
                                        className={FLOATING_INNER_CONTROL}
                                        {...field}
                                        value={field.value === undefined || field.value === null ? "" : field.value}
                                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                    />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hsnCode"
                        render={({ field }) => (
                            <FloatingFormItem label="HSN Code">
                                <FormControl>
                                    <Input placeholder="996511" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="applyFuel"
                            render={({ field }) => (
                                <FloatingFormItem label="Apply Fuel">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="applyTaxOnFuel"
                            render={({ field }) => (
                                <FloatingFormItem label="Apply Tax on Fuel">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 md:pt-0">
                        <FormField
                            control={form.control}
                            name="applyTax"
                            render={({ field }) => (
                                <FloatingFormItem label="Apply Tax">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="multipleCharges"
                            render={({ field }) => (
                                <FloatingFormItem label="Multiple Charges">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
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
