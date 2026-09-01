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
import { Switch } from "@/components/ui/switch"
import { optionLabelById, optionLabelForSelect, TRACKING_ADAPTER_OPTIONS, VENDOR_ENVIRONMENT_OPTIONS } from "@/lib/select-closed-label"

import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { vendorService } from "@/services/masters/vendor-service"
import { serviceMapService } from "@/services/masters/service-map-service"
import { VendorConfig } from "@/types/masters/vendor-config"

const trackingAdapterSchema = z.enum(["DELHIVERY", "BLUEDART"])

const vendorConfigSchema = z.object({
    vendorId: z.coerce.number().int().positive("Vendor is required"),
    serviceMapId: z.coerce.number().int().positive("Service map is required"),
    environment: z.enum(["SANDBOX", "PRODUCTION"]),
    adapter: trackingAdapterSchema,
    apiKey: z.string().optional().or(z.literal("")),
    secretKey: z.string().optional().or(z.literal("")),
    baseUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
    loginId: z.string().optional().or(z.literal("")),
    licenseKey: z.string().optional().or(z.literal("")),
    isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.adapter !== "BLUEDART") return
    if (!data.loginId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Login ID is required for BlueDart", path: ["loginId"] })
    }
    if (!data.licenseKey?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "License key is required for BlueDart", path: ["licenseKey"] })
    }
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
        queryKey: ["vendor-config-form-vendors"],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: "vendorName", sortOrder: "asc" }),
    })

    const { data: serviceMapsResponse } = useQuery({
        queryKey: ["vendor-config-form-service-maps"],
        queryFn: () => serviceMapService.getServiceMaps({ page: 1, limit: 100, sortBy: "vendor", sortOrder: "asc" }),
    })

    const form = useForm<VendorConfigFormValues>({
        resolver: zodResolver(vendorConfigSchema) as Resolver<VendorConfigFormValues>,
        defaultValues: {
            vendorId: 0,
            serviceMapId: 0,
            environment: "SANDBOX",
            adapter: "DELHIVERY",
            apiKey: "",
            secretKey: "",
            baseUrl: "",
            loginId: "",
            licenseKey: "",
            isActive: true,
        },
    })

    useEffect(() => {
        if (!initialData) return

        form.reset({
            vendorId: initialData.vendorId,
            serviceMapId: initialData.serviceMapId,
            environment: initialData.environment,
            adapter: knownTrackingAdapter(initialData.adapter) || knownTrackingAdapter(initialData.vendor?.vendorCode) || "DELHIVERY",
            apiKey: initialData.apiKey ?? "",
            secretKey: initialData.secretKey ?? "",
            baseUrl: initialData.baseUrl ?? "",
            loginId: extraConfigString(initialData.extraConfig, "loginId"),
            licenseKey: extraConfigString(initialData.extraConfig, "licenseKey"),
            isActive: initialData.isActive,
        })
    }, [form, initialData])

    const mutation = useMutation({
        mutationFn: (data: VendorConfigFormValues) => {
            const payload = {
                vendorId: data.vendorId,
                serviceMapId: data.serviceMapId,
                environment: data.environment,
                adapter: data.adapter,
                apiKey: data.apiKey || undefined,
                secretKey: data.secretKey || undefined,
                baseUrl: data.baseUrl || undefined,
                extraConfig:
                    data.adapter === "BLUEDART"
                        ? {
                              loginId: data.loginId?.trim(),
                              licenseKey: data.licenseKey?.trim(),
                          }
                        : undefined,
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

    const selectedAdapter = form.watch("adapter")

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
                                    <Select
                                        key={`vendor-${field.value}`}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value ? String(field.value) : ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select vendor">
                                                    {optionLabelById(
                                                        field.value ? String(field.value) : "",
                                                        vendorsResponse?.data,
                                                        (v) => v.vendorName,
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {vendorsResponse?.data?.map((vendor) => (
                                                <SelectItem key={vendor.id} value={String(vendor.id)}>
                                                    {vendor.vendorName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="serviceMapId"
                            render={({ field }) => (
                                <FloatingFormItem required label="Service Map*">
                                    <Select
                                        key={`svcmap-${field.value}`}
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value ? String(field.value) : ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select service map">
                                                    {optionLabelById(
                                                        field.value ? String(field.value) : "",
                                                        serviceMapsResponse?.data,
                                                        (sm) =>
                                                            sm.vendor?.vendorName
                                                                ? `${sm.vendor.vendorName} - ${sm.serviceType}`
                                                                : `${sm.serviceType} - ${sm.id}`,
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {serviceMapsResponse?.data?.map((serviceMap) => (
                                                <SelectItem key={serviceMap.id} value={String(serviceMap.id)}>
                                                    {serviceMap.vendor?.vendorName
                                                        ? `${serviceMap.vendor.vendorName} - ${serviceMap.serviceType}`
                                                        : `${serviceMap.serviceType} - ${serviceMap.id}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FloatingFormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="environment"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Environment*">
                                        <Select key={`env-${field.value}`} onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select environment">
                                                        {optionLabelForSelect(field.value, VENDOR_ENVIRONMENT_OPTIONS)}
                                                    </SelectValue>
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
                                name="adapter"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Tracking Adapter*">
                                        <Select key={`adapter-${field.value}`} onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select adapter">
                                                        {optionLabelForSelect(field.value, TRACKING_ADAPTER_OPTIONS)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TRACKING_ADAPTER_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>

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
                        {selectedAdapter === "DELHIVERY" || selectedAdapter === "BLUEDART" ? null : (
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
                        )}

                        <FormField
                            control={form.control}
                            name="apiKey"
                            render={({ field }) => (
                                <FloatingFormItem label={selectedAdapter === "BLUEDART" ? "Client ID" : "Username / API Key"}>
                                    <FormControl>
                                        <Input placeholder={selectedAdapter === "BLUEDART" ? "Client ID" : "API username"} {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="secretKey"
                            render={({ field }) => (
                                <FloatingFormItem label={selectedAdapter === "BLUEDART" ? "Client Secret" : "Password / Secret Key"}>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={selectedAdapter === "BLUEDART" ? "Client secret" : "API password"}
                                            {...field}
                                            value={field.value || ""}
                                            className={FLOATING_INNER_CONTROL}
                                        />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />

                        {selectedAdapter === "BLUEDART" ? (
                            <>
                                <FormField
                                    control={form.control}
                                    name="loginId"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="Login ID*">
                                            <FormControl>
                                                <Input placeholder="BlueDart login ID" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="licenseKey"
                                    render={({ field }) => (
                                        <FloatingFormItem required label="License Key*">
                                            <FormControl>
                                                <Input placeholder="BlueDart license key" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                            </FormControl>
                                        </FloatingFormItem>
                                    )}
                                />
                            </>
                        ) : null}
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

function knownTrackingAdapter(value: string | null | undefined): "DELHIVERY" | "BLUEDART" | "" {
    const code = value?.trim().toUpperCase()
    if (code === "DELHIVERY" || code === "BLUEDART") return code
    return ""
}

function extraConfigString(extra: Record<string, unknown> | null | undefined, key: string): string {
    if (!extra) return ""
    const value = extra[key] ?? extra[key.toLowerCase()] ?? extra[key.toUpperCase()]
    return typeof value === "string" ? value : ""
}
