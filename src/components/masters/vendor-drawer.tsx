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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { vendorService } from '@/services/masters/vendor-service'
import { stateService } from '@/services/masters/state-service'
import { Vendor } from '@/types/masters/vendor'

const vendorSchema = z.object({
    vendorCode: z.string().min(2, "Code must be at least 2 characters"),
    vendorName: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional(),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    telephone1: z.string().min(10, "Telephone must be at least 10 characters"),
    telephone2: z.string().optional(),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    gstNo: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type VendorFormValues = z.infer<typeof vendorSchema>

interface VendorDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vendor?: Vendor | null
}

export function VendorDrawer({ open, onOpenChange, vendor }: VendorDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!vendor
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorSchema) as any,
        defaultValues: {
            vendorCode: '',
            vendorName: '',
            contactPerson: '',
            address1: '',
            address2: '',
            pinCode: '',
            city: '',
            state: '',
            telephone1: '',
            telephone2: '',
            email: '',
            mobile: '',
            website: '',
            gstNo: '',
            status: 'ACTIVE',
        }
    })

    useEffect(() => {
        if (vendor) {
            form.reset({
                vendorCode: vendor.vendorCode,
                vendorName: vendor.vendorName,
                contactPerson: vendor.contactPerson,
                address1: vendor.address1,
                address2: vendor.address2 || '',
                pinCode: vendor.pinCode,
                city: vendor.city,
                state: vendor.state,
                telephone1: vendor.telephone1,
                telephone2: vendor.telephone2 || '',
                email: vendor.email,
                mobile: vendor.mobile,
                website: vendor.website || '',
                gstNo: vendor.gstNo || '',
                status: vendor.status,
            })
        } else {
            form.reset({
                vendorCode: '',
                vendorName: '',
                contactPerson: '',
                address1: '',
                address2: '',
                pinCode: '',
                city: '',
                state: '',
                telephone1: '',
                telephone2: '',
                email: '',
                mobile: '',
                website: '',
                gstNo: '',
                status: 'ACTIVE',
            })
        }
    }, [vendor, form])

    const mutation = useMutation({
        mutationFn: (data: VendorFormValues) => {
            if (isEdit && vendor) {
                return vendorService.updateVendor(vendor.id, data)
            }
            return vendorService.createVendor(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] })
            toast.success(`Vendor ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} vendor`)
        }
    })

    function onSubmit(data: VendorFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Vendor" : "Create Vendor"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the vendor details below." : "Enter the details for the new vendor."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vendorCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. V001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vendorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Global Vendor" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Vendor Contact" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Street address, building, floor" {...field} />
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
                                            <FormLabel>Address 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Suite, apartment, etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Bangalore" {...field} />
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
                                            <FormLabel>State</FormLabel>
                                            <Popover open={stateOpen} onOpenChange={setStateOpen}>
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
                                                                ? statesData?.data?.find(
                                                                    (state) => state.stateName === field.value
                                                                )?.stateName
                                                                : "Select state"}
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
                                                                {statesData?.data?.map((state) => (
                                                                    <CommandItem
                                                                        value={state.stateName}
                                                                        key={state.id}
                                                                        onSelect={() => {
                                                                            form.setValue("state", state.stateName)
                                                                            setStateOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                state.stateName === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
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
                                <FormField
                                    control={form.control}
                                    name="pinCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pin Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 560001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="telephone1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 1</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 08012345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telephone2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 2 (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 08012345679" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 8888888888" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. vendor@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. https://example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gstNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST No. (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter GST number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Vendor" : "Create Vendor"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
