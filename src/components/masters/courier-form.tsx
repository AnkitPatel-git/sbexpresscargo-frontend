"use client"

import { useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
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
import { Courier } from '@/types/masters/courier'

const courierSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters").max(32, "Code must be at most 32 characters"),
    name: z.string().min(3, "Name must be at least 3 characters").max(255, "Name must be at most 255 characters"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    serviceCenterCode: z.string().optional(),
    destination: z.string().min(1, "Destination is required"),
    pickupCharge: z.coerce.number().min(0, "Charge must be a positive number"),
    deliveryCharge: z.coerce.number().min(0, "Charge must be a positive number"),
    originCode: z.string().optional().nullable().or(z.literal('')),
    tldBatchNo: z.string().optional().nullable().or(z.literal('')),
    inActive: z.boolean().default(false),
})

type CourierFormValues = z.infer<typeof courierSchema>

interface CourierFormProps {
    initialData?: Courier | null
}

export function CourierForm({ initialData }: CourierFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [scOpen, setScOpen] = useState(false)

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const form = useForm<CourierFormValues>({
        resolver: zodResolver(courierSchema) as Resolver<CourierFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            mobile: initialData?.mobile || '',
            serviceCenterId: initialData?.serviceCenterId || initialData?.serviceCenter?.id || 0,
            serviceCenterCode: initialData?.serviceCenterCode || initialData?.serviceCenter?.code || '',
            destination: initialData?.destination || '',
            pickupCharge: Number(initialData?.pickupCharge) || 0,
            deliveryCharge: Number(initialData?.deliveryCharge) || 0,
            originCode: initialData?.originCode || '',
            tldBatchNo: initialData?.tldBatchNo || '',
            inActive: !!initialData?.inActive,
        }
    })

    const mutation = useMutation({
        mutationFn: (data: CourierFormValues) => {
            if (isEdit && initialData) {
                return courierService.updateCourier(initialData.id, data as any)
            }
            return courierService.createCourier(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['couriers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['courier', initialData.id] })
            }
            toast.success(`Courier ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/courier')
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
                    <FormField
                        control={form.control}
                        name="pickupCharge"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pickup Charge</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0" {...field} />
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
                                    <Input type="number" step="0.01" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="originCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Origin Code (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter origin code" {...field} value={field.value ?? ''} />
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
                                    <Input placeholder="Enter TLD batch no" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/courier')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Courier" : "Create Courier"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
