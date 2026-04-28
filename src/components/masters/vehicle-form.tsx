"use client"

import { useEffect } from "react"
import { useForm, Resolver } from "react-hook-form"
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

import { vehicleService } from "@/services/masters/vehicle-service"
import { Vehicle } from "@/types/masters/vehicle"

const VEHICLE_TYPES = [
    { value: "TWO_WHEELER", label: "Two Wheeler" },
    { value: "THREE_WHEELER", label: "Three Wheeler" },
    { value: "PICKUP_TRUCK", label: "Pickup Truck" },
    { value: "LCV", label: "LCV" },
    { value: "HCV", label: "HCV" },
    { value: "TRAILER", label: "Trailer" },
    { value: "CONTAINER", label: "Container" },
    { value: "TANKER", label: "Tanker" },
    { value: "OTHER", label: "Other" },
] as const

const vehicleSchema = z.object({
    vehicleNo: z.string().min(1, "Vehicle number is required").max(20),
    vehicleType: z.enum(["TWO_WHEELER", "THREE_WHEELER", "PICKUP_TRUCK", "LCV", "HCV", "TRAILER", "CONTAINER", "TANKER", "OTHER"]),
    ownerName: z.string().optional().or(z.literal("")),
    driverName: z.string().optional().or(z.literal("")),
    driverUserId: z.coerce.number().nullable().optional(),
    capacityKg: z.coerce.number().nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

interface VehicleFormProps {
    initialData?: Vehicle | null
}

export function VehicleForm({ initialData }: VehicleFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const isEdit = !!initialData

    const form = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema) as Resolver<VehicleFormValues>,
        defaultValues: {
            vehicleNo: "",
            vehicleType: "TRAILER",
            ownerName: "",
            driverName: "",
            driverUserId: null,
            capacityKg: null,
            status: "ACTIVE",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                vehicleNo: initialData.vehicleNo,
                vehicleType: initialData.vehicleType,
                ownerName: initialData.ownerName || "",
                driverName: initialData.driverName || "",
                driverUserId: initialData.driverUserId,
                capacityKg: initialData.capacityKg ? Number(initialData.capacityKg) : null,
                status: initialData.status,
            })
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: (data: VehicleFormValues) => {
            const payload = {
                ...data,
                ownerName: data.ownerName || undefined,
                driverName: data.driverName || undefined,
                driverUserId: data.driverUserId ?? undefined,
                capacityKg: data.capacityKg ?? undefined,
            }
            if (isEdit && initialData) {
                return vehicleService.updateVehicle(initialData.id, payload)
            }
            return vehicleService.createVehicle(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] })
            if (isEdit && initialData) {
                queryClient.invalidateQueries({ queryKey: ["vehicle", initialData.id] })
            }
            toast.success(`Vehicle ${isEdit ? "updated" : "created"} successfully`)
            router.push("/masters/vehicle")
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} vehicle`)
        },
    })

    function onSubmit(data: VehicleFormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    1
                                </span>
                                Vehicle Details
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vehicleNo"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Vehicle Number*">
                                        <FormControl>
                                            <Input placeholder="e.g. MH01AB1234" {...field} className={FLOATING_INNER_CONTROL} />
                                        </FormControl>
                                    </FloatingFormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vehicleType"
                                render={({ field }) => (
                                    <FloatingFormItem required label="Vehicle Type*">
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {VEHICLE_TYPES.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FloatingFormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="capacityKg"
                            render={({ field }) => (
                                <FloatingFormItem label="Capacity (kg)">
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 2500" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} className={FLOATING_INNER_CONTROL} />
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

                    <FormSection
                        title={
                            <span className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
                                    2
                                </span>
                                Owner & Driver
                            </span>
                        }
                        contentClassName="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="ownerName"
                            render={({ field }) => (
                                <FloatingFormItem label="Owner Name">
                                    <FormControl>
                                        <Input placeholder="Vehicle owner" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="driverName"
                            render={({ field }) => (
                                <FloatingFormItem label="Driver Name">
                                    <FormControl>
                                        <Input placeholder="Driver name" {...field} value={field.value || ""} className={FLOATING_INNER_CONTROL} />
                                    </FormControl>
                                </FloatingFormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="driverUserId"
                            render={({ field }) => (
                                <FloatingFormItem label="Driver User ID">
                                    <FormControl>
                                        <Input type="number" placeholder="Link to user account" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} className={FLOATING_INNER_CONTROL} />
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
                        onClick={() => router.push("/masters/vehicle")}
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
                            "Update Vehicle"
                        ) : (
                            "Create Vehicle"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
