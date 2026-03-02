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
import { Checkbox } from "@/components/ui/checkbox"
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { ServiceablePincode } from '@/types/utilities/serviceable-pincode'

const pincodeSchema = z.object({
    pinCode: z.string().min(1, "Pin Code is required"),
    pinCodeName: z.string().min(1, "Pin Code Name is required"),
    serviceCenter: z.string().min(1, "Service Center is required"),
    destination: z.string().min(1, "Destination is required"),
    serviceable: z.boolean(),
    oda: z.boolean(),
})

type PincodeFormValues = z.infer<typeof pincodeSchema>

interface ServiceablePincodeDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pincode?: ServiceablePincode | null
}

export function ServiceablePincodeDrawer({ open, onOpenChange, pincode }: ServiceablePincodeDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!pincode

    const form = useForm<PincodeFormValues>({
        resolver: zodResolver(pincodeSchema) as unknown as Resolver<PincodeFormValues>,
        defaultValues: {
            pinCode: '',
            pinCodeName: '',
            serviceCenter: '',
            destination: '',
            serviceable: true,
            oda: false,
        }
    })

    useEffect(() => {
        if (pincode) {
            form.reset({
                pinCode: pincode.pinCode,
                pinCodeName: pincode.pinCodeName,
                serviceCenter: pincode.serviceCenter,
                destination: pincode.destination,
                serviceable: pincode.serviceable,
                oda: pincode.oda,
            })
        } else {
            form.reset({
                pinCode: '',
                pinCodeName: '',
                serviceCenter: '',
                destination: '',
                serviceable: true,
                oda: false,
            })
        }
    }, [pincode, form])

    const mutation = useMutation({
        mutationFn: (data: PincodeFormValues) => {
            if (isEdit && pincode) {
                return serviceablePincodeService.updateServiceablePincode(pincode.id, data)
            }
            return serviceablePincodeService.createServiceablePincode(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] })
            toast.success(`Serviceable Pincode ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} serviceable pincode`)
        }
    })

    function onSubmit(data: PincodeFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[450px]">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Serviceable Pincode" : "Create Serviceable Pincode"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the pincode details below." : "Enter the details for the new serviceable pincode."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="pinCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pin Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. 110001" disabled={isEdit} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="pinCodeName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pin Code Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. NEW DELHI" {...field} />
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
                                            <Input placeholder="e.g. DELHI" {...field} />
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
                                            <Input placeholder="e.g. NEW DELHI" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-col gap-4 pt-2">
                                <FormField
                                    control={form.control}
                                    name="serviceable"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Serviceable</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="oda"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>ODA (Out of Delivery Area)</FormLabel>
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Pincode" : "Create Pincode"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
