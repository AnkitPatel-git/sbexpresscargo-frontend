"use client"

import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Form, FormControl, FormField } from "@/components/ui/form"
import {
    FloatingFormItem,
    FLOATING_INNER_CONTROL,
    FLOATING_INNER_SELECT_TRIGGER,
} from "@/components/ui/floating-form-item"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormSection } from "@/components/ui/form-section"
import { customerGroupService } from "@/services/masters/customer-group-service"
import type { CustomerGroup } from "@/types/masters/customer-group"

const customerGroupSchema = z.object({
    code: z.string().trim().min(1, "Code is required").max(32, "Code at most 32 characters"),
    name: z.string().trim().min(1, "Name is required").max(255, "Name at most 255 characters"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
})

type CustomerGroupFormValues = z.infer<typeof customerGroupSchema>

interface CustomerGroupFormProps {
    initialData?: CustomerGroup | null
}

export function CustomerGroupForm({ initialData }: CustomerGroupFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<CustomerGroupFormValues>({
        resolver: zodResolver(customerGroupSchema) as Resolver<CustomerGroupFormValues>,
        defaultValues: {
            code: initialData?.code?.trim() ?? "",
            name: initialData?.name ?? "",
            status: initialData?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code.trim(),
                name: initialData.name,
                status: initialData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: CustomerGroupFormValues) => {
            const payload = {
                code: data.code.trim(),
                name: data.name.trim(),
                status: data.status,
            }
            if (isEdit && initialData) {
                return customerGroupService.updateCustomerGroup(initialData.id, {
                    ...payload,
                    version: initialData.version,
                })
            }
            return customerGroupService.createCustomerGroup(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-groups"] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ["customer-group", initialData.id] })
            }
            queryClient.invalidateQueries({ queryKey: ["customer-form", "customer-groups"] })
            queryClient.invalidateQueries({ queryKey: ["customers-list-filter", "customer-groups"] })
            toast.success(`Customer group ${isEdit ? "updated" : "created"} successfully`)
            router.push("/masters/customer-groups")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} customer group`)
        },
    })

    function onSubmit(data: CustomerGroupFormValues) {
        mutation.mutate(data)
    }

    return (
        <FormSection title="Customer group" contentClassName="pt-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FloatingFormItem
                                    label={
                                        <>
                                            Code <span className="text-red-500">*</span>
                                        </>
                                    }
                                >
                                    <FormControl>
                                        <Input placeholder="e.g. CORP-ACME" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FloatingFormItem
                                    label={
                                        <>
                                            Name <span className="text-red-500">*</span>
                                        </>
                                    }
                                >
                                    <FormControl>
                                        <Input placeholder="Display name for reports" {...field} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FloatingFormItem required label="Status" itemClassName="max-w-[200px]">
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
                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="outline" onClick={() => router.push("/masters/customer-groups")}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving..." : isEdit ? "Update group" : "Create group"}
                        </Button>
                    </div>
                </form>
            </Form>
        </FormSection>
    )
}
