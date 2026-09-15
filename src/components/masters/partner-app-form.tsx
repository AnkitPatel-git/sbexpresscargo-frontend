"use client"

import { useEffect, useMemo, useState } from "react"
import { Resolver, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, Loader2 } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField } from "@/components/ui/form"
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
import { MultiSelect } from "@/components/ui/multi-select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { customerService } from "@/services/masters/customer-service"
import { productService } from "@/services/masters/product-service"
import { partnerAppService } from "@/services/masters/partner-app-service"
import { PartnerApp } from "@/types/masters/partner-app"

const partnerAppSchema = z.object({
    code: z.string().min(1, "Code is required").max(32),
    name: z.string().min(1, "Name is required").max(255),
    adapterCode: z.enum(["HAFLE", "GENERIC"]),
    defaultProductId: z.coerce.number().int().positive("Product is required"),
    defaultPaymentType: z.enum(["CASH", "CREDIT", "TO_PAY"]),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    tokenTtlSeconds: z.coerce.number().int().min(60).default(3600),
    customerIds: z.array(z.number()).default([]),
    senderId: z.string().optional(),
    receiverId: z.string().optional(),
    webhookUrl: z.string().optional().or(z.literal("")),
    authType: z.enum(["NONE", "BEARER", "BASIC", "HEADER"]),
    authValue: z.string().optional().or(z.literal("")),
    authHeaderName: z.string().optional().or(z.literal("")),
    webhookActive: z.boolean().default(true),
})

type PartnerAppFormValues = z.infer<typeof partnerAppSchema>

interface PartnerAppFormProps {
    initialData?: PartnerApp | null
}

function extraString(config: Record<string, unknown> | null | undefined, key: string) {
    const value = config?.[key]
    return typeof value === "string" ? value : ""
}

