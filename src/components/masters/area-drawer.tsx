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
import { areaService } from '@/services/masters/area-service'
import { Area } from '@/types/masters/area'

const areaSchema = z.object({
    areaName: z.string().min(2, "Area name must be at least 2 characters"),
    serviceCenter: z.string().min(2, "Service center is required"),
    destination: z.string().min(2, "Destination is required"),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    area?: Area | null
}

export function AreaDrawer({ open, onOpenChange, area }: AreaDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!area

    const form = useForm<AreaFormValues>({
        resolver: zodResolver(areaSchema) as Resolver<AreaFormValues>,
        defaultValues: {
            areaName: '',
            serviceCenter: '',
            destination: '',
        }
    })

    useEffect(() => {
        if (area) {
            form.reset({
                areaName: area.areaName,
                serviceCenter: area.serviceCenter,
                destination: area.destination,
            })
        } else {
            form.reset({
                areaName: '',
                serviceCenter: '',
                destination: '',
            })
        }
    }, [area, form])

    const mutation = useMutation({
        mutationFn: (data: AreaFormValues) => {
            if (isEdit && area) {
                return areaService.updateArea(area.id, data)
            }
            return areaService.createArea(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] })
            toast.success(`Area ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} area`)
        }
    })

    function onSubmit(data: AreaFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[450px]">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Area" : "Create Area"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the area details below." : "Enter the details for the new area."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="areaName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Area Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mumbai Central" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serviceCenter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Center</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mumbai SC" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="destination"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destination</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mumbai" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Area" : "Create Area"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
