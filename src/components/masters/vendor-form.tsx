"use client"

import { useState, useEffect } from "react"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"
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
import { bankService } from "@/services/masters/bank-service"
import { Vendor, VendorFormData } from "@/types/masters/vendor"
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema"
import {
    getInitialPincode,
    normalizeOptionalPincode,
    normalizePincodeInput,
    optionalPincodeField,
} from "@/lib/pincode-field"

const vendorSchema = z.object({
    vendorCode: optionalMasterCode(2),
    vendorName: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: z.string().min(5, "Address must be at least 5 characters"),
    address2: z.string().optional(),
    pinCodeId: optionalPincodeField(),
    bankId: z.coerce.number().int().positive("Bank is required"),
    bankAccount: z.string().min(1, "Bank account is required"),
    bankIfsc: z.string().min(1, "Bank IFSC is required"),
    telephone: z.string().min(10, "Telephone must be at least 10 characters"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    gstNo: z.string().optional(),
    currency: z.string().optional().or(z.literal("")),
    origin: z.string().optional().or(z.literal("")),
    vendorZip: z.string().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    global: z.boolean().default(false),
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
    const { data: banksResponse } = useQuery({
        queryKey: ["vendor-form-banks"],
        queryFn: () => bankService.getBanks({ page: 1, limit: 100, sortBy: "bankName", sortOrder: "asc" }),
    })

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorSchema) as Resolver<VendorFormValues>,
        defaultValues: {
            vendorCode: "",
            vendorName: "",
            contactPerson: "",
            address1: "",
            address2: "",
            pinCodeId: "",
            bankId: 0,
            bankAccount: "",
            bankIfsc: "",
            telephone: "",
            email: "",
            mobile: "",
            website: "",
            gstNo: "",
            currency: "",
            origin: "",
            vendorZip: "",
            status: "ACTIVE",
            global: false,
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
                pinCodeId: getInitialPincode(initialData),
                bankId: initialData.bankId ?? 0,
                bankAccount: initialData.bankAccount || "",
                bankIfsc: initialData.bankIfsc || "",
                telephone: initialData.telephone,
                email: initialData.email,
                mobile: initialData.mobile,
                website: initialData.website || "",
                gstNo: initialData.gstNo || "",
                currency: initialData.currency || "",
                origin: initialData.origin || "",
                vendorZip: initialData.vendorZip || "",
                status: initialData.status,
                global: initialData.global ?? false,
                volumetricRound: initialData.volumetricRound ?? undefined,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: VendorFormValues) => {
            const payload: VendorFormData = {
                ...omitEmptyCodeFields(data, ["vendorCode"]),
                pinCodeId: normalizeOptionalPincode(data.pinCodeId),
            }
            if (isEdit && initialData) {
                return vendorService.updateVendor(initialData.id, { ...payload, version: initialData.version ?? 1 })
            }
            return vendorService.createVendor(payload)
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                    control={form.control}
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
                                    control={form.control}
                                    name="vendorName"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Vendor Name*">
                                            <FormControl>
                                                <Input placeholder="e.g. Bluedart" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Contact Person*">
                                        <FormControl>
                                            <Input placeholder="Name of contact" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
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
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Mobile*">
                                            <FormControl>
                                                <Input placeholder="10 digit number" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Email Address*">
                                            <FormControl>
                                                <Input placeholder="vendor@example.com" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="telephone"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Telephone*">
                                            <FormControl>
                                                <Input placeholder="Office number" {...field} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <div />
                            </div>
                            <FormField
                                control={form.control}
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
                                control={form.control}
                                name="address1"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Address Line 1*">
                                        <FormControl>
                                            <Input placeholder="Street address" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
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
                                    control={form.control}
                                    name="pinCodeId"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Pin Code">
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. 486001"
                                                    {...field}
                                                    value={field.value || ""}
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    className={FLOATING_INNER_CONTROL}
                                                    onChange={(event) => field.onChange(normalizePincodeInput(event.target.value))}
                                                />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
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
                                control={form.control}
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
                                    control={form.control}
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
                                    control={form.control}
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
                                    control={form.control}
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
                                control={form.control}
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
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bankId"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Bank">
                                            <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                                                <FormControl>
                                                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                        <SelectValue placeholder="Select bank" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {banksResponse?.data?.map((bank) => (
                                                        <SelectItem key={bank.id} value={String(bank.id)}>
                                                            {bank.bankName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FloatingFormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bankAccount"
                                        render={({ field }) => (
                                            <FloatingFormItem required label="Bank Account">
                                                <FormControl>
                                                    <Input placeholder="Account number" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                                </FormControl>
                                            </FloatingFormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bankIfsc"
                                        render={({ field }) => (
                                            <FloatingFormItem required label="Bank IFSC">
                                                <FormControl>
                                                    <Input placeholder="IFSC code" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
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
                        variant="expressDanger"
                        onClick={() => router.push("/masters/vendor")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={mutation.isPending} className="px-8">
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
