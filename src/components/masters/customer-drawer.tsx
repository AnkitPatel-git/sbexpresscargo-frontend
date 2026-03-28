"use client"

import { useEffect, useState } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { customerService } from '@/services/masters/customer-service'
import { stateService } from '@/services/masters/state-service'
import { Customer } from '@/types/masters/customer'

const customerSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    pinCode: z.string().min(6, "Pin code must be 6 characters"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(1, "State is required"),
    telNo1: z.string().min(10, "Telephone must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    customerType: z.enum(['CUSTOMER', 'VENDOR', 'AGENT']),
    registerType: z.enum(['REGISTERED', 'UNREGISTERED']),
    gstNo: z.string().min(15, "GST Number must be 15 characters"),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer?: Customer | null
}

export function CustomerDrawer({ open, onOpenChange, customer }: CustomerDrawerProps) {
    const queryClient = useQueryClient()
    const isEdit = !!customer
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesData } = useQuery<import('@/types/masters/state').StateListResponse>({
        queryKey: ['states-list'],
        queryFn: () => stateService.getStates({ limit: 100 }),
        enabled: open
    })

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
        defaultValues: {
            code: '',
            name: '',
            contactPerson: '',
            address1: '',
            pinCode: '',
            city: '',
            state: '',
            telNo1: '',
            email: '',
            mobile: '',
            status: 'ACTIVE',
            customerType: 'CUSTOMER',
            registerType: 'REGISTERED',
            gstNo: '',
        }
    })

    useEffect(() => {
        if (customer) {
            form.reset({
                code: customer.code,
                name: customer.name,
                contactPerson: customer.contactPerson,
                address1: customer.address1,
                pinCode: customer.pinCode,
                city: customer.city,
                state: customer.state,
                telNo1: customer.telNo1,
                email: customer.email,
                mobile: customer.mobile,
                status: customer.status,
                customerType: customer.customerType,
                registerType: customer.registerType,
                gstNo: customer.gstNo,
            })
        } else {
            form.reset({
                code: '',
                name: '',
                contactPerson: '',
                address1: '',
                pinCode: '',
                city: '',
                state: '',
                telNo1: '',
                email: '',
                mobile: '',
                status: 'ACTIVE',
                customerType: 'CUSTOMER',
                registerType: 'REGISTERED',
                gstNo: '',
            })
        }
    }, [customer, form])

    const mutation = useMutation({
        mutationFn: (data: CustomerFormValues) => {
            if (isEdit && customer) {
                return customerService.updateCustomer(customer.id, data)
            }
            return customerService.createCustomer(data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            toast.success(`Customer ${isEdit ? 'updated' : 'created'} successfully`)
            onOpenChange(false)
            form.reset()
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} customer`)
        }
    })

    function onSubmit(data: CustomerFormValues) {
        mutation.mutate(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[650px] overflow-y-auto">
                <SheetHeader className="px-6">
                    <SheetTitle>{isEdit ? "Edit Customer" : "Create Customer"}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? "Update the customer details below." : "Enter the details for the new customer."}
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-6 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. CUST01" {...field} />
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
                                            <FormLabel>Customer Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Acme Corp" {...field} />
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
                                            <Input placeholder="e.g. John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Street address, building, floor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mumbai" {...field} />
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
                                                <Input placeholder="e.g. 400001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="telNo1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 02212345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 9876543210" {...field} />
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
                                                <Input placeholder="e.g. customer@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="customerType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                                                    <SelectItem value="VENDOR">Vendor</SelectItem>
                                                    <SelectItem value="AGENT">Agent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="registerType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Register Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="REGISTERED">Registered</SelectItem>
                                                    <SelectItem value="UNREGISTERED">Unregistered</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                            </div>

                            <FormField
                                control={form.control}
                                name="gstNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GST Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="15-digit GSTIN" {...field} />
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
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending ? "Saving..." : isEdit ? "Update Customer" : "Create Customer"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
