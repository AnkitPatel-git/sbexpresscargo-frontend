"use client"

import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from 'sonner'
import { Loader2 } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zoneService } from "@/services/masters/zone-service"
import { Zone, ZoneFormData } from "@/types/masters/zone"
import { CountryFloatingAsyncSelect } from "@/components/masters/floating-master-async-selects"
import { omitEmptyCodeFields, optionalMasterCode } from '@/lib/master-code-schema'

const zoneSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: optionalMasterCode(1),
    countryId: z.number().min(1, 'Country is required'),
    zoneType: z.enum(['DOMESTIC', 'VENDOR']),
});

interface ZoneFormProps {
    initialData?: Zone | null
}

export function ZoneForm({ initialData }: ZoneFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData
    const form = useForm<ZoneFormData>({
        resolver: zodResolver(zoneSchema) as Resolver<ZoneFormData>,
        defaultValues: {
            name: initialData?.name || '',
            code: initialData?.code || '',
            countryId: initialData?.countryId || 0,
            zoneType: initialData?.zoneType || 'DOMESTIC',
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                code: initialData.code,
                countryId: initialData.countryId || 0,
                zoneType: initialData.zoneType,
            });
        }
    }, [initialData, form]);

    const mutation = useMutation({
        mutationFn: (data: ZoneFormData) => {
            const payload = omitEmptyCodeFields(data, ['code']) as ZoneFormData
            if (isEdit && initialData) {
                return zoneService.updateZone(initialData.id, {
                    ...payload,
                    version: initialData.version ?? 1,
                })
            }
            return zoneService.createZone(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['zones'] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ['zone', initialData.id] })
            }
            toast.success(isEdit ? "Zone updated successfully" : "Zone created successfully")
            router.push('/masters/zones')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} zone`)
        },
    })

    const onSubmit = (data: ZoneFormData) => {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FloatingFormItem required label="Zone Name">
                                <FormControl>
                                    <Input placeholder="Enter zone name" {...field} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FloatingFormItem label="Zone Code (optional)">
                                <FormControl>
                                    <Input placeholder={isEdit ? '' : 'Blank = auto-generate'} {...field} disabled={isEdit} className={FLOATING_INNER_CONTROL} />
                                </FormControl>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="countryId"
                        render={({ field }) => (
                            <FloatingFormItem required label="Country*">
                                <CountryFloatingAsyncSelect
                                    triggerRef={field.ref}
                                    value={field.value}
                                    onChange={field.onChange}
                                    queryKeyScope={`zone-${String(initialData?.id ?? "new")}`}
                                />
                            </FloatingFormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="zoneType"
                        render={({ field }) => (
                            <FloatingFormItem required label="Zone Type">
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || ""}
                                >
                                    <FormControl>
                                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                            <SelectValue placeholder="Select zone type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="DOMESTIC">Domestic</SelectItem>
                                        <SelectItem value="VENDOR">Vendor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FloatingFormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="outline" onClick={() => router.push('/masters/zones')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mutation.isPending ? "Saving..." : isEdit ? "Update Zone" : "Create Zone"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
