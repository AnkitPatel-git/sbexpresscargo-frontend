"use client"

import { useId, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DecimalInput } from "@/components/ui/decimal-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FLOATING_INNER_SELECT_TRIGGER } from "@/components/ui/floating-form-item"
import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select"
import { productService } from "@/services/masters/product-service"
import { serviceMapService } from "@/services/masters/service-map-service"
import { vendorService } from "@/services/masters/vendor-service"
import type { Product } from "@/types/masters/product"
import type {
    VendorFuelSurcharge,
    VendorFuelSurchargeFormData,
    VendorIdcSurcharge,
    VendorIdcSurchargeFormData,
    VendorCafSurcharge,
    VendorCafSurchargeFormData,
    VendorVolumetric,
    VendorVolumetricFormData,
} from "@/types/masters/vendor"

function decimalToNumber(value: unknown): number | string {
    if (typeof value === "number" || typeof value === "string") return value
    if (value && typeof value === "object" && "d" in (value as { d?: number[] })) {
        const decimal = value as { s?: number; e?: number; d?: number[] }
        const digits = Array.isArray(decimal.d) ? decimal.d.join("") : ""
        const exponent = decimal.e ?? 0
        const sign = decimal.s === -1 ? "-" : ""
        const parsed = Number(`${sign}${digits}e${exponent}`)
        return Number.isFinite(parsed) ? parsed : ""
    }
    return ""
}

function formatDate(value: string): string {
    return value.split("T")[0] ?? value
}

function getChildRows<T>(response: { data?: T[] | T } | undefined): T[] {
    if (!response?.data) return []
    return Array.isArray(response.data) ? response.data : [response.data]
}

function DisabledVendorTab({ title }: { title: string }) {
    return (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            Save the vendor first to configure {title.toLowerCase()}.
        </div>
    )
}

function VendorChildTableCard({
    title,
    onAdd,
    columns,
    rows,
    actions,
    children,
}: {
    title: string
    onAdd: () => void
    columns: string[]
    rows: string[][]
    actions: React.ReactNode[]
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_1px_3px_rgba(23,42,69,0.08)] space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <Button type="button" onClick={onAdd}>Add</Button>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                                    No rows yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, index) => (
                                <TableRow key={index}>
                                    {row.map((cell, cellIndex) => (
                                        <TableCell key={cellIndex}>{cell}</TableCell>
                                    ))}
                                    <TableCell>{actions[index]}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {children}
        </div>
    )
}

