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
import { flightService } from '@/services/masters/flight-service'
import { Flight } from '@/types/masters/flight'

const flightSchema = z.object({
    flightCode: z.string().min(2, "Flight code must be at least 2 characters"),
    flightName: z.string().min(3, "Flight name must be at least 3 characters"),
    flightType: z.string().min(1, "Flight type is required"),
})

type FlightFormValues = z.infer<typeof flightSchema>

interface FlightDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    flight?: Flight | null
}

export function FlightDrawer({ open, onOpenChange, flight }: FlightDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!flight

    const form = useForm<FlightFormValues>({
        resolver: zodResolver(flightSchema),
        defaultValues: {
            flightCode: '',
            flightName: '',
            flightType: 'PRIME',
        }
    })

    useEffect(() => {
        if (flight) {
            form.reset({
                flightCode: flight.flightCode,
                flightName: flight.flightName,
                flightType: flight.flightType,
            })
        } else {
            form.reset({
                flightCode: '',
                flightName: '',
                flightType: 'PRIME',
            })
        }
    }, [flight, form])

    const mutation = useMutation({
        mutationFn: (data: FlightFormValues) => {
            if (isEdit && flight) {
                return flightService.updateFlight(flight.id, data)
            }
            return flightService.createFlight(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flights'] })
            toast.success(`Flight ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} flight`)
        }
    })

    function onSubmit(data: FlightFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Flight" : "Create Flight"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the flight details below." : "Enter the details for the new flight."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="flightCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Flight Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 6E101, AI201" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="flightName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Flight Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. IndiGo Prime 101" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="flightType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Flight Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PRIME">Prime</SelectItem>
                                                <SelectItem value="GCR">GCR</SelectItem>
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Flight" : "Create Flight"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
