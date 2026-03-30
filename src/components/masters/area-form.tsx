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
import { areaService } from '@/services/masters/area-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { Area } from '@/types/masters/area'

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
            const payload: any = {
                ...data,
                destination: data.destination || undefined
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
                        name="areaName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Area Name*</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Mumbai Central" {...field} />
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
                                <FormLabel>Service Center*</FormLabel>
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
                                    <Input placeholder="e.g. Mumbai" {...field} value={field.value ?? ''} />
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