function VendorEntityDialog({
    open,
    onOpenChange,
    title,
    onSave,
    saving,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    onSave: () => void
    saving: boolean
    children: React.ReactNode
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {children}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={onSave} disabled={saving}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function VendorServiceMapSelect({
    id,
    vendorId,
    value,
    onValueChange,
    editingServiceMap,
    placeholder = "All services",
}: {
    id?: string
    vendorId: number
    value?: number
    onValueChange: (serviceMapId: number | undefined) => void
    editingServiceMap?: { id: number; serviceType: string } | null
    placeholder?: string
}) {
    const { data } = useQuery({
        queryKey: ["vendor-service-maps", vendorId],
        queryFn: () => serviceMapService.getServiceMapsByVendor(vendorId),
        enabled: vendorId > 0,
    })

    const serviceMaps = useMemo(() => {
        const rows = data?.data ?? []
        if (
            editingServiceMap &&
            !rows.some((row) => row.id === editingServiceMap.id)
        ) {
            return [
                {
                    id: editingServiceMap.id,
                    vendorId,
                    serviceType: editingServiceMap.serviceType,
                    weightUnit: "KG" as const,
                    status: "ACTIVE" as const,
                    vendorLink: null,
                    createdAt: "",
                    updatedAt: "",
                    createdById: null,
                    updatedById: null,
                    deletedAt: null,
                    deletedById: null,
                },
                ...rows,
            ]
        }
        return rows
    }, [data?.data, editingServiceMap, vendorId])

    return (
        <Select
            value={value != null ? String(value) : "all"}
            onValueChange={(v) => onValueChange(v === "all" ? undefined : Number(v))}
        >
            <SelectTrigger id={id} className={FLOATING_INNER_SELECT_TRIGGER}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {serviceMaps.map((serviceMap) => (
                    <SelectItem key={serviceMap.id} value={String(serviceMap.id)}>
                        {serviceMap.serviceType || `Service ${serviceMap.id}`}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export function VendorFuelSurchargeTab({ vendorId }: { vendorId: number | null }) {
    const queryClient = useQueryClient()
    const fuelServiceSelectId = useId()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<VendorFuelSurcharge | null>(null)
    const [form, setForm] = useState<VendorFuelSurchargeFormData>({
        serviceMapId: undefined,
        fuelChargeType: "PERCENTAGE",
        fromDate: "",
        toDate: "",
        fuelSurcharge: undefined,
    })

    const { data } = useQuery({
        queryKey: ["vendor-fuel-surcharges", vendorId],
        queryFn: () => vendorService.getVendorFuelSurcharges(vendorId!),
        enabled: !!vendorId,
    })
    const surchargeRows = getChildRows<VendorFuelSurcharge>(data)

    const mutation = useMutation({
        mutationFn: (payload: VendorFuelSurchargeFormData) =>
            editing
                ? vendorService.updateVendorFuelSurcharge(vendorId!, editing.id, payload)
                : vendorService.addVendorFuelSurcharge(vendorId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-fuel-surcharges", vendorId] })
            setOpen(false)
            setEditing(null)
            setForm({ serviceMapId: undefined, fuelChargeType: "PERCENTAGE", fromDate: "", toDate: "", fuelSurcharge: undefined })
            toast.success(`Fuel surcharge ${editing ? "updated" : "added"} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorService.deleteVendorFuelSurcharge(vendorId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-fuel-surcharges", vendorId] })
            toast.success("Fuel surcharge deleted successfully")
        },
        onError: (error: Error) => toast.error(error.message),
    })

    if (!vendorId) return <DisabledVendorTab title="Fuel Surcharges" />

    return (
        <VendorChildTableCard
            title="Fuel Surcharges"
            onAdd={() => {
                setEditing(null)
                setForm({ serviceMapId: undefined, fuelChargeType: "PERCENTAGE", fromDate: "", toDate: "", fuelSurcharge: undefined })
                setOpen(true)
            }}
            columns={["Service", "Type", "From Date", "To Date", "Value", "Action"]}
            rows={surchargeRows.map((item) => [
                item.serviceMap?.serviceType ?? "All Services",
                item.fuelChargeType,
                formatDate(item.fromDate),
                formatDate(item.toDate),
                String(decimalToNumber(item.fuelSurcharge)),
            ])}
            actions={surchargeRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setEditing(item)
                            setForm({
                                serviceMapId: item.serviceMapId ?? undefined,
                                fuelChargeType: item.fuelChargeType === "FIXED" ? "FLAT" : item.fuelChargeType,
                                fromDate: item.fromDate.split("T")[0] ?? "",
                                toDate: item.toDate.split("T")[0] ?? "",
                                fuelSurcharge: Number(decimalToNumber(item.fuelSurcharge) || 0),
                            })
                            setOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                    </Button>
                </div>
            ))}
        >
            <VendorEntityDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? "Edit Fuel Surcharge" : "Add Fuel Surcharge"}
                onSave={() => {
                    if (!Number.isFinite(form.fuelSurcharge)) {
                        toast.error("Enter fuel surcharge")
                        return
                    }
                    mutation.mutate({ ...form, fuelSurcharge: form.fuelSurcharge })
                }}
                saving={mutation.isPending}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor={fuelServiceSelectId} className="text-sm font-medium">Service</label>
                        <VendorServiceMapSelect
                            id={fuelServiceSelectId}
                            vendorId={vendorId}
                            value={form.serviceMapId}
                            onValueChange={(serviceMapId) => setForm((prev) => ({ ...prev, serviceMapId }))}
                            editingServiceMap={
                                editing?.serviceMapId != null && editing.serviceMap
                                    ? { id: editing.serviceMapId, serviceType: editing.serviceMap.serviceType }
                                    : null
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Type</div>
                        <Select
                            value={form.fuelChargeType}
                            onValueChange={(v) => setForm((prev) => ({ ...prev, fuelChargeType: v }))}
                        >
                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="FLAT">Flat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">From Date</div>
                        <Input type="date" value={form.fromDate} onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">To Date</div>
                        <Input type="date" value={form.toDate} onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-medium">Fuel Surcharge</div>
                        <DecimalInput
                            value={form.fuelSurcharge}
                            onValueChange={(n) => setForm((prev) => ({ ...prev, fuelSurcharge: n }))}
                            min={0}
                        />
                    </div>
                </div>
                {!editing ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                        Leave Service empty to create the same fuel surcharge for every service.
                    </p>
                ) : null}
            </VendorEntityDialog>
        </VendorChildTableCard>
    )
}

export function VendorIdcSurchargeTab({ vendorId }: { vendorId: number | null }) {
    const queryClient = useQueryClient()
    const serviceSelectId = useId()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<VendorIdcSurcharge | null>(null)
    const [form, setForm] = useState<VendorIdcSurchargeFormData>({
        serviceMapId: undefined,
        idcChargeType: "PERCENTAGE",
        fromDate: "",
        toDate: "",
        idcSurcharge: undefined,
    })

    const { data } = useQuery({
        queryKey: ["vendor-idc-surcharges", vendorId],
        queryFn: () => vendorService.getVendorIdcSurcharges(vendorId!),
        enabled: !!vendorId,
    })
    const surchargeRows = getChildRows<VendorIdcSurcharge>(data)

    const mutation = useMutation({
        mutationFn: (payload: VendorIdcSurchargeFormData) =>
            editing
                ? vendorService.updateVendorIdcSurcharge(vendorId!, editing.id, payload)
                : vendorService.addVendorIdcSurcharge(vendorId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-idc-surcharges", vendorId] })
            setOpen(false)
            setEditing(null)
            setForm({ serviceMapId: undefined, idcChargeType: "PERCENTAGE", fromDate: "", toDate: "", idcSurcharge: undefined })
            toast.success(`IDC surcharge ${editing ? "updated" : "added"} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorService.deleteVendorIdcSurcharge(vendorId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-idc-surcharges", vendorId] })
            toast.success("IDC surcharge deleted successfully")
        },
        onError: (error: Error) => toast.error(error.message),
    })

    if (!vendorId) return <DisabledVendorTab title="IDC" />

    return (
        <VendorChildTableCard
            title="IDC"
            onAdd={() => {
                setEditing(null)
                setForm({ serviceMapId: undefined, idcChargeType: "PERCENTAGE", fromDate: "", toDate: "", idcSurcharge: undefined })
                setOpen(true)
            }}
            columns={["Service", "Type", "From Date", "To Date", "Value", "Action"]}
            rows={surchargeRows.map((item) => [
                item.serviceMap?.serviceType ?? "All Services",
                item.idcChargeType,
                formatDate(item.fromDate),
                formatDate(item.toDate),
                String(decimalToNumber(item.idcSurcharge)),
            ])}
            actions={surchargeRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setEditing(item)
                            setForm({
                                serviceMapId: item.serviceMapId ?? undefined,
                                idcChargeType: item.idcChargeType === "FIXED" ? "FLAT" : item.idcChargeType,
                                fromDate: item.fromDate.split("T")[0] ?? "",
                                toDate: item.toDate.split("T")[0] ?? "",
                                idcSurcharge: Number(decimalToNumber(item.idcSurcharge) || 0),
                            })
                            setOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                    </Button>
                </div>
            ))}
        >
            <VendorEntityDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? "Edit IDC Surcharge" : "Add IDC Surcharge"}
                onSave={() => {
                    if (!Number.isFinite(form.idcSurcharge)) {
                        toast.error("Enter IDC surcharge value")
                        return
                    }
                    mutation.mutate({ ...form, idcSurcharge: form.idcSurcharge })
                }}
                saving={mutation.isPending}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor={serviceSelectId} className="text-sm font-medium">Service</label>
                        <VendorServiceMapSelect
                            id={serviceSelectId}
                            vendorId={vendorId}
                            value={form.serviceMapId}
                            onValueChange={(serviceMapId) => setForm((prev) => ({ ...prev, serviceMapId }))}
                            editingServiceMap={
                                editing?.serviceMapId != null && editing.serviceMap
                                    ? { id: editing.serviceMapId, serviceType: editing.serviceMap.serviceType }
                                    : null
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Type</div>
                        <Select
                            value={form.idcChargeType}
                            onValueChange={(v) => setForm((prev) => ({ ...prev, idcChargeType: v }))}
                        >
                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="FLAT">Flat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">From Date</div>
                        <Input type="date" value={form.fromDate} onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">To Date</div>
                        <Input type="date" value={form.toDate} onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-medium">IDC Surcharge</div>
                        <DecimalInput
                            value={form.idcSurcharge}
                            onValueChange={(n) => setForm((prev) => ({ ...prev, idcSurcharge: n }))}
                            min={0}
                        />
                    </div>
                </div>
                {!editing ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                        Leave Service empty to create the same IDC surcharge for every service.
                    </p>
                ) : null}
            </VendorEntityDialog>
        </VendorChildTableCard>
    )
}

export function VendorCafSurchargeTab({ vendorId }: { vendorId: number | null }) {
    const queryClient = useQueryClient()
    const serviceSelectId = useId()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<VendorCafSurcharge | null>(null)
    const [form, setForm] = useState<VendorCafSurchargeFormData>({
        serviceMapId: undefined,
        cafChargeType: "PERCENTAGE",
        fromDate: "",
        toDate: "",
        cafSurcharge: undefined,
    })

    const { data } = useQuery({
        queryKey: ["vendor-caf-surcharges", vendorId],
        queryFn: () => vendorService.getVendorCafSurcharges(vendorId!),
        enabled: !!vendorId,
    })
    const surchargeRows = getChildRows<VendorCafSurcharge>(data)

    const mutation = useMutation({
        mutationFn: (payload: VendorCafSurchargeFormData) =>
            editing
                ? vendorService.updateVendorCafSurcharge(vendorId!, editing.id, payload)
                : vendorService.addVendorCafSurcharge(vendorId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-caf-surcharges", vendorId] })
            setOpen(false)
            setEditing(null)
            setForm({ serviceMapId: undefined, cafChargeType: "PERCENTAGE", fromDate: "", toDate: "", cafSurcharge: undefined })
            toast.success(`CAF surcharge ${editing ? "updated" : "added"} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorService.deleteVendorCafSurcharge(vendorId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-caf-surcharges", vendorId] })
            toast.success("CAF surcharge deleted successfully")
        },
        onError: (error: Error) => toast.error(error.message),
    })

    if (!vendorId) return <DisabledVendorTab title="CAF" />

    return (
        <VendorChildTableCard
            title="CAF"
            onAdd={() => {
                setEditing(null)
                setForm({ serviceMapId: undefined, cafChargeType: "PERCENTAGE", fromDate: "", toDate: "", cafSurcharge: undefined })
                setOpen(true)
            }}
            columns={["Service", "Type", "From Date", "To Date", "Value", "Action"]}
            rows={surchargeRows.map((item) => [
                item.serviceMap?.serviceType ?? "All Services",
                item.cafChargeType,
                formatDate(item.fromDate),
                formatDate(item.toDate),
                String(decimalToNumber(item.cafSurcharge)),
            ])}
            actions={surchargeRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setEditing(item)
                            setForm({
                                serviceMapId: item.serviceMapId ?? undefined,
                                cafChargeType: item.cafChargeType === "FIXED" ? "FLAT" : item.cafChargeType,
                                fromDate: item.fromDate.split("T")[0] ?? "",
                                toDate: item.toDate.split("T")[0] ?? "",
                                cafSurcharge: Number(decimalToNumber(item.cafSurcharge) || 0),
                            })
                            setOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                    </Button>
                </div>
            ))}
        >
            <VendorEntityDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? "Edit CAF Surcharge" : "Add CAF Surcharge"}
                onSave={() => {
                    if (!Number.isFinite(form.cafSurcharge)) {
                        toast.error("Enter CAF surcharge value")
                        return
                    }
                    mutation.mutate({ ...form, cafSurcharge: form.cafSurcharge })
                }}
                saving={mutation.isPending}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor={serviceSelectId} className="text-sm font-medium">Service</label>
                        <VendorServiceMapSelect
                            id={serviceSelectId}
                            vendorId={vendorId}
                            value={form.serviceMapId}
                            onValueChange={(serviceMapId) => setForm((prev) => ({ ...prev, serviceMapId }))}
                            editingServiceMap={
                                editing?.serviceMapId != null && editing.serviceMap
                                    ? { id: editing.serviceMapId, serviceType: editing.serviceMap.serviceType }
                                    : null
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Type</div>
                        <Select
                            value={form.cafChargeType}
                            onValueChange={(v) => setForm((prev) => ({ ...prev, cafChargeType: v }))}
                        >
                            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="FLAT">Flat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">From Date</div>
                        <Input type="date" value={form.fromDate} onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">To Date</div>
                        <Input type="date" value={form.toDate} onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <div className="text-sm font-medium">CAF Surcharge</div>
                        <DecimalInput
                            value={form.cafSurcharge}
                            onValueChange={(n) => setForm((prev) => ({ ...prev, cafSurcharge: n }))}
                            min={0}
                        />
                    </div>
                </div>
                {!editing ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                        Leave Service empty to create the same CAF surcharge for every service.
                    </p>
                ) : null}
            </VendorEntityDialog>
        </VendorChildTableCard>
    )
}

export function VendorVolumetricTab({ vendorId }: { vendorId: number | null }) {
    const queryClient = useQueryClient()
    const volumetricProductSelectId = useId()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<VendorVolumetric | null>(null)
    const [form, setForm] = useState<VendorVolumetricFormData>({ productId: 0, cft: undefined })

    const { data } = useQuery({
        queryKey: ["vendor-volumetrics", vendorId],
        queryFn: () => vendorService.getVendorVolumetrics(vendorId!),
        enabled: !!vendorId,
    })
    const volumetricRows = getChildRows<VendorVolumetric>(data)
    const takenProductIds = useMemo(() => {
        const s = new Set(volumetricRows.map((r) => r.productId))
        if (editing) s.delete(editing.productId)
        return s
    }, [volumetricRows, editing])

    const mutation = useMutation({
        mutationFn: (payload: VendorVolumetricFormData) =>
            editing
                ? vendorService.updateVendorVolumetric(vendorId!, editing.id, payload)
                : vendorService.addVendorVolumetric(vendorId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-volumetrics", vendorId] })
            setOpen(false)
            setEditing(null)
            setForm({ productId: 0, cft: undefined })
            toast.success(`Volumetric ${editing ? "updated" : "added"} successfully`)
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorService.deleteVendorVolumetric(vendorId!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-volumetrics", vendorId] })
            toast.success("Volumetric deleted successfully")
        },
        onError: (error: Error) => toast.error(error.message),
    })

    if (!vendorId) return <DisabledVendorTab title="Vendor Volumetric" />

    return (
        <VendorChildTableCard
            title="Vendor Volumetric"
            onAdd={() => {
                setEditing(null)
                setForm({ productId: 0, cft: undefined })
                setOpen(true)
            }}
            columns={["Product", "CFT", "Action"]}
            rows={volumetricRows.map((item) => [
                item.product?.productName ?? "-",
                String(decimalToNumber(item.cft)),
            ])}
            actions={volumetricRows.map((item) => (
                <div className="flex gap-2" key={item.id}>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setEditing(item)
                            setForm({
                                productId: item.productId,
                                cft: Number(decimalToNumber(item.cft) || 0),
                            })
                            setOpen(true)
                        }}
                    >
                        Edit
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                        Delete
                    </Button>
                </div>
            ))}
        >
            <VendorEntityDialog
                open={open}
                onOpenChange={setOpen}
                title={editing ? "Edit Volumetric" : "Add Volumetric"}
                onSave={() => {
                    if (!form.productId || form.productId < 1) {
                        toast.error("Select a product")
                        return
                    }
                    if (!Number.isFinite(form.cft) || (form.cft as number) <= 0) {
                        toast.error("CFT must be greater than 0")
                        return
                    }
                    mutation.mutate({ ...form, cft: form.cft as number })
                }}
                saving={mutation.isPending}
            >
                <p className="mb-3 text-sm text-muted-foreground">
                    One row per product. CFT is used for vendor forwarding volumetric weight (L×W×H / divisor × CFT for surface).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor={volumetricProductSelectId} className="text-sm font-medium">Product</label>
                        <DbAsyncSelect<Product>
                            id={volumetricProductSelectId}
                            queryKey={["vendor-volumetric", "products", vendorId ?? 0, editing?.id ?? "new"]}
                            fetchPage={(page, search) =>
                                productService.getProducts({
                                    page,
                                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                                    search: search || undefined,
                                    sortBy: "productName",
                                    sortOrder: "asc",
                                })
                            }
                            getItemLabel={(p) => p.productName}
                            visibleItem={(p) => !takenProductIds.has(p.id)}
                            extraItems={
                                editing?.productId != null && editing.product
                                    ? [{
                                        id: editing.productId,
                                        productCode: editing.product.productCode ?? "",
                                        productName: editing.product.productName ?? `Product ${editing.productId}`,
                                        version: 1,
                                        productType: "DOMESTIC",
                                        status: "ACTIVE",
                                        createdAt: "",
                                        updatedAt: "",
                                        createdById: null,
                                        updatedById: null,
                                        deletedAt: null,
                                        deletedById: null,
                                    }]
                                    : undefined
                            }
                            value={form.productId > 0 ? String(form.productId) : undefined}
                            onValueChange={(v) => setForm((prev) => ({ ...prev, productId: Number(v) }))}
                            placeholder="Select product"
                            searchPlaceholder="Search products…"
                            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium">CFT</div>
                        <DecimalInput
                            value={form.cft}
                            onValueChange={(n) => setForm((prev) => ({ ...prev, cft: n }))}
                            min={0.01}
                        />
                    </div>
                </div>
            </VendorEntityDialog>
        </VendorChildTableCard>
    )
}
