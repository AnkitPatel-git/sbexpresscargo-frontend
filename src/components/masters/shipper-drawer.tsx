"use client"

import { useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { shipperService } from '@/services/masters/shipper-service'
import { stateService } from '@/services/masters/state-service'
import { Shipper } from '@/types/masters/shipper'

const shipperSchema = z.object({
    shipperCode: z.string().min(2, "Code must be at least 2 characters"),
    shipperName: z.string().min(3, "Name must be at least 3 characters"),
    shipperOrigin: z.string().optional(),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional(),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    telephone1: z.string().min(10, "Telephone must be at least 10 characters"),
    telephone2: z.string().optional(),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    gstNo: z.string().optional(),
    serviceCenter: z.string().optional(),
})

type ShipperFormValues = z.infer<typeof shipperSchema>

interface ShipperDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipper?: Shipper | null
}

export function ShipperDrawer({ open, onOpenChange, shipper }: ShipperDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!shipper

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ShipperFormValues>({
        resolver: zodResolver(shipperSchema) as Resolver<ShipperFormValues>,
        defaultValues: {
            shipperCode: '',
            shipperName: '',
            shipperOrigin: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            telephone1: '',
            telephone2: '',
            email: '',
            mobile: '',
            gstNo: '',
            serviceCenter: '',
        }
    })

    useEffect(() => {
        if (shipper) {
            form.reset({
                shipperCode: shipper.shipperCode,
                shipperName: shipper.shipperName,
                shipperOrigin: shipper.shipperOrigin || '',
                contactPerson: shipper.contactPerson,
                address1: shipper.address1,
                address2: shipper.address2 || '',
                pinCode: shipper.pinCode,
                city: shipper.city,
                state: shipper.state,
                telephone1: shipper.telephone1,
                telephone2: shipper.telephone2 || '',
                email: shipper.email,
                mobile: shipper.mobile,
                gstNo: shipper.gstNo || '',
                serviceCenter: shipper.serviceCenter || '',
            })
        } else {
            form.reset({
                shipperCode: '',
                shipperName: '',
                shipperOrigin: '',
                contactPerson: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                telephone1: '',
                telephone2: '',
                email: '',
                mobile: '',
                gstNo: '',
                serviceCenter: '',
            })
        }
    }, [shipper, form])

    const mutation = useMutation({
        mutationFn: (data: ShipperFormValues) => {
            if (isEdit && shipper) {
                return shipperService.updateShipper(shipper.id, data)
            }
            return shipperService.createShipper(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shippers'] })
            toast.success(`Shipper ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} shipper`)
        }
    })

    function onSubmit(data: ShipperFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Shipper" : "Create Shipper"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the shipper details below." : "Enter the details for the new shipper."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="shipperCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipper Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. S001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="shipperName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipper Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="shipperOrigin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Shipper Origin</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mumbai" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Street address, building, floor" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Suite, apartment, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Delhi" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>State</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {statesData?.data?.map((state) => (
                                                        <SelectItem key={state.id} value={state.stateName}>
                                                            {state.stateName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pin Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 110001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="telephone1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 01112345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telephone2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 01187654321" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 9999999999" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. john@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="gstNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 27AABCU9603R1ZM" {...field} />
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Shipper" : "Create Shipper"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
