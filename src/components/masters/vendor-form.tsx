"use client"

import { useEffect, useMemo } from "react"
import { Resolver, useForm } from "react-hook-form"
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

import { vendorService } from "@/services/masters/vendor-service"
import { Vendor, VendorFormData } from "@/types/masters/vendor"
import type { Bank } from "@/types/masters/bank"
import { BankFloatingAsyncSelect } from "@/components/masters/floating-master-async-selects"
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema"
import {
    getInitialPincode,
    normalizeOptionalPincode,
    normalizePincodeInput,
    optionalPincodeField,
} from "@/lib/pincode-field"

const optionalTrim = z.string().optional().or(z.literal(""))

const vendorSchema = z.object({
    vendorCode: optionalMasterCode(2),
    vendorName: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().min(3, "Contact person is required"),
    address1: optionalTrim,
    address2: z.string().optional(),
    pinCodeId: optionalPincodeField(),
    bankId: z.coerce.number().int().min(0),
    bankAccount: optionalTrim,
    bankIfsc: optionalTrim,
    telephone: optionalTrim,
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile must be at least 10 characters"),
    website: z.string().url("Invalid website URL").optional().or(z.literal("")),
    gstNo: z.string().optional(),
    vendorZip: z.string().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

type VendorFormValues = z.infer<typeof vendorSchema>

function toVendorPayload(data: VendorFormValues): VendorFormData {
    const base: VendorFormData = {
        ...omitEmptyCodeFields({ vendorCode: data.vendorCode }, ["vendorCode"]),
        pinCodeId: normalizeOptionalPincode(data.pinCodeId),
        vendorName: data.vendorName,
        contactPerson: data.contactPerson,
        email: data.email,
        mobile: data.mobile,
        status: data.status,
        address1: data.address1?.trim() || undefined,
        address2: data.address2?.trim() || undefined,
        telephone: data.telephone?.trim() || undefined,
        website: data.website?.trim() || undefined,
        gstNo: data.gstNo?.trim() || undefined,
        vendorZip: data.vendorZip?.trim() || undefined,
    }
    if (data.bankId > 0) {
        return {
            ...base,
            bankId: data.bankId,
            bankAccount: data.bankAccount?.trim() || undefined,
            bankIfsc: data.bankIfsc?.trim() || undefined,
        }
    }
    return {
        ...base,
        bankId: null,
        bankAccount: null,
        bankIfsc: null,
    }
}

interface VendorFormProps {
    initialData?: Vendor | null
}

export function VendorForm({ initialData }: VendorFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const extraBanks = useMemo((): Bank[] | undefined => {
        const b = initialData?.bank
        if (!b || !initialData?.bankId) return undefined
        return [
            {
                id: b.id,
                bankCode: b.bankCode ?? "",
                bankName: b.bankName,
                status: (b.status ?? "ACTIVE") as Bank["status"],
                createdAt: "",
                updatedAt: "",
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
            },
        ]
    }, [initialData?.bank, initialData?.bankId])

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
            vendorZip: "",
            status: "ACTIVE",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                vendorCode: initialData.vendorCode,
                vendorName: initialData.vendorName,
                contactPerson: initialData.contactPerson,
                address1: initialData.address1 ?? "",
                address2: initialData.address2 || "",
                pinCodeId: getInitialPincode(initialData),
                bankId: initialData.bankId ?? 0,
                bankAccount: initialData.bankAccount || "",
                bankIfsc: initialData.bankIfsc || "",
                telephone: initialData.telephone ?? "",
                email: initialData.email,
                mobile: initialData.mobile,
                website: initialData.website || "",
                gstNo: initialData.gstNo || "",
                vendorZip: initialData.vendorZip || "",
                status: initialData.status,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: VendorFormValues) => {
            const payload = toVendorPayload(data)
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
                                        <FloatingFormItem label="Telephone">
                                            <FormControl>
                                                <Input placeholder="Office number (optional)" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
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
                                    <FloatingFormItem label="Address Line 1">
                                        <FormControl>
                                            <Input placeholder="Street address (optional)" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
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

                    {/* Section 4: Bank (optional) */}
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    4
                                </span>
                                Bank (optional)
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                            <FormField
                                control={form.control}
                                name="bankId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Bank">
                                        <BankFloatingAsyncSelect
                                            optional
                                            triggerRef={field.ref}
                                            value={field.value}
                                            onChange={field.onChange}
                                            queryKeyScope={`vendor-${String(initialData?.id ?? "new")}`}
                                            extraBanks={extraBanks}
                                        />
                                    </FloatingFormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bankAccount"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Bank Account">
                                            <FormControl>
                                                <Input placeholder="Account number (optional)" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankIfsc"
                                    render={({ field }) => (
                                        <FloatingFormItem label="Bank IFSC">
                                            <FormControl>
                                                <Input placeholder="IFSC code (optional)" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
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
