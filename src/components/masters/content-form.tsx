"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_COMBO,
    FLOATING_INNER_CONTROL,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormSection } from "@/components/ui/form-section"
import { contentService } from '@/services/masters/content-service'
import { countryService } from '@/services/masters/country-service'
import { Content } from '@/types/masters/content'
import type { Country } from '@/types/masters/country'
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const contentSchema = z.object({
    contentCode: optionalMasterCode(2),
    contentName: z.string().trim().min(3, "Content name must be at least 3 characters"),
    hsnCode: z.string().trim().refine(
        (value) => value.length === 0 || value.length >= 4,
        { message: "HSN code must be at least 4 characters when provided" },
    ),
    countryId: z.number().nullable().optional(),
    country: z.string().optional(),
    additionalField: z.string().optional(),
    clearanceCethNo: z.string().optional(),
})

type ContentFormValues = z.infer<typeof contentSchema>

interface ContentFormProps {
    initialData?: Content | null
}

export function ContentForm({ initialData }: ContentFormProps) {
    const [countryOpen, setCountryOpen] = useState(false)
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const countriesQuery = useQuery({
        queryKey: ['countries-list'],
        queryFn: () => countryService.getCountries({ limit: 100 }),
    })

    const countriesData = countriesQuery.data

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentSchema) as Resolver<ContentFormValues>,
        defaultValues: {
            contentCode: '',
            contentName: '',
            hsnCode: '',
            countryId: null,
            country: '',
            additionalField: '',
            clearanceCethNo: '',
        }
    })

    useEffect(() => {
        if (initialData) {
            const countryName =
                typeof initialData.country === 'object' && initialData.country !== null
                    ? initialData.country.name
                    : initialData.country || ''

            form.reset({
                contentCode: initialData.contentCode,
                contentName: initialData.contentName,
                hsnCode: initialData.hsnCode ?? '',
                countryId: initialData.countryId,
                country: countryName,
                additionalField: initialData.additionalField || '',
                clearanceCethNo: initialData.clearanceCethNo || '',
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: ContentFormValues) => {
            const { country, ...rest } = data
            const payload = omitEmptyCodeFields(rest, ['contentCode']);
            if (isEdit && initialData) {
                return contentService.updateContent(initialData.id, payload)
            }
            return contentService.createContent(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['content', initialData.id] })
            }
            toast.success(`Content ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/contents')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} content`)
        }
    })

    function onSubmit(data: ContentFormValues) {
        mutation.mutate(data)
    }

    return (
        <FormSection title="Content Details" contentClassName="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contentCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Content Code (optional)">
                                        <FormControl>
                                            <Input placeholder="Blank = auto-generate" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contentName"
                                render={({ field }) => (
                                    <FloatingFormItem label="Content Name">
                                        <FormControl>
                                            <Input placeholder="e.g. Electronics" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="hsnCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="HSN Code (optional)">
                                        <FormControl>
                                            <Input placeholder="e.g. 8517" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="additionalField"
                                render={({ field }) => (
                                    <FloatingFormItem label="Additional Field">
                                        <FormControl>
                                            <Input placeholder="Optional additional info" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FloatingFormItem label="Country">
                                        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            FLOATING_INNER_COMBO,
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={countriesQuery.isLoading}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? countriesData?.data?.find(
                                                                    (country: Country) => country.name === field.value
                                                                )?.name || field.value
                                                                : countriesQuery.isLoading ? "Loading..." : "Select country"}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search country..." />
                                                    <CommandList>
                                                        <CommandEmpty>No country found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {Array.isArray(countriesData?.data) && countriesData.data.map((country: Country) => (
                                                                <CommandItem
                                                                    key={country.id}
                                                                    value={country.name}
                                                                    onSelect={() => {
                                                                        form.setValue("country", country.name)
                                                                        form.setValue("countryId", country.id)
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
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clearanceCethNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Clearance CETH No">
                                        <FormControl>
                                            <Input placeholder="Optional CETH number" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/masters/contents')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Saving..." : isEdit ? "Update Content" : "Create Content"}
                            </Button>
                        </div>
                    </form>
                </Form>
        </FormSection>
    )
}
