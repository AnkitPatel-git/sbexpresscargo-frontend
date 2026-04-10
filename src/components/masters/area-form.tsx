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
import { areaService } from '@/services/masters/area-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { Area, AreaFormData } from '@/types/masters/area'

const areaSchema = z.object({
    areaName: z.string().min(2, "Area name must be at least 2 characters"),
    serviceCenterId: z.number().min(1, "Service center is required"),
    destination: z.string().optional().nullable().or(z.literal('')),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaFormProps {
    initialData?: Area | null
}

export function AreaForm({ initialData }: AreaFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [scOpen, setScOpen] = useState(false)

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const form = useForm<AreaFormValues>({
        resolver: zodResolver(areaSchema) as Resolver<AreaFormValues>,
        defaultValues: {
            areaName: initialData?.areaName || '',
            serviceCenterId: initialData?.serviceCenterId || 0,
            destination: initialData?.destination || '',
        }
    })

    const mutation = useMutation({
        mutationFn: (data: AreaFormValues) => {
            const payload: AreaFormData = {
                areaName: data.areaName,
                serviceCenterId: data.serviceCenterId,
            }
            if (data.destination != null && data.destination !== "") {
                payload.destination = data.destination
            }
            if (isEdit && initialData) {
                return areaService.updateArea(initialData.id, payload)
            }
            return areaService.createArea(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['area', initialData.id] })
            }
            toast.success(`Area ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/area')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} area`)
        }
    })

    function onSubmit(data: AreaFormValues) {
        mutation.mutate(data)
    }

    const onInvalid = (errors: Record<string, { message?: string }>) => {
        console.error("Form Validation Errors:", errors)
        const errorMessages = Object.entries(errors)
            .map(([field, error]) => `${field}: ${error.message}`)
            .join(", ")
        toast.error(`Validation Error: ${errorMessages || "Please check the form"}`)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="areaName"
                        render={({ field }) => (
                            <FloatingFormItem label={<>Area Name <span className="text-red-500">*</span></>}>
                                <FormControl>
                                    <Input placeholder="e.g. Mumbai Central" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceCenterId"
                        render={({ field }) => (
                            <FloatingFormItem label={<>Service Center <span className="text-red-500">*</span></>}>
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
                                                {field.value
                                                    ? scData?.data?.find((sc) => sc.id === field.value)?.name
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
                                    <Input placeholder="e.g. Mumbai" {...field} value={field.value ?? ''} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/area')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Area" : "Create Area"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
