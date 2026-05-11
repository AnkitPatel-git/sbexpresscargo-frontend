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
    CustomerNullableFloatingAsyncSelect,
    ServiceMapFloatingAsyncSelect,
    VendorFloatingAsyncSelect,
} from "@/components/masters/floating-master-async-selects"
import {
    FloatingFormItem,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormSection } from "@/components/ui/form-section"
import { Switch } from "@/components/ui/switch"

import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { VendorConfig } from "@/types/masters/vendor-config"
import type { Customer } from "@/types/masters/customer"
import type { ServiceMap } from "@/types/masters/service-map"
import type { Vendor } from "@/types/masters/vendor"

const vendorConfigSchema = z.object({
    vendorId: z.coerce.number().int().positive("Vendor is required"),
    serviceMapId: z.coerce.number().int().positive("Service map is required"),
    environment: z.enum(["SANDBOX", "PRODUCTION"]),
    customerId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
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

    const extraVendor = useMemo(
        () => (initialData?.vendor ? ([initialData.vendor] as unknown as Vendor[]) : undefined),
        [initialData?.vendor],
    )

    const extraCustomer = useMemo(
        () => (initialData?.customer ? ([initialData.customer] as Customer[]) : undefined),
        [initialData?.customer],
    )

    const extraServiceMap = useMemo((): ServiceMap[] | undefined => {
        if (!initialData?.serviceMap) return undefined
        const sm = initialData.serviceMap
        const v = initialData.vendor
        return [
            {
                id: sm.id,
                vendorId: initialData.vendorId,
                serviceType: sm.serviceType as ServiceMap["serviceType"],
                minWeight: 0,
                maxWeight: 0,
                status: "ACTIVE",
                vendorLink: sm.vendorLink,
                isSinglePiece: false,
                createdAt: "",
                updatedAt: "",
                createdById: null,
                updatedById: null,
                deletedAt: null,
                deletedById: null,
                vendor: v ? { id: v.id, vendorCode: v.vendorCode, vendorName: v.vendorName } : null,
            } as ServiceMap,
        ]
    }, [initialData?.serviceMap, initialData?.vendor, initialData?.vendorId])

    const form = useForm<VendorConfigFormValues>({
        resolver: zodResolver(vendorConfigSchema) as Resolver<VendorConfigFormValues>,
        defaultValues: {
            vendorId: 0,
            serviceMapId: 0,
            environment: "SANDBOX",
            customerId: null,
            apiKey: "",
            secretKey: "",
            baseUrl: "",
            isActive: true,
        },
    })

    useEffect(() => {
        if (!initialData) return

        form.reset({
            vendorId: initialData.vendorId,
            serviceMapId: initialData.serviceMapId,
            environment: initialData.environment,
            customerId: initialData.customerId,
            apiKey: initialData.apiKey ?? "",
            secretKey: initialData.secretKey ?? "",
            baseUrl: initialData.baseUrl ?? "",
            isActive: initialData.isActive,
        })
    }, [form, initialData])

    const mutation = useMutation({
        mutationFn: (data: VendorConfigFormValues) => {
            const payload = {
                vendorId: data.vendorId,
                serviceMapId: data.serviceMapId,
                environment: data.environment,
                customerId: data.customerId ?? undefined,
                apiKey: data.apiKey || undefined,
                secretKey: data.secretKey || undefined,
                baseUrl: data.baseUrl || undefined,
                isActive: data.isActive,
            }

            if (isEdit && initialData) {
                return vendorConfigService.updateVendorConfig(initialData.id, payload)
            }

            return vendorConfigService.createVendorConfig(payload)
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

    const onSubmit = (data: VendorConfigFormValues) => {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                            control={form.control}
                            name="vendorId"
                            render={({ field }) => (
                                <FloatingFormItem required label="Vendor*">
                                    <FormControl>
                                        <VendorFloatingAsyncSelect
                                            triggerRef={field.ref}
                                            allowClear={false}
                                            value={field.value > 0 ? field.value : undefined}
                                            onChange={(v) => field.onChange(v ?? 0)}
                                            queryKeyScope={isEdit && initialData ? `vendor-config-${initialData.id}` : "vendor-config-new"}
                                            extraVendors={extraVendor}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="serviceMapId"
                            render={({ field }) => (
                                <FloatingFormItem required label="Service Map*">
                                    <FormControl>
                                        <ServiceMapFloatingAsyncSelect
                                            triggerRef={field.ref}
                                            value={field.value > 0 ? field.value : undefined}
                                            onChange={(v) => field.onChange(v ?? 0)}
                                            queryKeyScope={isEdit && initialData ? `vendor-config-${initialData.id}` : "vendor-config-new"}
                                            extraServiceMaps={extraServiceMap}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="environment"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Environment*">
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

                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FloatingFormItem label="Active">
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FloatingFormItem label="Customer">
                                    <FormControl>
                                        <CustomerNullableFloatingAsyncSelect
                                            triggerRef={field.ref}
                                            value={field.value}
                                            onChange={field.onChange}
                                            queryKeyScope={isEdit && initialData ? `vendor-config-${initialData.id}` : "vendor-config-new"}
                                            extraCustomers={extraCustomer}
                                        />
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
                            control={form.control}
                            name="baseUrl"
                            render={({ field }) => (
                                <FloatingFormItem label="Base URL">
                                    <FormControl>
                                        <Input
                                            placeholder="https://vendor.example.com"
                                            {...field}
                                            value={field.value || ""}
                                            className={FLOATING_INNER_CONTROL}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
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
                            control={form.control}
                            name="secretKey"
                            render={({ field }) => (
                                <FloatingFormItem label="Secret Key">
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Secret key"
                                            {...field}
                                            value={field.value || ""}
                                            className={FLOATING_INNER_CONTROL}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </FormSection>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        type="button"
                        variant="expressDanger"
                        onClick={() => router.push("/masters/vendor-config")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </span>
                        ) : isEdit ? (
                            "Update"
                        ) : (
                            "Create"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
