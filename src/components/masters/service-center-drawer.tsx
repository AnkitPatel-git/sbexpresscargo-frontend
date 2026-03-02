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
import { serviceCenterService } from '@/services/masters/service-center-service'
import { stateService } from '@/services/masters/state-service'
import { ServiceCenter } from '@/types/masters/service-center'

const serviceCenterSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    subName: z.string().min(2, "Sub-name is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    destination: z.string().min(2, "Destination is required"),
    state: z.string().min(1, "State is required"),
    telephone: z.string().min(10, "Telephone must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    gstNo: z.string().min(15, "GST Number must be 15 characters"),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
})

type ServiceCenterFormValues = z.infer<typeof serviceCenterSchema>

interface ServiceCenterDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    serviceCenter?: ServiceCenter | null
}

export function ServiceCenterDrawer({ open, onOpenChange, serviceCenter }: ServiceCenterDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!serviceCenter

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ServiceCenterFormValues>({
        resolver: zodResolver(serviceCenterSchema) as Resolver<ServiceCenterFormValues>,
        defaultValues: {
            code: '',
            name: '',
            subName: '',
            address1: '',
            destination: '',
            state: '',
            telephone: '',
            email: '',
            gstNo: '',
            pinCode: '',
        }
    })

    useEffect(() => {
        if (serviceCenter) {
            form.reset({
                code: serviceCenter.code,
                name: serviceCenter.name,
                subName: serviceCenter.subName,
                address1: serviceCenter.address1,
                destination: serviceCenter.destination,
                state: serviceCenter.state,
                telephone: serviceCenter.telephone,
                email: serviceCenter.email,
                gstNo: serviceCenter.gstNo,
                pinCode: serviceCenter.pinCode,
            })
        } else {
            form.reset({
                code: '',
                name: '',
                subName: '',
                address1: '',
                destination: '',
                state: '',
                telephone: '',
                email: '',
                gstNo: '',
                pinCode: '',
            })
        }
    }, [serviceCenter, form])

    const mutation = useMutation({
        mutationFn: (data: ServiceCenterFormValues) => {
            if (isEdit && serviceCenter) {
                return serviceCenterService.updateServiceCenter(serviceCenter.id, data)
            }
            return serviceCenterService.createServiceCenter(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-centers'] })
            toast.success(`Service Center ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} service center`)
        }
    })

    function onSubmit(data: ServiceCenterFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Service Center" : "Create Service Center"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the service center details below." : "Enter the details for the new service center."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Center Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. SC001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="subName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sub Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mumbai SC" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Center Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mumbai Regional Service Center" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Street address, building, floor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Destination / City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mumbai" {...field} />
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pin Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 400001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telephone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 02212345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. sc@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="gstNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GST Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="15-digit GSTIN" {...field} />
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update SC" : "Create SC"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
