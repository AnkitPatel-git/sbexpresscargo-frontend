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
} from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_COMBO,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
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
import { FormSection } from "@/components/ui/form-section"
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
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    1
                                </span>
                                Basic Information
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="vendorCode"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Vendor Code*">
                                            <FormControl>
                                                <Input placeholder="e.g. V001" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="vendorName"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Vendor Name*">
                                            <FormControl>
                                                <Input placeholder="e.g. Express Vendor" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control as any}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FloatingFormItem label="Contact Person*">
                                        <FormControl>
                                            <Input placeholder="Name of contact" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="status"
                                render={({ field }) => (
                                    <FloatingFormItem label="Status">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* Section 2: Communication */}
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    2
                                </span>
                                Communication
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Mobile*">
                                            <FormControl>
                                                <Input placeholder="10 digit number" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="email"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Email Address*">
                                            <FormControl>
                                                <Input placeholder="vendor@example.com" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="telephone1"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Telephone 1*">
                                            <FormControl>
                                                <Input placeholder="Office number" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="telephone2"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Telephone 2">
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control as any}
                                name="website"
                                render={({ field }) => (
                                    <FloatingFormItem label="Website">
                                        <FormControl>
                                            <Input placeholder="https://example.com" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                    </FormSection>

                    {/* Section 3: Address Details */}
                    <FormSection
                        className="md:col-span-2"
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    3
                                </span>
                                Address & Statutory
                            </span>
                        }
                    >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control as any}
                                        name="address1"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Address Line 1*">
                                                <FormControl>
                                                    <Input placeholder="Street address" {...field} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="address2"
                                        render={({ field }) => (
                                            <FloatingFormItem label="Address Line 2">
                                                <FormControl>
                                                    <Input placeholder="Optional" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control as any}
                                            name="city"
                                            render={({ field }) => (
                                                <FloatingFormItem label="City*">
                                                    <FormControl>
                                                        <Input placeholder="City" {...field} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="pinCode"
                                            render={({ field }) => (
                                                <FloatingFormItem label="Pin Code*">
                                                    <FormControl>
                                                        <Input placeholder="6 digits" {...field} className={FLOATING_INNER_CONTROL} />
                                                    </FormControl>
                                                </FloatingFormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control as any}
                                        name="state"
                                        render={({ field }) => (
                                            <FloatingFormItem label="State*" itemClassName="flex flex-col">
                                                <Popover open={stateOpen} onOpenChange={setStateOpen}>
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
                                                                <span className="truncate">{field.value || "Select state"}</span>
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
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="gstNo"
                                        render={({ field }) => (
                                            <FloatingFormItem label="GST Number">
                                                <FormControl>
                                                    <Input placeholder="Optional" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                </div>
                            </div>
                    </FormSection>
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
                    <Button type="submit" disabled={mutation.isPending} className="bg-primary hover:bg-primary/90 text-white px-8">
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
