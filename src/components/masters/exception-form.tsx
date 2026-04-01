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
import { ExceptionMaster } from '@/types/masters/exception'

const exceptionSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    type: z.enum(['UNDELIVERED', 'DELIVERED'] as const),
    inscan: z.boolean().default(true),
    showOnMobileApps: z.boolean().default(true),
})

type ExceptionFormValues = z.infer<typeof exceptionSchema>

interface ExceptionFormProps {
    initialData?: ExceptionMaster | null
}

export function ExceptionForm({ initialData }: ExceptionFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<ExceptionFormValues>({
        resolver: zodResolver(exceptionSchema) as Resolver<ExceptionFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            type: initialData?.type || 'UNDELIVERED',
            inscan: initialData ? initialData.inscan : true,
            showOnMobileApps: initialData ? initialData.showOnMobileApps : true,
        }
    })

    const mutation = useMutation({
        mutationFn: (data: ExceptionFormValues) => {
            if (isEdit && initialData) {
                return exceptionService.updateException(initialData.id, data)
            }
            return exceptionService.createException(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exceptions'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['exception', initialData.id] })
            }
            toast.success(`Exception ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/exception')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} exception`)
        }
    })

    function onSubmit(data: ExceptionFormValues) {
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
                                        <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col gap-4 justify-center">
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
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/exception')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Exception" : "Create Exception"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
