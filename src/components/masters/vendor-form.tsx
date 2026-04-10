"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
} from "@/components/ui/form"
import {
    FloatingFormItem,
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
import { FormSection } from "@/components/ui/form-section"
import { Checkbox } from "@/components/ui/checkbox"

import { vendorService } from "@/services/masters/vendor-service"
import { Vendor } from "@/types/masters/vendor"
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema"

const vendorSchema = z.object({
    vendorCode: optionalMasterCode(2),
    vendorName: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional(),
    pinCodeId: z.string().optional().or(z.literal("")),
    telephone: z.string().min(10, "Telephone must be at least 10 characters"),
    fax: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    gstNo: z.string().optional(),
    mode: z.string().optional().or(z.literal("")),
    fuelHead: z.string().optional().or(z.literal("")),
    currency: z.string().optional().or(z.literal("")),
    origin: z.string().optional().or(z.literal("")),
    vendorZip: z.string().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    global: z.boolean().default(false),
    gstType: z.string().optional().or(z.literal("")),
    volumetricRound: z.coerce.number().optional(),
})

type VendorFormValues = z.infer<typeof vendorSchema>

interface VendorFormProps {
    initialData?: Vendor | null
}

export function VendorForm({ initialData }: VendorFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorSchema) as any,
        defaultValues: {
            vendorCode: "",
            vendorName: "",
            contactPerson: "",
            address1: "",
            address2: "",
            pinCodeId: "",
            telephone: "",
            fax: "",
            email: "",
            mobile: "",
            website: "",
            gstNo: "",
            mode: "",
            fuelHead: "",
            currency: "",
            origin: "",
            vendorZip: "",
            status: "ACTIVE",
            global: false,
            gstType: "",
            volumetricRound: undefined,
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
                pinCodeId: initialData.pinCodeId != null ? String(initialData.pinCodeId) : "",
                telephone: initialData.telephone,
                fax: initialData.fax || "",
                email: initialData.email,
                mobile: initialData.mobile,
                website: initialData.website || "",
                gstNo: initialData.gstNo || "",
                mode: initialData.mode || "",
                fuelHead: initialData.fuelHead || "",
                currency: initialData.currency || "",
                origin: initialData.origin || "",
                vendorZip: initialData.vendorZip || "",
                status: initialData.status,
                global: initialData.global ?? false,
                gstType: initialData.gstType || "",
                volumetricRound: initialData.volumetricRound ?? undefined,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: VendorFormValues) => {
            const payload = omitEmptyCodeFields(data, ["vendorCode"]) as VendorFormValues
            if (isEdit && initialData) {
                return vendorService.updateVendor(initialData.id, { ...payload, version: initialData.version ?? 1 } as any)
            }
            return vendorService.createVendor(payload as any)
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
                                        <FloatingFormItem label="Vendor Code (optional)">
                                            <FormControl>
                                                <Input placeholder="Blank = auto-generate" {...field} className={FLOATING_INNER_CONTROL} />
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
                                                <Input placeholder="e.g. Bluedart" {...field} className={FLOATING_INNER_CONTROL} />
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
                                    name="telephone"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Telephone*">
                                            <FormControl>
                                                <Input placeholder="Office number" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="fax"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Fax">
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

                    {/* Section 3: Address & Statutory */}
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    3
                                </span>
                                Address & Statutory
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
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
                                    name="pinCodeId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Pin Code ID">
                                            <FormControl>
                                                <Input placeholder="e.g. 486001" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="vendorZip"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Vendor Zip">
                                            <FormControl>
                                                <Input placeholder="e.g. 400004" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
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
                    </FormSection>

                    {/* Section 4: Vendor Config */}
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    4
                                </span>
                                Vendor Settings
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="mode"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Mode">
                                            <FormControl>
                                                <Input placeholder="e.g. AIR" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="fuelHead"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Fuel Head">
                                            <FormControl>
                                                <Input placeholder="e.g. ADVANCED" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="currency"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Currency">
                                            <FormControl>
                                                <Input placeholder="e.g. INR" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="origin"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Origin">
                                            <FormControl>
                                                <Input placeholder="e.g. MUMBAI" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control as any}
                                    name="gstType"
                                    render={({ field }) => (
                                        <FloatingFormItem label="GST Type">
                                            <FormControl>
                                                <Input placeholder="e.g. FORWARD" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control as any}
                                    name="volumetricRound"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Volumetric Round">
                                            <FormControl>
                                                <Input type="number" placeholder="e.g. 5000" {...field} value={field.value ?? ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control as any}
                                name="global"
                                render={({ field }) => (
                                    <FloatingFormItem label="Global">
                                        <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                                                />
                                            </FormControl>
                                        </div>
                                    </FloatingFormItem>
                                )}
                            />
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
