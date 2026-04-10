"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"

import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { vendorService } from "@/services/masters/vendor-service"
import { customerService } from "@/services/masters/customer-service"
import { VendorConfig } from "@/types/masters/vendor-config"

const vendorConfigSchema = z.object({
    vendorId: z.coerce.number().min(1, "Vendor is required"),
    mode: z.enum(["B2B", "B2C", "API"]),
    environment: z.enum(["SANDBOX", "PRODUCTION"]),
    customerId: z.coerce.number().nullable().optional(),
    apiKey: z.string().optional().or(z.literal("")),
    secretKey: z.string().optional().or(z.literal("")),
    baseUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    isActive: z.boolean().default(true),
})

type VendorConfigFormValues = z.infer<typeof vendorConfigSchema>

interface VendorConfigFormProps {
    initialData?: VendorConfig | null
}

export function VendorConfigForm({ initialData }: VendorConfigFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const { data: vendorsResponse } = useQuery({
        queryKey: ["vendors-list"],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const { data: customersResponse } = useQuery({
        queryKey: ["customers-list"],
        queryFn: () => customerService.getCustomers({ limit: 100 }),
    })

    const form = useForm<VendorConfigFormValues>({
        resolver: zodResolver(vendorConfigSchema) as any,
        defaultValues: {
            vendorId: 0,
            mode: "B2B",
            environment: "PRODUCTION",
            customerId: null,
            apiKey: "",
            secretKey: "",
            baseUrl: "",
            isActive: true,
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                vendorId: initialData.vendorId,
                mode: initialData.mode,
                environment: initialData.environment,
                customerId: initialData.customerId,
                apiKey: initialData.apiKey || "",
                secretKey: initialData.secretKey || "",
                baseUrl: initialData.baseUrl || "",
                isActive: initialData.isActive,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: VendorConfigFormValues) => {
            const payload = {
                ...data,
                apiKey: data.apiKey || undefined,
                secretKey: data.secretKey || undefined,
                baseUrl: data.baseUrl || undefined,
                customerId: data.customerId || undefined,
            }
            if (isEdit && initialData) {
                return vendorConfigService.updateVendorConfig(initialData.id, payload as any)
            }
            return vendorConfigService.createVendorConfig(payload as any)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-configs"] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ["vendor-config", initialData.id] })
            }
            toast.success(`Vendor config ${isEdit ? "updated" : "created"} successfully`)
            router.push("/masters/vendor-config")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} vendor config`)
        },
    })

    function onSubmit(data: VendorConfigFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    1
                                </span>
                                Integration Setup
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                        <FormField
                            control={form.control as any}
                            name="vendorId"
                            render={({ field }) => (
                                <FloatingFormItem label="Vendor*">
                                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select vendor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vendorsResponse?.data?.map((v) => (
                                                <SelectItem key={v.id} value={String(v.id)}>{v.vendorName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control as any}
                                name="mode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Mode*">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="B2B">B2B</SelectItem>
                                                <SelectItem value="B2C">B2C</SelectItem>
                                                <SelectItem value="API">API</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control as any}
                                name="environment"
                                render={({ field }) => (
                                    <FloatingFormItem label="Environment*">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select environment" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SANDBOX">Sandbox</SelectItem>
                                                <SelectItem value="PRODUCTION">Production</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control as any}
                            name="customerId"
                            render={({ field }) => (
                                <FloatingFormItem label="Customer (optional)">
                                    <Select onValueChange={(v) => field.onChange(v ? Number(v) : null)} value={field.value ? String(field.value) : ""}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {customersResponse?.data?.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="isActive"
                            render={({ field }) => (
                                <FloatingFormItem label="Active">
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>

                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    2
                                </span>
                                API Credentials
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                        <FormField
                            control={form.control as any}
                            name="baseUrl"
                            render={({ field }) => (
                                <FloatingFormItem label="Base URL">
                                    <FormControl>
                                        <Input placeholder="https://vendor.example.com" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="apiKey"
                            render={({ field }) => (
                                <FloatingFormItem label="API Key">
                                    <FormControl>
                                        <Input placeholder="API key" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control as any}
                            name="secretKey"
                            render={({ field }) => (
                                <FloatingFormItem label="Secret Key">
                                    <FormControl>
                                        <Input type="password" placeholder="Secret key" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/masters/vendor-config")}
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
                            "Update Config"
                        ) : (
                            "Create Config"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
