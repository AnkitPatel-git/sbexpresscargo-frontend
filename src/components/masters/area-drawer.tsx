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
import { areaService } from '@/services/masters/area-service'
import { serviceCenterService } from '@/services/masters/service-center-service'
import { Area } from '@/types/masters/area'

const areaSchema = z.object({
    areaName: z.string().min(2, "Area name must be at least 2 characters"),
    serviceCenterId: z.number().min(1, "Service center is required"),
    destination: z.string().optional(),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    area?: Area | null
}

export function AreaDrawer({ open, onOpenChange, area }: AreaDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!area
    const [scOpen, setScOpen] = useState(false)

    const { data: scData } = useQuery({
        queryKey: ['service-centers-list'],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
        enabled: open
    })

    const form = useForm<AreaFormValues>({
        resolver: zodResolver(areaSchema) as Resolver<AreaFormValues>,
        defaultValues: {
            areaName: '',
            serviceCenterId: 0,
            destination: '',
        }
    })

    useEffect(() => {
        if (area) {
            form.reset({
                areaName: area.areaName,
                serviceCenterId: area.serviceCenterId || 0,
                destination: area.destination || '',
            })
        } else {
            form.reset({
                areaName: '',
                serviceCenterId: 0,
                destination: '',
            })
        }
    }, [area, form, open])

    const mutation = useMutation({
        mutationFn: (data: AreaFormValues) => {
            if (isEdit && area) {
                return areaService.updateArea(area.id, data)
            }
            return areaService.createArea(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] })
            toast.success(`Area ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} area`)
        }
    })

    function onSubmit(data: AreaFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[450px]">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Area" : "Create Area"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the area and service center details below." : "Enter the details for the new area."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-20">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                            <Input placeholder="e.g. Mumbai" {...field} />
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
                                <Button type="submit" disabled={mutation.isPending} className="px-8 bg-blue-700 hover:bg-blue-800">
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Area" : "Create Area"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
