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
import { contentService } from '@/services/masters/content-service'
import { Content } from '@/types/masters/content'

const contentSchema = z.object({
    contentCode: z.string().min(2, "Content code must be at least 2 characters"),
    contentName: z.string().min(3, "Content name must be at least 3 characters"),
    hsnCode: z.string().min(4, "HSN code must be at least 4 characters"),
    vendor: z.string().min(1, "Vendor is required"),
    country: z.string().min(1, "Country is required"),
})

type ContentFormValues = z.infer<typeof contentSchema>

interface ContentDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    content?: Content | null
}

export function ContentDrawer({ open, onOpenChange, content }: ContentDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!content

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentSchema),
        defaultValues: {
            contentCode: '',
            contentName: '',
            hsnCode: '',
            vendor: '',
            country: '',
        }
    })

    useEffect(() => {
        if (content) {
            form.reset({
                contentCode: content.contentCode,
                contentName: content.contentName,
                hsnCode: content.hsnCode,
                vendor: content.vendor || '',
                country: content.country || '',
            })
        } else {
            form.reset({
                contentCode: '',
                contentName: '',
                hsnCode: '',
                vendor: '',
                country: '',
            })
        }
    }, [content, form])

    const mutation = useMutation({
        mutationFn: (data: ContentFormValues) => {
            if (isEdit && content) {
                return contentService.updateContent(content.id, data)
            }
            return contentService.createContent(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] })
            toast.success(`Content ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} content`)
        }
    })

    function onSubmit(data: ContentFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Content" : "Create Content"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the content details below." : "Enter the details for the new content."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                name="contentCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CONT01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="contentName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Electronics, Clothing" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                name="hsnCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>HSN Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 8517, 6109" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    name="vendor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Vendor name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Country name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Content" : "Create Content"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
