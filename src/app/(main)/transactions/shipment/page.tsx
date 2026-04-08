"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { shipmentService } from "@/services/transactions/shipment-service"
import { Shipment } from "@/types/transactions/shipment"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ShipmentsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({
        awb: "",
        shipper: "",
        customer: "",
        consignee: "",
        destination: "",
        product: "",
        vendor: "",
    })

    const { data, isLoading } = useQuery({
        queryKey: ["shipments", page, debouncedSearch],
        queryFn: () => shipmentService.getShipments({ page, limit, search: debouncedSearch, sortBy: "id", sortOrder: "desc" }),
    })
    const getDisplayWeight = (shipment: Shipment) => {
        const declared = Number(shipment.declaredWeight ?? 0)
        if (Number.isFinite(declared) && declared > 0) return declared
        return Number(shipment.actualWeight ?? 0)
    }

    const getDeliveryVendor = (shipment: Shipment) =>
        shipment.forwardings?.[0]?.deliveryVendor?.vendorName ||
        shipment.forwardings?.[0]?.deliveryVendor?.name ||
        "—"


    const handleCreate = () => {
        router.push("/transactions/shipment/create")
    }

    const handleEdit = (shipment: Shipment) => {
        router.push(`/transactions/shipment/${shipment.id}/edit`)
    }

    const handleViewDetails = (shipment: Shipment) => {
        router.push(`/transactions/shipment/${shipment.id}`)
    }

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const filteredRows =
        data?.data.filter((shipment) => {
            if (colFilters.awb && !(shipment.awbNo || "").toLowerCase().includes(colFilters.awb.toLowerCase())) return false
            const shipperName = shipment.shipper?.shipperName || shipment.shipper?.name || ""
            if (colFilters.shipper && !shipperName.toLowerCase().includes(colFilters.shipper.toLowerCase())) return false
            const customerName = shipment.customer?.name || ""
            if (colFilters.customer && !customerName.toLowerCase().includes(colFilters.customer.toLowerCase())) return false
            const consigneeName = shipment.consignee?.consigneeName || shipment.consignee?.name || ""
            if (colFilters.consignee && !consigneeName.toLowerCase().includes(colFilters.consignee.toLowerCase())) return false
            if (colFilters.destination && !(shipment.destination || "").toLowerCase().includes(colFilters.destination.toLowerCase())) return false
            const productName = shipment.product?.productName || shipment.product?.name || ""
            if (colFilters.product && !productName.toLowerCase().includes(colFilters.product.toLowerCase())) return false
            const vendorName = shipment.vendor?.vendorName || shipment.vendor?.name || ""
            if (colFilters.vendor && !vendorName.toLowerCase().includes(colFilters.vendor.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="transaction.shipment.create"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button></PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary"><FileUp className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["shipments"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input placeholder="Search..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <PermissionGuard permission="transaction.shipment.create"><Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><Plus className="mr-1 h-4 w-4" />Add Shipment</Button></PermissionGuard>
                </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1650px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="sticky left-0 z-20 h-11 min-w-[150px] bg-primary font-semibold text-primary-foreground">AWB No <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Book Date <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Shipper Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Customer Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Customer Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Consignee Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Destination <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Product <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Vendor <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Actual Weight <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Charge Weight <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Pieces <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Delivery Vendor <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="sticky right-0 z-20 min-w-[100px] bg-primary text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="sticky left-0 z-10 min-w-[150px] bg-card p-2"><Input placeholder="AWB No" className="h-8 border-border bg-background text-xs" value={colFilters.awb} onChange={(e) => setColFilters((f) => ({ ...f, awb: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Book Date" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Shipper Name" className="h-8 border-border bg-background text-xs" value={colFilters.shipper} onChange={(e) => setColFilters((f) => ({ ...f, shipper: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Customer Code" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Customer Name" className="h-8 border-border bg-background text-xs" value={colFilters.customer} onChange={(e) => setColFilters((f) => ({ ...f, customer: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Consignee Name" className="h-8 border-border bg-background text-xs" value={colFilters.consignee} onChange={(e) => setColFilters((f) => ({ ...f, consignee: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Destination" className="h-8 border-border bg-background text-xs" value={colFilters.destination} onChange={(e) => setColFilters((f) => ({ ...f, destination: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Product" className="h-8 border-border bg-background text-xs" value={colFilters.product} onChange={(e) => setColFilters((f) => ({ ...f, product: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Vendor" className="h-8 border-border bg-background text-xs" value={colFilters.vendor} onChange={(e) => setColFilters((f) => ({ ...f, vendor: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Actual Weight" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Charge Weight" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Pieces" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Delivery Vendor" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="sticky right-0 z-10 min-w-[100px] bg-card p-2" />
                        </TableRow>
                    </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={14} className="h-24 text-center">
                                            Loading shipments...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                                            No shipments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map((shipment: Shipment, index) => (
                                        <TableRow key={shipment.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                            <TableCell
                                                className="sticky left-0 z-10 min-w-[150px] cursor-pointer bg-inherit font-medium underline text-primary"
                                                onClick={() => handleViewDetails(shipment)}
                                                title="View shipment details"
                                            >
                                                {shipment.awbNo}
                                            </TableCell>
                                            <TableCell>
                                                {shipment.bookDate ? format(new Date(shipment.bookDate), "dd/MM/yyyy") : 'N/A'}
                                            </TableCell>
                                            <TableCell>{shipment.shipper?.shipperName || shipment.shipper?.name || "—"}</TableCell>
                                            <TableCell>{shipment.customer?.code || "—"}</TableCell>
                                            <TableCell>{shipment.customer?.name || "—"}</TableCell>
                                            <TableCell>{shipment.consignee?.consigneeName || shipment.consignee?.name || "—"}</TableCell>
                                            <TableCell>{shipment.destination || "—"}</TableCell>
                                            <TableCell>{shipment.product?.productName || shipment.product?.name || "—"}</TableCell>
                                            <TableCell>{shipment.vendor?.vendorName || shipment.vendor?.name || "—"}</TableCell>
                                            <TableCell>
                                                {getDisplayWeight(shipment) || "—"}
                                            </TableCell>
                                            <TableCell>{shipment.chargeWeight ?? "—"}</TableCell>
                                            <TableCell>{shipment.pieces ?? "—"}</TableCell>
                                            <TableCell>{getDeliveryVendor(shipment)}</TableCell>
                                            <TableCell className="sticky right-0 z-10 min-w-[100px] bg-inherit">
                                                <div className="flex items-center justify-center gap-1">
                                                    <PermissionGuard permission="transaction.shipment.update"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(shipment)}><Edit className="h-4 w-4" /></Button></PermissionGuard>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">Showing {from} to {to} of {total} entries</p>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)}>»</Button>
                </div>
            </div>

        </div>
    )
}
