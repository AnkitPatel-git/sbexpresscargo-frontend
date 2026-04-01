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
import { industryService } from '@/services/masters/industry-service'
import { Industry, IndustryFormData } from '@/types/masters/industry'

const industrySchema = z.object({
    industryCode: z.string().min(2, "Industry code must be at least 2 characters"),
    industryName: z.string().min(3, "Industry name must be at least 3 characters"),
})

interface IndustryFormProps {
    initialData?: Industry | null
}

export function IndustryForm({ initialData }: IndustryFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<IndustryFormData>({
        resolver: zodResolver(industrySchema),
        defaultValues: {
            industryCode: initialData?.industryCode || '',
            industryName: initialData?.industryName || '',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                industryCode: initialData.industryCode,
                industryName: initialData.industryName,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: IndustryFormData) => {
            if (isEdit && initialData) {
                return industryService.updateIndustry(initialData.id, data)
            }
            return industryService.createIndustry(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['industries'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['industry', initialData.id] })
            }
            toast.success(`Industry ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/industries')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} industry`)
        }
    })

    function onSubmit(data: IndustryFormData) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="industryCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Industry Code</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. LOG, MFG" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="industryName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Industry Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Logistics, Manufacturing" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/industries')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Industry" : "Create Industry"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
