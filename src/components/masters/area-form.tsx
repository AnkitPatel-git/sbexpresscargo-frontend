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
import { serviceablePincodeService } from '@/services/utilities/serviceable-pincode-service'
import { Area, AreaFormData } from '@/types/masters/area'

const areaSchema = z.object({
    areaName: z.string().min(2, "Area name must be at least 2 characters"),
    pinCodeId: z.number().min(1, "Pin code is required"),
})

type AreaFormValues = z.infer<typeof areaSchema>

interface AreaFormProps {
    initialData?: Area | null
}

export function AreaForm({ initialData }: AreaFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [pinOpen, setPinOpen] = useState(false)

    const { data: pincodeData } = useQuery({
        queryKey: ['pincodes-list'],
        queryFn: () => serviceablePincodeService.getServiceablePincodes({ limit: 100 }),
    })

    const form = useForm<AreaFormValues>({
        resolver: zodResolver(areaSchema) as Resolver<AreaFormValues>,
        defaultValues: {
            areaName: initialData?.areaName || '',
            pinCodeId: initialData?.pinCodeId || 0,
        }
    })

    const mutation = useMutation({
        mutationFn: (data: AreaFormValues) => {
            const payload: AreaFormData = {
                areaName: data.areaName,
                pinCodeId: data.pinCodeId,
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
                        name="pinCodeId"
                        render={({ field }) => (
                            <FloatingFormItem label={<>Pin Code <span className="text-red-500">*</span></>}>
                                <Popover open={pinOpen} onOpenChange={setPinOpen}>
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
                                                    ? (() => {
                                                        const pin = pincodeData?.data?.find((p) => p.id === field.value)
                                                        return pin ? `${pin.pinCode} - ${pin.pinCodeName}` : "Select pin code"
                                                    })()
                                                    : "Select pin code"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search pin code..." />
                                            <CommandList>
                                                <CommandEmpty>No pin code found.</CommandEmpty>
                                                <CommandGroup>
                                                    {pincodeData?.data?.map((pin) => (
                                                        <CommandItem
                                                            value={`${pin.pinCode} ${pin.pinCodeName}`}
                                                            key={pin.id}
                                                            onSelect={() => {
                                                                form.setValue("pinCodeId", pin.id)
                                                                setPinOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    pin.id === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {pin.pinCode} - {pin.pinCodeName}
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
