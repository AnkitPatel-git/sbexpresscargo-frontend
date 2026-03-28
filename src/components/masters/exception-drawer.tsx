"use client"

import { useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
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
import { Checkbox } from "@/components/ui/checkbox"
import { exceptionService } from '@/services/masters/exception-service'
import { ExceptionMaster, ExceptionType } from '@/types/masters/exception'

const exceptionSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.enum(['UNDELIVERED', 'IN_TRANSIT', 'DELAYED', 'DELIVERED'] as const),
    inscan: z.boolean(),
    showOnMobileApps: z.boolean(),
})

type ExceptionFormValues = z.infer<typeof exceptionSchema>

interface ExceptionDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    exception?: ExceptionMaster | null
}

export function ExceptionDrawer({ open, onOpenChange, exception }: ExceptionDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!exception

    const form = useForm<ExceptionFormValues>({
        resolver: zodResolver(exceptionSchema) as Resolver<ExceptionFormValues>,
        defaultValues: {
            code: '',
            name: '',
            type: 'UNDELIVERED',
            inscan: true,
            showOnMobileApps: true,
        }
    })

    useEffect(() => {
        if (exception) {
            form.reset({
                code: exception.code,
                name: exception.name,
                type: exception.type,
                inscan: exception.inscan,
                showOnMobileApps: exception.showOnMobileApps,
            })
        } else {
            form.reset({
                code: '',
                name: '',
                type: 'UNDELIVERED',
                inscan: true,
                showOnMobileApps: true,
            })
        }
    }, [exception, form])

    const mutation = useMutation({
        mutationFn: (data: ExceptionFormValues) => {
            if (isEdit && exception) {
                return exceptionService.updateException(exception.id, data)
            }
            return exceptionService.createException(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exceptions'] })
            toast.success(`Exception ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} exception`)
        }
    })

    function onSubmit(data: ExceptionFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[450px]">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Exception" : "Create Exception"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the exception details below." : "Enter the details for the new exception."}
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
                                        <FormLabel>Exception Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. EXC01" {...field} />
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
                                        <FormLabel>Exception Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Address Not Found" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exception Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="UNDELIVERED">UNDELIVERED</SelectItem>
                                                <SelectItem value="IN_TRANSIT">IN_TRANSIT</SelectItem>
                                                <SelectItem value="DELAYED">DELAYED</SelectItem>
                                                <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col gap-4 pt-2">
                                <FormField
                                    control={form.control}
                                    name="inscan"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Inscan</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="showOnMobileApps"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Show on Mobile Apps</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Exception" : "Create Exception"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
