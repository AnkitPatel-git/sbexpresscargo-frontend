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
import { bankService } from '@/services/masters/bank-service'
import { Bank } from '@/types/masters/bank'

const bankSchema = z.object({
    bankCode: z.string().min(2, "Bank code must be at least 2 characters"),
    bankName: z.string().min(3, "Bank name must be at least 3 characters"),
    status: z.string().min(1, "Status is required"),
})

type BankFormValues = z.infer<typeof bankSchema>

interface BankDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bank?: Bank | null
}

export function BankDrawer({ open, onOpenChange, bank }: BankDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!bank

    const form = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
        defaultValues: {
            bankCode: '',
            bankName: '',
            status: 'ACTIVE',
        }
    })

    useEffect(() => {
        if (bank) {
            form.reset({
                bankCode: bank.bankCode,
                bankName: bank.bankName,
                status: bank.status,
            })
        } else {
            form.reset({
                bankCode: '',
                bankName: '',
                status: 'ACTIVE',
            })
        }
    }, [bank, form])

    const mutation = useMutation({
        mutationFn: (data: BankFormValues) => {
            if (isEdit && bank) {
                return bankService.updateBank(bank.id, data)
            }
            return bankService.createBank(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] })
            toast.success(`Bank ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} bank`)
        }
    })

    function onSubmit(data: BankFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Bank" : "Create Bank"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the bank details below." : "Enter the details for the new bank."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
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

                            <FormField
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
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

                            <div className="flex justify-end gap-3 pt-6 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Bank" : "Create Bank"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
