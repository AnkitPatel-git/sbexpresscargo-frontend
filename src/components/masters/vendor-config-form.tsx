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

import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { vendorService } from "@/services/masters/vendor-service"
import { customerService } from "@/services/masters/customer-service"
import { serviceMapService } from "@/services/masters/service-map-service"
import { VendorConfig } from "@/types/masters/vendor-config"

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

    const { data: vendorsResponse } = useQuery({
        queryKey: ["vendor-config-form-vendors"],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: "vendorName", sortOrder: "asc" }),
    })

    const { data: customersResponse } = useQuery({
        queryKey: ["vendor-config-form-customers"],
        queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
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
                                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select vendor" />
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
                                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select service map" />
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
                                    <Select
                                        onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                                        value={field.value ? String(field.value) : "none"}
                                    >
                                        <FormControl>
                                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {customersResponse?.data?.map((customer) => (
                                                <SelectItem key={customer.id} value={String(customer.id)}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
