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
} from "@/components/ui/form"
import { FloatingFormItem, FLOATING_INNER_COMBO, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { ServiceablePincode } from '@/types/utilities/serviceable-pincode'

const pincodeSchema = z.object({
    pinCode: z.string().min(1, "Pin Code is required"),
    pinCodeName: z.string().min(1, "Pin Code Name is required"),
    serviceCenterId: z.number().min(1, "Service Center is required"),
    serviceCenterCode: z.string().min(1, "Service Center Code is required"),
    destination: z.string().min(1, "Destination is required"),
    serviceable: z.boolean(),
    oda: z.boolean(),
})

type PincodeFormValues = z.infer<typeof pincodeSchema>

interface ServiceablePincodeFormProps {
    initialData?: ServiceablePincode | null
}

export function ServiceablePincodeForm({ initialData }: ServiceablePincodeFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [scOpen, setScOpen] = useState(false)

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const form = useForm<PincodeFormValues>({
        resolver: zodResolver(pincodeSchema) as unknown as Resolver<PincodeFormValues>,
        defaultValues: {
            pinCode: '',
            pinCodeName: '',
            serviceCenterId: 0,
            serviceCenterCode: '',
            destination: '',
            serviceable: true,
            oda: false,
        },
        values: initialData ? {
            pinCode: initialData.pinCode,
            pinCodeName: initialData.pinCodeName,
            serviceCenterId: initialData.serviceCenterId || initialData.serviceCenter?.id || 0,
            serviceCenterCode: initialData.serviceCenter?.code || '',
            destination: initialData.destination,
            serviceable: initialData.serviceable,
            oda: initialData.oda,
        } : undefined
    })

    const mutation = useMutation({
        mutationFn: (data: PincodeFormValues) => {
            if (isEdit && initialData) {
                return serviceablePincodeService.updateServiceablePincode(initialData.id, data)
            }
            return serviceablePincodeService.createServiceablePincode(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['serviceable-pincodes'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['serviceable-pincode', initialData.id] })
            }
            toast.success(`Serviceable Pincode ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/utilities/serviceable-pincodes')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} serviceable pincode`)
        }
    })

    function onSubmit(data: PincodeFormValues) {
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
                        name="pinCode"
                        render={({ field }) => (
                            <FloatingFormItem label="Pin Code">
                                <FormControl>
                                    <Input placeholder="e.g. 110001" disabled={isEdit} {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="pinCodeName"
                        render={({ field }) => (
                            <FloatingFormItem label="Pin Code Name">
                                <FormControl>
                                    <Input placeholder="e.g. NEW DELHI" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceCenterId"
                        render={({ field }) => (
                            <FloatingFormItem label="Service Center">
                                <Popover open={scOpen} onOpenChange={setScOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    FLOATING_INNER_COMBO,
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {field.value
                                                        ? scData?.data?.find(
                                                            (sc) => sc.id === field.value
                                                        )?.name
                                                        : "Select service center"}
                                                </span>
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
                                                            key={sc.id}
                                                            value={sc.name}
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
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                            <FloatingFormItem label="Destination">
                                <FormControl>
                                    <Input placeholder="e.g. NEW DELHI" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <div className="flex flex-col sm:flex-row gap-4 pt-2 md:col-span-2">
                        <FormField
                            control={form.control}
                            name="serviceable"
                            render={({ field }) => (
                                <FloatingFormItem label="Serviceable" itemClassName="flex-1">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(Boolean(v))}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="oda"
                            render={({ field }) => (
                                <FloatingFormItem label="ODA (Out of Delivery Area)" itemClassName="flex-1">
                                    <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(Boolean(v))}
                                            />
                                        </FormControl>
                                    </div>
                                </FloatingFormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push('/utilities/serviceable-pincodes')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Pincode" : "Create Pincode"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
