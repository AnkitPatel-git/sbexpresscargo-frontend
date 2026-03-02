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
import { industryService } from '@/services/masters/industry-service'
import { Industry } from '@/types/masters/industry'

const industrySchema = z.object({
    industryCode: z.string().min(2, "Industry code must be at least 2 characters"),
    industryName: z.string().min(3, "Industry name must be at least 3 characters"),
})

type IndustryFormValues = z.infer<typeof industrySchema>

interface IndustryDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    industry?: Industry | null
}

export function IndustryDrawer({ open, onOpenChange, industry }: IndustryDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!industry

    const form = useForm<IndustryFormValues>({
        resolver: zodResolver(industrySchema),
        defaultValues: {
            industryCode: '',
            industryName: '',
        }
    })

    useEffect(() => {
        if (industry) {
            form.reset({
                industryCode: industry.industryCode,
                industryName: industry.industryName,
            })
        } else {
            form.reset({
                industryCode: '',
                industryName: '',
            })
        }
    }, [industry, form])

    const mutation = useMutation({
        mutationFn: (data: IndustryFormValues) => {
            if (isEdit && industry) {
                return industryService.updateIndustry(industry.id, data)
            }
            return industryService.createIndustry(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['industries'] })
            toast.success(`Industry ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} industry`)
        }
    })

    function onSubmit(data: IndustryFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Industry" : "Create Industry"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the industry details below." : "Enter the details for the new industry."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
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

                            <div className="flex justify-end gap-3 pt-6 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Industry" : "Create Industry"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
