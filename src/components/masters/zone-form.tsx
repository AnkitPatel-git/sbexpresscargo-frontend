"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zoneService } from '@/services/masters/zone-service'
import { countryService } from '@/services/masters/country-service'
import { Zone, ZoneFormData } from '@/types/masters/zone'

const zoneSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    country: z.string().min(1, 'Country is required'),
    zoneType: z.enum(['DOMESTIC', 'VENDOR']),
});

interface ZoneFormProps {
    initialData?: Zone | null
}

export function ZoneForm({ initialData }: ZoneFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [countryOpen, setCountryOpen] = useState(false)

    const { data: countriesData } = useQuery({
        queryKey: ['countries-list'],
        queryFn: () => countryService.getCountries({ limit: 100 }),
    })

    const form = useForm<ZoneFormData>({
        resolver: zodResolver(zoneSchema) as Resolver<ZoneFormData>,
        defaultValues: {
            name: initialData?.name || '',
            code: initialData?.code || '',
            country: initialData?.country || '',
            zoneType: initialData?.zoneType || 'DOMESTIC',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                code: initialData.code,
                country: initialData.country,
                zoneType: initialData.zoneType,
            });
        }
    }, [initialData, form]);

    const mutation = useMutation({
        mutationFn: (data: ZoneFormData) => {
            if (isEdit && initialData) {
                return zoneService.updateZone(initialData.id, data)
            }
            return zoneService.createZone(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['zone', initialData.id] })
            }
            toast.success(isEdit ? "Zone updated successfully" : "Zone created successfully")
            router.push('/masters/zones')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} zone`)
        },
    })

    const onSubmit = (data: ZoneFormData) => {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter zone name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter zone code" {...field} disabled={isEdit} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Country</FormLabel>
                                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
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
                                                {field.value || "Select country"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search country..." />
                                            <CommandList>
                                                <CommandEmpty>No country found.</CommandEmpty>
                                                <CommandGroup>
                                                    {countriesData?.data?.map((country) => (
                                                        <CommandItem
                                                            value={country.name}
                                                            key={country.id}
                                                            onSelect={() => {
                                                                form.setValue("country", country.name)
                                                                setCountryOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    country.name === field.value
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {country.name} ({country.code})
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
                        name="zoneType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Zone Type</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select zone type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                        <SelectItem value="VENDOR">Vendor</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="outline" onClick={() => router.push('/masters/zones')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Zone" : "Create Zone"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
