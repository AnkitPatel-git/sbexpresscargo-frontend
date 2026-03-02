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
import { consigneeService } from '@/services/masters/consignee-service'
import { stateService } from '@/services/masters/state-service'
import { Consignee } from '@/types/masters/consignee'

const consigneeSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    destination: z.string().optional(),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional(),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    tel1: z.string().min(10, "Telephone must be at least 10 characters"),
    tel2: z.string().optional(),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    serviceCenter: z.string().optional(),
})

type ConsigneeFormValues = z.infer<typeof consigneeSchema>

interface ConsigneeDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    consignee?: Consignee | null
}

export function ConsigneeDrawer({ open, onOpenChange, consignee }: ConsigneeDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!consignee

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ConsigneeFormValues>({
        resolver: zodResolver(consigneeSchema) as Resolver<ConsigneeFormValues>,
        defaultValues: {
            code: '',
            name: '',
            destination: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            tel1: '',
            tel2: '',
            email: '',
            mobile: '',
            serviceCenter: '',
        }
    })

    useEffect(() => {
        if (consignee) {
            form.reset({
                code: consignee.code,
                name: consignee.name,
                destination: consignee.destination || '',
                contactPerson: consignee.contactPerson,
                address1: consignee.address1,
                address2: consignee.address2 || '',
                pinCode: consignee.pinCode,
                city: consignee.city,
                state: consignee.state,
                tel1: consignee.tel1,
                tel2: consignee.tel2 || '',
                email: consignee.email,
                mobile: consignee.mobile,
                serviceCenter: consignee.serviceCenter || '',
            })
        } else {
            form.reset({
                code: '',
                name: '',
                destination: '',
                contactPerson: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                tel1: '',
                tel2: '',
                email: '',
                mobile: '',
                serviceCenter: '',
            })
        }
    }, [consignee, form])

    const mutation = useMutation({
        mutationFn: (data: ConsigneeFormValues) => {
            if (isEdit && consignee) {
                return consigneeService.updateConsignee(consignee.id, data)
            }
            return consigneeService.createConsignee(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consignees'] })
            toast.success(`Consignee ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} consignee`)
        }
    })

    function onSubmit(data: ConsigneeFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Consignee" : "Create Consignee"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the consignee details below." : "Enter the details for the new consignee."}
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
                                            <FormLabel>Consignee Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. C001" {...field} />
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
                                            <FormLabel>Consignee Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Jane Smith" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="destination"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destination</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Delhi" {...field} />
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
                                            <Input placeholder="e.g. Jane Smith" {...field} />
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="tel1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 02212345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tel2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 02287654321" {...field} />
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
                                                <Input placeholder="e.g. 9876543210" {...field} />
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
                                                <Input placeholder="e.g. jane@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="serviceCenter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Center</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Delhi SC" {...field} />
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Consignee" : "Create Consignee"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
