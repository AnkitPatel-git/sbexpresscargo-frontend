"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { serviceCenterService } from '@/services/masters/service-center-service'
import { stateService } from '@/services/masters/state-service'
import { ServiceCenter } from '@/types/masters/service-center'

const serviceCenterSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    subName: z.string().nullable().optional(),
    address1: z.string().nullable().optional(),
    address2: z.string().nullable().optional(),
    address3: z.string().nullable().optional(),
    address4: z.string().nullable().optional(),
    destination: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    telephone: z.string().nullable().optional(),
    email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
    icnNo: z.string().nullable().optional(),
    stNo: z.string().nullable().optional(),
    pinCode: z.string().nullable().optional(),
    companyLogo: z.string().nullable().optional(),
    signatoryLogo: z.string().nullable().optional(),
})

type ServiceCenterFormValues = z.infer<typeof serviceCenterSchema>

interface ServiceCenterFormProps {
    initialData?: ServiceCenter | null
}

export function ServiceCenterForm({ initialData }: ServiceCenterFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const form = useForm<ServiceCenterFormValues>({
        resolver: zodResolver(serviceCenterSchema) as Resolver<ServiceCenterFormValues>,
        defaultValues: {
            code: initialData?.code || '',
            name: initialData?.name || '',
            subName: initialData?.subName || '',
            address1: initialData?.address1 || '',
            address2: initialData?.address2 || '',
            address3: initialData?.address3 || '',
            address4: initialData?.address4 || '',
            destination: initialData?.destination || '',
            state: initialData?.state || '',
            telephone: initialData?.telephone || '',
            email: initialData?.email || '',
            icnNo: initialData?.icnNo || '',
            stNo: initialData?.stNo || '',
            pinCode: initialData?.pinCode || '',
            companyLogo: initialData?.companyLogo || '',
            signatoryLogo: initialData?.signatoryLogo || '',
        }
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code || '',
                name: initialData.name || '',
                subName: initialData.subName || '',
                address1: initialData.address1 || '',
                address2: initialData.address2 || '',
                address3: initialData.address3 || '',
                address4: initialData.address4 || '',
                destination: initialData.destination || '',
                state: initialData.state || '',
                telephone: initialData.telephone || '',
                email: initialData.email || '',
                icnNo: initialData.icnNo || '',
                stNo: initialData.stNo || '',
                pinCode: initialData.pinCode || '',
                companyLogo: initialData.companyLogo || '',
                signatoryLogo: initialData.signatoryLogo || '',
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: ServiceCenterFormValues) =>
            isEdit
                ? serviceCenterService.updateServiceCenter(initialData!.id, values)
                : serviceCenterService.createServiceCenter(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-centers'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['service-center', initialData.id] })
            }
            toast.success(`Service Center ${isEdit ? 'updated' : 'created'} successfully`)
            router.push('/masters/service-centers')
        },
        onError: (error: any) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} service center`)
        }
    })

    const onSubmit = (values: ServiceCenterFormValues) => {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Center Code</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="e.g. SC001" />
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
                                        <FormLabel>Service Center Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Full Name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sub Name (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="e.g. Mumbai Regional" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Contact & Tax Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Contact & Tax Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="email@example.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telephone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telephone</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Telephone No" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="icnNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ICN Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="ICN No" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Tax No</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="ST No" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Address Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Line 1</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Street Address" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Line 2</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Building/Floor" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address3"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Line 3</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Area/Locality" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address4"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Line 4</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Landmark" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="destination"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City / Destination</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="City Name" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pin Code</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ''} placeholder="Pin Code" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col md:col-span-2">
                                        <FormLabel className="mb-1">State</FormLabel>
                                        <Popover open={stateOpen} onOpenChange={setStateOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={stateOpen}
                                                        className={cn(
                                                            "w-full justify-between font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? statesData?.data?.find((state: any) => state.stateName === field.value)?.stateName
                                                                : "Select state..."}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search state..." />
                                                    <CommandList>
                                                        <CommandEmpty>No state found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {statesData?.data?.map((state: any) => (
                                                                <CommandItem
                                                                    key={state.id}
                                                                    value={state.stateName}
                                                                    onSelect={() => {
                                                                        form.setValue("state", state.stateName)
                                                                        setStateOpen(false)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === state.stateName ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {state.stateName}
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
                        </CardContent>
                    </Card>

                    {/* Logos & Assets */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Logos & Assets</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="companyLogo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Logo URL</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="https://..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="signatoryLogo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Signatory Logo URL</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="https://..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/masters/service-centers')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? 'Update SC' : 'Create SC'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