export function PartnerAppForm({ initialData }: PartnerAppFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const [secretDialog, setSecretDialog] = useState<{
        clientId: string
        clientSecret: string
    } | null>(null)
    const [customerSearch, setCustomerSearch] = useState("")
    const debouncedCustomerSearch = useDebounce(customerSearch.trim(), 300)

    const { data: productsResponse } = useQuery({
        queryKey: ["partner-app-form-products"],
        queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: "productName", sortOrder: "asc" }),
    })
    const { data: customersResponse } = useQuery({
        queryKey: ["partner-app-form-customers", debouncedCustomerSearch],
        queryFn: () =>
            customerService.getCustomers({
                page: 1,
                limit: 100,
                search: debouncedCustomerSearch || undefined,
                sortBy: "name",
                sortOrder: "asc",
            }),
    })

    const form = useForm<PartnerAppFormValues>({
        resolver: zodResolver(partnerAppSchema) as Resolver<PartnerAppFormValues>,
        defaultValues: {
            code: "",
            name: "",
            adapterCode: "HAFLE",
            defaultProductId: 0,
            defaultPaymentType: "CREDIT",
            status: "ACTIVE",
            tokenTtlSeconds: 3600,
            customerIds: [],
            senderId: "",
            receiverId: "",
            webhookUrl: "",
            authType: "NONE",
            authValue: "",
            authHeaderName: "",
            webhookActive: true,
        },
    })

    useEffect(() => {
        if (!initialData) return
        form.reset({
            code: initialData.code,
            name: initialData.name,
            adapterCode: initialData.adapterCode,
            defaultProductId: initialData.defaultProductId,
            defaultPaymentType: initialData.defaultPaymentType,
            status: initialData.status,
            tokenTtlSeconds: initialData.tokenTtlSeconds,
            customerIds: (initialData.customers ?? []).map((c) => c.id),
            senderId: extraString(initialData.extraConfig, "SenderID") || extraString(initialData.extraConfig, "senderId"),
            receiverId: extraString(initialData.extraConfig, "ReceiverID") || extraString(initialData.extraConfig, "receiverId"),
            webhookUrl: initialData.webhook?.webhookUrl ?? "",
            authType: initialData.webhook?.authType ?? "NONE",
            authValue: initialData.webhook?.authValue ?? "",
            authHeaderName: initialData.webhook?.authHeaderName ?? "",
            webhookActive: initialData.webhook?.isActive ?? true,
        })
    }, [form, initialData])

    const buildPayload = (data: PartnerAppFormValues): Parameters<typeof partnerAppService.createPartnerApp>[0] => {
        const extraConfig: Record<string, unknown> = {}
        if (data.senderId?.trim()) extraConfig.SenderID = data.senderId.trim()
        if (data.receiverId?.trim()) extraConfig.ReceiverID = data.receiverId.trim()
        return {
            code: data.code.trim().toUpperCase(),
            name: data.name.trim(),
            adapterCode: data.adapterCode,
            defaultProductId: data.defaultProductId,
            defaultPaymentType: data.defaultPaymentType,
            status: data.status,
            tokenTtlSeconds: data.tokenTtlSeconds,
            customerIds: data.customerIds,
            extraConfig,
            ...(data.webhookUrl?.trim()
                ? {
                    webhook: {
                        webhookUrl: data.webhookUrl.trim(),
                        authType: data.authType,
                        authValue: data.authValue?.trim() || undefined,
                        authHeaderName: data.authHeaderName?.trim() || undefined,
                        isActive: data.webhookActive,
                    },
                }
                : {}),
        }
    }

    const mutation = useMutation({
        mutationFn: (data: PartnerAppFormValues) => {
            const payload = buildPayload(data)
            return isEdit && initialData
                ? partnerAppService.updatePartnerApp(initialData.id, payload)
                : partnerAppService.createPartnerApp(payload)
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["partner-apps"] })
            const secret = res.data.clientSecret
            if (secret) {
                setSecretDialog({ clientId: res.data.clientId, clientSecret: secret })
                return
            }
            toast.success(isEdit ? "Partner app updated" : "Partner app created")
            router.push("/masters/partner-apps")
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const rotateMutation = useMutation({
        mutationFn: () => partnerAppService.rotateSecret(initialData!.id),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["partner-apps"] })
            if (res.data.clientSecret) {
                setSecretDialog({ clientId: res.data.clientId, clientSecret: res.data.clientSecret })
            }
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const products = productsResponse?.data ?? []
    const customerOptions = useMemo(() => {
        const byId = new Map<number, { id: number; code: string; name: string }>()
        for (const row of initialData?.customers ?? []) {
            byId.set(row.id, { id: row.id, code: row.code, name: row.name })
        }
        for (const row of customersResponse?.data ?? []) {
            byId.set(row.id, { id: row.id, code: row.code, name: row.name })
        }
        return [...byId.values()].map((c) => ({
            label: `${c.code} — ${c.name}`,
            value: c.id,
        }))
    }, [customersResponse?.data, initialData?.customers])

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
                    <FormSection title="Partner">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FloatingFormItem label="Code">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} disabled={isEdit} {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FloatingFormItem label="Name">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="adapterCode"
                                render={({ field }) => (
                                    <FloatingFormItem label="Adapter">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="HAFLE">HAFLE</SelectItem>
                                                <SelectItem value="GENERIC">GENERIC</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="defaultProductId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Default product">
                                        <Select
                                            onValueChange={(v) => field.onChange(Number(v))}
                                            value={field.value ? String(field.value) : ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.productCode} — {p.productName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="defaultPaymentType"
                                render={({ field }) => (
                                    <FloatingFormItem label="Payment type">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CREDIT">CREDIT</SelectItem>
                                                <SelectItem value="CASH">CASH</SelectItem>
                                                <SelectItem value="TO_PAY">TO_PAY</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tokenTtlSeconds"
                                render={({ field }) => (
                                    <FloatingFormItem label="Token TTL (seconds)">
                                        <FormControl>
                                            <Input type="number" className={FLOATING_INNER_CONTROL} {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <div className="mt-4">
                            <FormField
                                control={form.control}
                                name="customerIds"
                                render={({ field }) => (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Allowed customers</p>
                                        <MultiSelect
                                            enableClientFilter={false}
                                            options={customerOptions}
                                            selected={field.value}
                                            onChange={(vals) => field.onChange(vals.map((v) => Number(v)))}
                                            placeholder="Select branch customers"
                                            searchPlaceholder="Search customers…"
                                            emptyMessage="No customers match. Try another search."
                                            onSearchChange={setCustomerSearch}
                                            onOpenChange={(open) => {
                                                if (!open) setCustomerSearch("")
                                            }}
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Tracking push">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="webhookUrl"
                                render={({ field }) => (
                                    <FloatingFormItem label="Webhook URL">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} placeholder="https://..." {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="authType"
                                render={({ field }) => (
                                    <FloatingFormItem label="Auth type">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NONE">NONE</SelectItem>
                                                <SelectItem value="BEARER">BEARER</SelectItem>
                                                <SelectItem value="BASIC">BASIC</SelectItem>
                                                <SelectItem value="HEADER">HEADER</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="authValue"
                                render={({ field }) => (
                                    <FloatingFormItem label="Auth value">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="authHeaderName"
                                render={({ field }) => (
                                    <FloatingFormItem label="Auth header name">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} placeholder="x-api-key" {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="senderId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Sender ID">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} placeholder="SBEC" {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="receiverId"
                                render={({ field }) => (
                                    <FloatingFormItem label="Receiver ID">
                                        <FormControl>
                                            <Input className={FLOATING_INNER_CONTROL} placeholder="HAFELE" {...field} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="webhookActive"
                                render={({ field }) => (
                                    <div className="flex items-center gap-3 pt-4">
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        <span className="text-sm">Webhook active</span>
                                    </div>
                                )}
                            />
                        </div>
                    </FormSection>

                    {isEdit && (
                        <FormSection title="Credentials">
                            <p className="text-sm text-muted-foreground">
                                Client ID: <span className="font-mono text-foreground">{initialData?.clientId}</span>
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-3"
                                disabled={rotateMutation.isPending}
                                onClick={() => rotateMutation.mutate()}
                            >
                                {rotateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Rotate secret
                            </Button>
                        </FormSection>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.push("/masters/partner-apps")}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Save" : "Create"}
                        </Button>
                    </div>
                </form>
            </Form>

            <Dialog open={!!secretDialog} onOpenChange={(open) => !open && setSecretDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Copy credentials now</DialogTitle>
                        <DialogDescription>
                            The client secret is shown only once. Store it securely before closing.
                        </DialogDescription>
                    </DialogHeader>
                    {secretDialog && (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Client ID</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-sm">{secretDialog.clientId}</code>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={() => {
                                            void navigator.clipboard.writeText(secretDialog.clientId)
                                            toast.success("Client ID copied")
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Client secret</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 break-all rounded bg-muted px-2 py-1 text-sm">{secretDialog.clientSecret}</code>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={() => {
                                            void navigator.clipboard.writeText(secretDialog.clientSecret)
                                            toast.success("Secret copied")
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={() => {
                                setSecretDialog(null)
                                router.push("/masters/partner-apps")
                            }}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
