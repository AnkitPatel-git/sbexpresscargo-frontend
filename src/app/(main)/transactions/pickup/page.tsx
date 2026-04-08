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
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/auth/permission-guard"

import { pickupService } from "@/services/transactions/pickup-service"
import { Pickup } from "@/types/transactions/pickup"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    )
}

export default function PickupsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [colFilters, setColFilters] = useState({
        bookingNo: "",
        shipper: "",
        city: "",
        status: "",
        execution: "",
    })

    const { data, isLoading } = useQuery({
        queryKey: ["pickups", page, debouncedSearch],
        queryFn: () => pickupService.getPickups({ page, limit, search: debouncedSearch }),
    })


    const handleCreate = () => {
        router.push("/transactions/pickup/create")
    }

    const handleEdit = (pickup: Pickup) => {
        router.push(`/transactions/pickup/${pickup.id}/edit`)
    }

    const total = data?.meta.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "COMPLETED":
            case "CONFIRMED":
                return "success"
            case "CANCELLED":
                return "destructive"
            case "CREATED":
                return "secondary"
            default:
                return "outline"
        }
    }

    const filteredRows =
        data?.data.filter((pickup) => {
            const booking = (pickup.bookingNo ?? "").toLowerCase()
            const shipper = (pickup.shipperName ?? "").toLowerCase()
            const city = (pickup.city ?? "").toLowerCase()
            const status = (pickup.status ?? "").toLowerCase()
            const execution = (pickup.executionStatus ?? "").toLowerCase()

            if (colFilters.bookingNo && !booking.includes(colFilters.bookingNo.toLowerCase())) return false
            if (colFilters.shipper && !shipper.includes(colFilters.shipper.toLowerCase())) return false
            if (colFilters.city && !city.includes(colFilters.city.toLowerCase())) return false
            if (colFilters.status && !status.includes(colFilters.status.toLowerCase())) return false
            if (colFilters.execution && !execution.includes(colFilters.execution.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="shipment.pickup.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Import">
                        <FileUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        title="Refresh"
                        onClick={() => queryClient.refetchQueries({ queryKey: ["pickups"], type: "active" })}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                        placeholder="Search pickups..."
                        className="h-9 w-44 bg-background sm:w-52"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <PermissionGuard permission="shipment.pickup.create">
                        <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Pickup">
                            <Plus className="mr-1 h-4 w-4" />
                            Add Pickup
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[900px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">Booking No <SortArrows /></span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">Pickup Date <SortArrows /></span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">Shipper <SortArrows /></span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">City <SortArrows /></span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">Status <SortArrows /></span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">Execution <SortArrows /></span>
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2">
                                <Input
                                    placeholder="Booking No"
                                    className="h-8 border-border bg-background text-xs"
                                    value={colFilters.bookingNo}
                                    onChange={(e) => setColFilters((f) => ({ ...f, bookingNo: e.target.value }))}
                                />
                            </TableHead>
                            <TableHead className="p-2">
                                <Input
                                    placeholder="Pickup Date"
                                    className="h-8 border-border bg-background text-xs"
                                    disabled
                                />
                            </TableHead>
                            <TableHead className="p-2">
                                <Input
                                    placeholder="Shipper"
                                    className="h-8 border-border bg-background text-xs"
                                    value={colFilters.shipper}
                                    onChange={(e) => setColFilters((f) => ({ ...f, shipper: e.target.value }))}
                                />
                            </TableHead>
                            <TableHead className="p-2">
                                <Input
                                    placeholder="City"
                                    className="h-8 border-border bg-background text-xs"
                                    value={colFilters.city}
                                    onChange={(e) => setColFilters((f) => ({ ...f, city: e.target.value }))}
                                />
                            </TableHead>
                            <TableHead className="p-2">
                                <Input
                                    placeholder="Status"
                                    className="h-8 border-border bg-background text-xs"
                                    value={colFilters.status}
                                    onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))}
                                />
                            </TableHead>
                            <TableHead className="p-2">
                                <Input
                                    placeholder="Execution"
                                    className="h-8 border-border bg-background text-xs"
                                    value={colFilters.execution}
                                    onChange={(e) => setColFilters((f) => ({ ...f, execution: e.target.value }))}
                                />
                            </TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Loading pickups...
                                </TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No pickups found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((pickup, index) => (
                                <TableRow
                                    key={pickup.id}
                                    className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                                >
                                    <TableCell className="font-medium text-foreground">{pickup.bookingNo || "—"}</TableCell>
                                    <TableCell className="text-foreground">
                                        {pickup.pickupAt ? format(new Date(pickup.pickupAt), "dd/MM/yyyy HH:mm") : "—"}
                                    </TableCell>
                                    <TableCell className="text-foreground">
                                        <div className="font-medium">{pickup.shipperName}</div>
                                        <div className="text-xs text-muted-foreground">{pickup.mobile}</div>
                                    </TableCell>
                                    <TableCell className="text-foreground">{pickup.city || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(pickup.status) as any}>{pickup.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px]">{pickup.executionStatus || "—"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="shipment.pickup.update">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                                                    title="Edit"
                                                    onClick={() => handleEdit(pickup)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                    Showing {from} to {to} of {total} entries
                </p>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                        title="First"
                    >
                        «
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        title="Previous"
                    >
                        ‹
                    </Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={!data || page >= (data.meta?.totalPages || 1)}
                        onClick={() => setPage((p) => p + 1)}
                        title="Next"
                    >
                        ›
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={!data || page >= (data.meta?.totalPages || 1)}
                        onClick={() => setPage(data?.meta.totalPages ?? 1)}
                        title="Last"
                    >
                        »
                    </Button>
                </div>
            </div>

        </div>
    )
}
