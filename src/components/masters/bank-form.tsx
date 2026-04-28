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
import { FormSection } from "@/components/ui/form-section"
import { bankService } from '@/services/masters/bank-service'
import { Bank } from '@/types/masters/bank'

/** Bruno Create: mandatory bankCode, bankName, status (ACTIVE|INACTIVE). */
const bankSchema = z.object({
    bankCode: z.string().trim().min(2, "Bank code must be at least 2 characters"),
    bankName: z.string().min(3, "Bank name must be at least 3 characters"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
})

type BankFormValues = z.infer<typeof bankSchema>

interface BankFormProps {
    initialData?: Bank | null
}

export function BankForm({ initialData }: BankFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema) as Resolver<BankFormValues>,
        defaultValues: {
            bankCode: initialData?.bankCode?.trim() || '',
            bankName: initialData?.bankName || '',
            status: (initialData?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                bankCode: initialData.bankCode.trim(),
                bankName: initialData.bankName,
                status: initialData.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: BankFormValues) => {
            const payload = {
                bankCode: data.bankCode.trim(),
                bankName: data.bankName,
                status: data.status,
            }
            if (isEdit && initialData) {
                return bankService.updateBank(initialData.id, payload)
            }
            return bankService.createBank(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['bank', initialData.id] })
            }
            toast.success(`Bank ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/banks')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} bank`)
        }
    })

    function onSubmit(data: BankFormValues) {
        mutation.mutate(data)
    }

    return (
        <FormSection title="Bank Details" contentClassName="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bankCode"
                                render={({ field }) => (
                                    <FloatingFormItem label={<>Bank Code <span className="text-red-500">*</span></>}>
                                        <FormControl>
                                            <Input placeholder="e.g. BANK01" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FloatingFormItem label={<>Bank Name <span className="text-red-500">*</span></>}>
                                        <FormControl>
                                            <Input placeholder="e.g. HDFC Bank, ICICI Bank" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FloatingFormItem required label="Status" itemClassName="max-w-[200px]">
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/masters/banks')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Saving..." : isEdit ? "Update Bank" : "Create Bank"}
                            </Button>
                        </div>
                    </form>
                </Form>
        </FormSection>
    )
}
