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
import { useState } from 'react'
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
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { contentService } from '@/services/masters/content-service'
import { countryService } from '@/services/masters/country-service'
import { vendorService } from '@/services/masters/vendor-service'
import { Content } from '@/types/masters/content'

const contentSchema = z.object({
    contentCode: z.string().min(2, "Content code must be at least 2 characters"),
    contentName: z.string().min(3, "Content name must be at least 3 characters"),
    hsnCode: z.string().min(4, "HSN code must be at least 4 characters"),
    vendor: z.string().optional(),
    country: z.string().optional(),
    additionalField: z.string().optional(),
    clearanceCethNo: z.string().optional(),
    notificationSubType: z.string().optional(),
    notificationSubType1: z.string().optional(),
    notificationNo: z.string().optional(),
    srNo: z.string().optional(),
    igstNotification: z.string().optional(),
    igstSrNo: z.string().optional(),
    igstcNotification: z.string().optional(),
    igstcSrNo: z.string().optional(),
})

type ContentFormValues = z.infer<typeof contentSchema>

interface ContentDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    content?: Content | null
}

export function ContentDrawer({ open, onOpenChange, content }: ContentDrawerProps) {
    const [vendorOpen, setVendorOpen] = useState(false)
    const [countryOpen, setCountryOpen] = useState(false)
    const queryClient = useQueryClient()
    const isEdit = !!content

    const countriesQuery = useQuery({
        queryKey: ['countries-list'],
        queryFn: () => countryService.getCountries({ limit: 100 }),
    })

    const vendorsQuery = useQuery({
        queryKey: ['vendors-list'],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const countriesData = countriesQuery.data
    const vendorsData = vendorsQuery.data

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(contentSchema) as Resolver<ContentFormValues>,
        defaultValues: {
            contentCode: '',
            contentName: '',
            hsnCode: '',
            vendor: '',
            country: '',
            additionalField: '',
            clearanceCethNo: '',
            notificationSubType: '',
            notificationSubType1: '',
            notificationNo: '',
            srNo: '',
            igstNotification: '',
            igstSrNo: '',
            igstcNotification: '',
            igstcSrNo: '',
        }
    })

    useEffect(() => {
        if (content) {
            form.reset({
                contentCode: content.contentCode,
                contentName: content.contentName,
                hsnCode: content.hsnCode,
                vendor: content.vendor || '',
                country: content.country || '',
                additionalField: content.additionalField || '',
                clearanceCethNo: content.clearanceCethNo || '',
                notificationSubType: content.notificationSubType || '',
                notificationSubType1: content.notificationSubType1 || '',
                notificationNo: content.notificationNo || '',
                srNo: content.srNo || '',
                igstNotification: content.igstNotification || '',
                igstSrNo: content.igstSrNo || '',
                igstcNotification: content.igstcNotification || '',
                igstcSrNo: content.igstcSrNo || '',
            })
        } else {
            form.reset({
                contentCode: '',
                contentName: '',
                hsnCode: '',
                vendor: '',
                country: '',
                additionalField: '',
                clearanceCethNo: '',
                notificationSubType: '',
                notificationSubType1: '',
                notificationNo: '',
                srNo: '',
                igstNotification: '',
                igstSrNo: '',
                igstcNotification: '',
                igstcSrNo: '',
            })
        }
    }, [content, form])

    const mutation = useMutation({
        mutationFn: (data: ContentFormValues) => {
            if (isEdit && content) {
                return contentService.updateContent(content.id, data)
            }
            return contentService.createContent(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] })
            toast.success(`Content ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} content`)
        }
    })

    function onSubmit(data: ContentFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[640px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Content" : "Create Content"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the content details below." : "Enter the details for the new content."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contentCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. CONT01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="contentName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Electronics" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="hsnCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HSN Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 8517" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="additionalField"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Additional Field</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional additional info" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vendor"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Vendor</FormLabel>
                                            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                            disabled={vendorsQuery.isLoading}
                                                        >
                                                            <span className="truncate">
                                                                {field.value
                                                                    ? vendorsData?.data?.find(
                                                                        (vendor: any) => vendor.vendorName === field.value
                                                                    )?.vendorName || field.value
                                                                    : vendorsQuery.isLoading ? "Loading..." : "Select vendor"}
                                                            </span>
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search vendor..." />
                                                        <CommandList>
                                                            <CommandEmpty>No vendor found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {Array.isArray(vendorsData?.data) && vendorsData.data.map((vendor: any) => (
                                                                    <CommandItem
                                                                        key={vendor.id}
                                                                        value={vendor.vendorName}
                                                                        onSelect={() => {
                                                                            form.setValue("vendor", vendor.vendorName)
                                                                            setVendorOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                vendor.vendorName === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {vendor.vendorName} ({vendor.vendorCode})
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
                                                            disabled={countriesQuery.isLoading}
                                                        >
                                                            <span className="truncate">
                                                                {field.value
                                                                    ? countriesData?.data?.find(
                                                                        (country: any) => country.name === field.value
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
                                                                {Array.isArray(countriesData?.data) && countriesData.data.map((country: any) => (
                                                                    <CommandItem
                                                                        key={country.id}
                                                                        value={country.name}
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
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notification Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="notificationNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notification No</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="srNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sr No</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="notificationSubType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sub Type</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notificationSubType1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sub Type 1</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="clearanceCethNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Clearance CETH No</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">IGST Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="igstNotification"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IGST Notification</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="igstSrNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IGST Sr No</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="igstcNotification"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IGSTC Notification</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="igstcSrNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IGSTC Sr No</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 pb-10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Content" : "Create Content"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
