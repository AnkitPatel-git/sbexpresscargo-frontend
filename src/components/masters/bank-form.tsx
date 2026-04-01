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
import { Card, CardContent } from "@/components/ui/card"
import { bankService } from '@/services/masters/bank-service'
import { Bank } from '@/types/masters/bank'

const bankSchema = z.object({
    bankCode: z.string().min(2, "Bank code must be at least 2 characters"),
    bankName: z.string().min(3, "Bank name must be at least 3 characters"),
    status: z.string().min(1, "Status is required"),
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
            bankCode: initialData?.bankCode || '',
            bankName: initialData?.bankName || '',
            status: initialData?.status || 'ACTIVE',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                bankCode: initialData.bankCode,
                bankName: initialData.bankName,
                status: initialData.status,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: BankFormValues) => {
            if (isEdit && initialData) {
                return bankService.updateBank(initialData.id, data)
            }
            return bankService.createBank(data)
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
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bankCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. HDFC, ICICI" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bank Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. HDFC Bank, ICICI Bank" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="max-w-[200px]">
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
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
            </CardContent>
        </Card>
    )
}
