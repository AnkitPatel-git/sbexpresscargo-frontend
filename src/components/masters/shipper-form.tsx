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

import { shipperService } from "@/services/masters/shipper-service"
import { stateService } from "@/services/masters/state-service"
import { serviceCenterService } from "@/services/masters/service-center-service"
import { Shipper } from "@/types/masters/shipper"

const shipperSchema = z.object({
    shipperCode: z.string().min(2, "Code must be at least 2 characters"),
    shipperName: z.string().min(3, "Name must be at least 3 characters"),
    shipperOrigin: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    address1: z.string().optional().nullable(),
    address2: z.string().optional().nullable(),
    pinCode: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    telephone1: z.string().optional().nullable(),
    telephone2: z.string().optional().nullable(),
    fax: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").or(z.literal("")).optional().nullable(),
    mobile: z.string().optional().nullable(),
    iecNo: z.string().optional().nullable(),
    gstNo: z.string().optional().nullable(),
    aadhaarNo: z.string().optional().nullable(),
    panNo: z.string().optional().nullable(),
    serviceCenter: z.string().optional().nullable(),
    bankAdCode: z.string().optional().nullable(),
    bankAccount: z.string().optional().nullable(),
    bankIfsc: z.string().optional().nullable(),
    firmType: z.enum(["GOV", "NON_GOV"]).optional().nullable(),
    nfei: z.string().optional().nullable(),
    lutNumber: z.string().optional().nullable(),
    lutIssueDate: z.string().optional().nullable(),
    lutTillDate: z.string().optional().nullable(),
})

type ShipperFormValues = z.infer<typeof shipperSchema>

interface ShipperFormProps {
    initialData?: Shipper | null
}

export function ShipperForm({ initialData }: ShipperFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [stateOpen, setStateOpen] = useState(false)
    const [scOpen, setScOpen] = useState(false)

    const { data: statesResponse } = useQuery({
        queryKey: ["states-list"],
        queryFn: () => stateService.getStates({ limit: 100 }),
    })

    const { data: scResponse } = useQuery({
        queryKey: ["service-centers-list"],
        queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
    })

    const form = useForm<ShipperFormValues>({
        resolver: zodResolver(shipperSchema),
        defaultValues: {
            shipperCode: "",
            shipperName: "",
            shipperOrigin: "",
            contactPerson: "",
            address1: "",
            address2: "",
            pinCode: "",
            city: "",
            state: "",
            industry: "",
            telephone1: "",
            telephone2: "",
            fax: "",
            email: "",
            mobile: "",
            iecNo: "",
            gstNo: "",
            aadhaarNo: "",
            panNo: "",
            serviceCenter: "",
            bankAdCode: "",
            bankAccount: "",
            bankIfsc: "",
            firmType: "NON_GOV",
            nfei: "",
            lutNumber: "",
            lutIssueDate: "",
            lutTillDate: "",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                shipperCode: initialData.shipperCode,
                shipperName: initialData.shipperName,
                shipperOrigin: initialData.shipperOrigin || "",
                contactPerson: initialData.contactPerson || "",
                address1: initialData.address1 || "",
                address2: initialData.address2 || "",
                pinCode: initialData.pinCode || "",
                city: initialData.city || "",
                state: initialData.state || "",
                industry: initialData.industry || "",
                telephone1: initialData.telephone1 || "",
                telephone2: initialData.telephone2 || "",
                fax: initialData.fax || "",
                email: initialData.email || "",
                mobile: initialData.mobile || "",
                iecNo: initialData.iecNo || "",
                gstNo: initialData.gstNo || "",
                aadhaarNo: initialData.aadhaarNo || "",
                panNo: initialData.panNo || "",
                serviceCenter: initialData.serviceCenter || "",
                bankAdCode: initialData.bankAdCode || "",
                bankAccount: initialData.bankAccount || "",
                bankIfsc: initialData.bankIfsc || "",
                firmType: initialData.firmType || "NON_GOV",
                nfei: initialData.nfei || "",
                lutNumber: initialData.lutNumber || "",
                lutIssueDate: initialData.lutIssueDate ? initialData.lutIssueDate.split("T")[0] : "",
                lutTillDate: initialData.lutTillDate ? initialData.lutTillDate.split("T")[0] : "",
            })

            // Resolve Service Center Name if missing but Id exists
            if (!initialData.serviceCenter && initialData.serviceCenterId && scResponse?.data) {
                const sc = scResponse.data.find(s => s.id === initialData.serviceCenterId)
                if (sc) {
                    form.setValue("serviceCenter", sc.name)
                }
            }
        }
    }, [initialData, form, scResponse])

    const mutation = useMutation({
        mutationFn: (data: ShipperFormValues) => {
            if (isEdit && initialData) {
                return shipperService.updateShipper(initialData.id, data as any)
            }
            return shipperService.createShipper(data as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shippers"] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ["shipper", initialData.id] })
            }
            toast.success(`Shipper ${isEdit ? "updated" : "created"} successfully`)
            router.push("/masters/shipper")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} shipper`)
        },
    })

    function onSubmit(data: ShipperFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                    control={form.control}
                                    name="shipperCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipper Code*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. SHIP01" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="shipperName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipper Name*</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Sender Ltd" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactPerson"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Person</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. John Doe" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="firmType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Firm Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="GOV">Government (GOV)</SelectItem>
                                                    <SelectItem value="NON_GOV">Non-Government (NON_GOV)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Contact Details */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</div>
                                Contact Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
                                            <FormControl>
                                                <Input placeholder="9876543210" {...field} value={field.value || ""} />
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
                                                <Input placeholder="shipper@example.com" {...field} value={field.value || ""} />
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
                                                <Input placeholder="022-XXXXXXX" {...field} value={field.value || ""} />
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
                                            <FormLabel>Telephone 2</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Optional" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Address & Logistics */}
                    <Card className="md:col-span-2 shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</div>
                                Address & Logistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="address1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address 1</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Street address" {...field} value={field.value || ""} />
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
                                                <FormLabel>Address 2</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Bldg, floor, etc." {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="city"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="City" {...field} value={field.value || ""} />
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
                                                        <Input placeholder="Pin" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
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
                                        control={form.control}
                                        name="shipperOrigin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Origin City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Mumbai" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="serviceCenter"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Service Center</FormLabel>
                                                <Popover open={scOpen} onOpenChange={setScOpen}>
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
                                                                {field.value || "Select service center"}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Search service center..." />
                                                            <CommandList>
                                                                <CommandEmpty>No service center found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {scResponse?.data?.map((sc) => (
                                                                        <CommandItem
                                                                            value={sc.name}
                                                                            key={sc.id}
                                                                            onSelect={() => {
                                                                                form.setValue("serviceCenter", sc.name)
                                                                                setScOpen(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    sc.name === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {sc.name} ({sc.code})
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Identification & Statutory */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</div>
                                Identification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="iecNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IEC No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="IEC123" {...field} value={field.value || ""} />
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
                                            <FormLabel>GST No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="GST123" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="panNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>PAN No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="PAN123" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="aadhaarNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Aadhaar No</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12 digit number" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="industry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Industry</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Textiles" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Section 5: Bank & LUT Details */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b p-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">5</div>
                                Bank & LUT Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="bankAccount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Bank Account" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bankAdCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AD Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="AD123" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankIfsc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IFSC</FormLabel>
                                            <FormControl>
                                                <Input placeholder="IFSC" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="lutIssueDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>LUT Issue Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lutTillDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>LUT Valid Till</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/masters/shipper")}
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
                            "Update Shipper"
                        ) : (
                            "Create Shipper"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
