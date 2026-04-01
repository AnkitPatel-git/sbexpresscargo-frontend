"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { vendorService } from "@/services/masters/vendor-service"
import { stateService } from "@/services/masters/state-service"
import { Vendor } from "@/types/masters/vendor"

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
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

type VendorFormValues = z.infer<typeof vendorSchema>

interface VendorFormProps {
    initialData?: Vendor | null
}

export function VendorForm({ initialData }: VendorFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [stateOpen, setStateOpen] = useState(false)

    const { data: statesResponse } = useQuery({
        queryKey: ["states-list"],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorSchema) as any,
        defaultValues: {
            vendorCode: "",
            vendorName: "",
            contactPerson: "",
            address1: "",
            address2: "",
            pinCode: "",
            city: "",
            state: "",
            telephone1: "",
            telephone2: "",
            email: "",
            mobile: "",
            website: "",
            gstNo: "",
            status: "ACTIVE",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                vendorCode: initialData.vendorCode,
                vendorName: initialData.vendorName,
                contactPerson: initialData.contactPerson,
                address1: initialData.address1,
                address2: initialData.address2 || "",
                pinCode: initialData.pinCode,
                city: initialData.city,
                state: initialData.state,
                telephone1: initialData.telephone1,
                telephone2: initialData.telephone2 || "",
                email: initialData.email,
                mobile: initialData.mobile,
                website: initialData.website || "",
                gstNo: initialData.gstNo || "",
                status: initialData.status,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: VendorFormValues) => {
            if (isEdit && initialData) {
                return vendorService.updateVendor(initialData.id, data as any)
            }
            return vendorService.createVendor(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ["vendor", initialData.id] })
            }
            toast.success(`Vendor ${isEdit ? "updated" : "created"} successfully`)
            router.push("/masters/vendor")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} vendor`)
        },
    })

    function onSubmit(data: VendorFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Section 1: Basic Information */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</div>
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="vendorCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor Code*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. V001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="vendorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor Name*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Express Vendor" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control as any}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person*</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Name of contact" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
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
                        </CardContent>
                    </Card>

                    {/* Section 2: Communication */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</div>
                                Communication
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="10 digit number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="vendor@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="telephone1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 1*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Office number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="telephone2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telephone 2</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control as any}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 3: Address Details */}
                    <Card className="md:col-span-2 shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</div>
                                Address & Statutory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control as any}
                                        name="address1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address Line 1*</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Street address" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="address2"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address Line 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Optional" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control as any}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City*</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="City" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="pinCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pin Code*</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="6 digits" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control as any}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>State*</FormLabel>
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
                                                                {field.value || "Select state"}
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
                                                                    {statesResponse?.data?.map((state) => (
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
                                        control={form.control as any}
                                        name="gstNo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>GST Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Optional" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/masters/vendor")}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                        {mutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </div>
                        ) : isEdit ? (
                            "Update Vendor"
                        ) : (
                            "Create Vendor"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
