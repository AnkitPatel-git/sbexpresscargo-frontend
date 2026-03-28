"use client"

import { useEffect, useState } from 'react'
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

interface ServiceCenterDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    serviceCenter?: ServiceCenter | null
}

export function ServiceCenterDrawer({ open, onOpenChange, serviceCenter }: ServiceCenterDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!serviceCenter
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<ServiceCenterFormValues>({
        resolver: zodResolver(serviceCenterSchema) as Resolver<ServiceCenterFormValues>,
        defaultValues: {
            code: '',
            name: '',
            subName: '',
            address1: '',
            address2: '',
            address3: '',
            address4: '',
            destination: '',
            state: '',
            telephone: '',
            email: '',
            icnNo: '',
            stNo: '',
            pinCode: '',
            companyLogo: '',
            signatoryLogo: '',
        }
    })

    useEffect(() => {
        if (serviceCenter) {
            form.reset({
                code: serviceCenter.code || '',
                name: serviceCenter.name || '',
                subName: serviceCenter.subName || '',
                address1: serviceCenter.address1 || '',
                address2: serviceCenter.address2 || '',
                address3: serviceCenter.address3 || '',
                address4: serviceCenter.address4 || '',
                destination: serviceCenter.destination || '',
                state: serviceCenter.state || '',
                telephone: serviceCenter.telephone || '',
                email: serviceCenter.email || '',
                icnNo: serviceCenter.icnNo || '',
                stNo: serviceCenter.stNo || '',
                pinCode: serviceCenter.pinCode || '',
                companyLogo: serviceCenter.companyLogo || '',
                signatoryLogo: serviceCenter.signatoryLogo || '',
            })
        } else {
            form.reset({
                code: '',
                name: '',
                subName: '',
                address1: '',
                address2: '',
                address3: '',
                address4: '',
                destination: '',
                state: '',
                telephone: '',
                email: '',
                icnNo: '',
                stNo: '',
                pinCode: '',
                companyLogo: '',
                signatoryLogo: '',
            })
        }
    }, [serviceCenter, form])

    const mutation = useMutation({
        mutationFn: (data: ServiceCenterFormValues) => {
            if (isEdit && serviceCenter) {
                return serviceCenterService.updateServiceCenter(serviceCenter.id, data)
            }
            return serviceCenterService.createServiceCenter(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-centers'] })
            toast.success(`Service Center ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} service center`)
        }
    })

    function onSubmit(data: ServiceCenterFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[600px] p-0">
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle>{isEdit ? "Edit Service Center" : "Create Service Center"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the service center details below." : "Enter the details for the new service center."}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 mt-6">
                    <div className="pb-10">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Service Center Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. SC001" {...field} value={field.value || ''} />
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
                                                <FormLabel>Sub Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Mumbai SC" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Center Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mumbai Regional Service Center" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="address1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address Line 1</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Street address" {...field} value={field.value || ''} />
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
                                                <FormLabel>Address Line 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Building, floor, etc." {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="address3"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address Line 3</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Area/Locality" {...field} value={field.value || ''} />
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
                                                    <FormLabel>Address Line 4</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Landmark" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="destination"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Destination / City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Mumbai" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="pinCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Pin Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. 400001" {...field} value={field.value || ''} />
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
                                                    <Input placeholder="e.g. 02212345678" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. sc@example.com" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="icnNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ICN number/code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ICN No" {...field} value={field.value || ''} />
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
                                                    <Input placeholder="Service Tax No" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="companyLogo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Logo URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} value={field.value || ''} />
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
                                                    <Input placeholder="https://..." {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={mutation.isPending}>
                                        {mutation.isPending ? "Saving..." : isEdit ? "Update SC" : "Create SC"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
