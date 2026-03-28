"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { courierService } from '@/services/masters/courier-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { Courier, CourierFormData } from '@/types/masters/courier'

const courierSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters").max(32, "Code must be at most 32 characters"),
    name: z.string().min(3, "Name must be at least 3 characters").max(255, "Name must be at most 255 characters"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    serviceCenterCode: z.string().min(1, "Service Center is required"),
    destination: z.string().min(1, "Destination is required"),
    pickupCharge: z.coerce.number().min(0, "Charge must be a positive number"),
    deliveryCharge: z.coerce.number().min(0, "Charge must be a positive number"),
    originCode: z.string().optional(),
    tldBatchNo: z.string().optional(),
    inActive: z.boolean().default(false),
})

type CourierFormValues = z.infer<typeof courierSchema>

interface CourierDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    courier?: Courier | null
}

export function CourierDrawer({ open, onOpenChange, courier }: CourierDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!courier
    const [scOpen, setScOpen] = useState(false)

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
        enabled: open
    })

    const form = useForm<CourierFormValues>({
        resolver: zodResolver(courierSchema) as Resolver<CourierFormValues>,
        defaultValues: {
            code: '',
            name: '',
            mobile: '',
            serviceCenterId: 0,
            serviceCenterCode: '',
            destination: '',
            pickupCharge: 0,
            deliveryCharge: 0,
            originCode: '',
            tldBatchNo: '',
            inActive: false,
        }
    })

    useEffect(() => {
        if (courier) {
            form.reset({
                code: courier.code,
                name: courier.name,
                mobile: courier.mobile,
                serviceCenterId: courier.serviceCenterId || courier.serviceCenter?.id || 0,
                serviceCenterCode: courier.serviceCenterCode || courier.serviceCenter?.code || '',
                destination: courier.destination,
                pickupCharge: Number(courier.pickupCharge) || 0,
                deliveryCharge: Number(courier.deliveryCharge) || 0,
                originCode: courier.originCode || '',
                tldBatchNo: courier.tldBatchNo || '',
                inActive: !!courier.inActive,
            })
        } else {
            form.reset({
                code: '',
                name: '',
                mobile: '',
                serviceCenterId: 0,
                serviceCenterCode: '',
                destination: '',
                pickupCharge: 0,
                deliveryCharge: 0,
                originCode: '',
                tldBatchNo: '',
                inActive: false,
            })
        }
    }, [courier, form, open])

    const mutation = useMutation({
        mutationFn: (data: CourierFormValues) => {
            if (isEdit && courier) {
                return courierService.updateCourier(courier.id, data as any)
            }
            return courierService.createCourier(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['couriers'] })
            toast.success(`Courier ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} courier`)
        }
    })

    function onSubmit(data: CourierFormValues) {
        mutation.mutate(data)
    }

    const onInvalid = (errors: any) => {
        console.error("Form Validation Errors:", errors)
        toast.error("Please check the form for errors")
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Courier" : "Create Courier"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the courier details below." : "Enter the details for the new courier."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Courier Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. CR001" {...field} />
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
                                            <FormLabel>Courier Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Fedex" {...field} />
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
                                                <Input placeholder="e.g. 7777777777" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serviceCenterId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Service Center</FormLabel>
                                            <Popover open={scOpen} onOpenChange={setScOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? scData?.data?.find(
                                                                    (sc) => sc.id === field.value
                                                                )?.name
                                                                : "Select service center"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search service center..." />
                                                        <CommandList>
                                                            <CommandEmpty>No service center found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {scData?.data?.map((sc) => (
                                                                    <CommandItem
                                                                        value={sc.name}
                                                                        key={sc.id}
                                                                        onSelect={() => {
                                                                            form.setValue("serviceCenterId", sc.id)
                                                                            form.setValue("serviceCenterCode", sc.code)
                                                                            setScOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                sc.id === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {sc.name} ({sc.code})
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                <FormField
                                    control={form.control}
                                    name="inActive"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={(val) => field.onChange(val === 'INACTIVE')}
                                                value={field.value ? 'INACTIVE' : 'ACTIVE'}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                                    name="pickupCharge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pickup Charge</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="deliveryCharge"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Delivery Charge</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="originCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Origin Code (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter origin code" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tldBatchNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>TLD Batch No (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter TLD batch no" {...field} />
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
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Courier" : "Create Courier"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
