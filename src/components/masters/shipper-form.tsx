"use client"

import { useEffect } from "react"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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

import { bankService } from "@/services/masters/bank-service"
import { shipperService } from "@/services/masters/shipper-service"
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema"
import {
    getInitialPincode,
    normalizePincodeInput,
    requiredPincodeField,
} from "@/lib/pincode-field"
import { Shipper, ShipperFormData } from "@/types/masters/shipper"

const shipperSchema = z.object({
    shipperCode: optionalMasterCode(2),
    shipperName: z.string().min(3, "Name must be at least 3 characters"),
    contactPerson: z.string().optional().or(z.literal("")),
    address1: z.string().optional().or(z.literal("")),
    address2: z.string().optional().or(z.literal("")),
    pinCodeId: requiredPincodeField(),
    telephone: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address").or(z.literal("")),
    mobile: z.string().optional().or(z.literal("")),
    aadhaarNo: z.string().optional().or(z.literal("")),
    panNo: z.string().optional().or(z.literal("")),
    bankId: z.coerce.number().int().positive("Bank is required"),
    bankAccount: z.string().min(1, "Bank account is required"),
    bankIfsc: z.string().min(1, "Bank IFSC is required"),
    firmType: z.enum(["GOV", "NON_GOV"]),
})

type ShipperFormValues = z.infer<typeof shipperSchema>

interface ShipperFormProps {
    initialData?: Shipper | null
}

export function ShipperForm({ initialData }: ShipperFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const { data: banksResponse } = useQuery({
        queryKey: ["banks-list-shipper-form"],
        queryFn: () => bankService.getBanks({ page: 1, limit: 100, sortBy: "bankName", sortOrder: "asc" }),
    })

    const form = useForm<ShipperFormValues>({
        resolver: zodResolver(shipperSchema) as Resolver<ShipperFormValues>,
        defaultValues: {
            shipperCode: "",
            shipperName: "",
            contactPerson: "",
            address1: "",
            address2: "",
            pinCodeId: "",
            telephone: "",
            email: "",
            mobile: "",
            aadhaarNo: "",
            panNo: "",
            bankId: 0,
            bankAccount: "",
            bankIfsc: "",
            firmType: "NON_GOV",
        },
    })

    useEffect(() => {
        if (!initialData) return

        form.reset({
            shipperCode: initialData.shipperCode || "",
            shipperName: initialData.shipperName || "",
            contactPerson: initialData.contactPerson || "",
            address1: initialData.address1 || "",
            address2: initialData.address2 || "",
            pinCodeId: getInitialPincode(initialData),
            telephone: initialData.telephone || "",
            email: initialData.email || "",
            mobile: initialData.mobile || "",
            aadhaarNo: initialData.aadhaarNo || "",
            panNo: initialData.panNo || "",
            bankId: initialData.bankId ?? 0,
            bankAccount: initialData.bankAccount || "",
            bankIfsc: initialData.bankIfsc || "",
            firmType: (initialData.firmType as "GOV" | "NON_GOV") || "NON_GOV",
        })
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (values: ShipperFormValues) => {
            const payload = omitEmptyCodeFields(values, ["shipperCode"]) as ShipperFormData
            return isEdit && initialData
                ? shipperService.updateShipper(initialData.id, payload)
                : shipperService.createShipper(payload)
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSection title="Basic Information" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="shipperCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Shipper Code (optional)">
                                        <FormControl>
                                            <Input placeholder="Blank = auto-generate" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="shipperName"
                                render={({ field }) => (
                                    <FloatingFormItem label="Shipper Name">
                                        <FormControl>
                                            <Input placeholder="Sender name" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactPerson"
                                render={({ field }) => (
                                    <FloatingFormItem label="Contact Person">
                                        <FormControl>
                                            <Input placeholder="Contact person" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="firmType"
                                render={({ field }) => (
                                    <FloatingFormItem label="Firm Type">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="GOV">GOV</SelectItem>
                                                <SelectItem value="NON_GOV">NON_GOV</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Contact Information" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FloatingFormItem label="Mobile">
                                        <FormControl>
                                            <Input placeholder="Mobile no" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telephone"
                                render={({ field }) => (
                                    <FloatingFormItem label="Telephone">
                                        <FormControl>
                                            <Input placeholder="Telephone no" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FloatingFormItem label="Email">
                                    <FormControl>
                                        <Input placeholder="shipper@example.com" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection className="md:col-span-2" title="Address" contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FloatingFormItem label="Address Line 1">
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
                                        <Input placeholder="Landmark, floor, etc." {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pinCodeId"
                            render={({ field }) => (
                                <FloatingFormItem label="Pin Code">
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value || ''}
                                            inputMode="numeric"
                                            maxLength={6}
                                            onChange={(event) => field.onChange(normalizePincodeInput(event.target.value))}
                                            placeholder="Pin code"
                                            className={FLOATING_INNER_CONTROL}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection title="Identification" contentClassName="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="aadhaarNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="Aadhaar No">
                                        <FormControl>
                                            <Input placeholder="Aadhaar number" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="panNo"
                                render={({ field }) => (
                                    <FloatingFormItem label="PAN No">
                                        <FormControl>
                                            <Input placeholder="PAN number" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Bank Details" contentClassName="space-y-4">
                        <FormField
                            control={form.control}
                            name="bankId"
                            render={({ field }) => (
                                <FloatingFormItem label="Bank">
                                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ''}>
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
                        <FormField
                            control={form.control}
                            name="bankAccount"
                            render={({ field }) => (
                                <FloatingFormItem label="Bank Account">
                                    <FormControl>
                                        <Input placeholder="Bank account number" {...field} className={FLOATING_INNER_CONTROL} />
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
                                        <Input placeholder="IFSC code" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                    <Button type="button" variant="expressDanger" onClick={() => router.push("/masters/shipper")}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Shipper" : "Create Shipper"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
