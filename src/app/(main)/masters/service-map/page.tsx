"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Link as LinkIcon, Check, X, FileDown, Filter, FilePlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { serviceMapService } from "@/services/masters/service-map-service"
import { vendorService } from "@/services/masters/vendor-service"
import { ServiceMap } from "@/types/masters/service-map"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { MasterExcelImportButton } from "@/components/masters/master-excel-import-button"
import { useDebounce } from "@/hooks/use-debounce"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

export default function ServiceMapPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", vendorId: "", serviceType: "", status: "" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)
    const [sortBy, setSortBy] = useState("vendor")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data: vendorsData } = useQuery({
        queryKey: ["vendors-list"],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: "vendorName", sortOrder: "asc" }),
    })

    const { data, isLoading } = useQuery({
        queryKey: ["service-maps", page, debouncedSearch, appliedFilters.vendorId, appliedFilters.serviceType, appliedFilters.status, sortBy, sortOrder],
        queryFn: () =>
            serviceMapService.getServiceMaps({
                page,
                limit,
                search: debouncedSearch,
                sortBy,
                sortOrder,
                vendorId: appliedFilters.vendorId ? Number(appliedFilters.vendorId) : undefined,
                serviceType: appliedFilters.serviceType || undefined,
                status: appliedFilters.status || undefined,
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await serviceMapService.exportServiceMaps({
                search: debouncedSearch,
                sortBy,
                sortOrder,
                vendorId: appliedFilters.vendorId ? Number(appliedFilters.vendorId) : undefined,
                serviceType: appliedFilters.serviceType || undefined,
                status: appliedFilters.status || undefined,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Service maps exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export service maps")
        } finally {
            setExporting(false)
        }
    }

    const decimalToNumber = (value: ServiceMap["minWeight"]) => {
        if (typeof value === "number" || typeof value === "string") return value
        if (value && typeof value === "object" && "d" in value) {
            const digits = Array.isArray(value.d) ? value.d.join("") : ""
            const exponent = value.e ?? 0
            const sign = value.s === -1 ? "-" : ""
            const parsed = Number(`${sign}${digits}e${exponent}`)
            return Number.isFinite(parsed) ? parsed : ""
        }
        return ""
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceMapService.deleteServiceMap(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service-maps"] })
            toast.success("Service Map deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete service map")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/service-map/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/service-map/${id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const rows = data?.data ?? []
    const applyFilters = () => {
        setAppliedFilters(draftFilters)
        setPage(1)
        setFiltersOpen(false)
    }
    const resetFilters = () => {
        setDraftFilters(defaultFilters)
        setAppliedFilters(defaultFilters)
        setPage(1)
        setFiltersOpen(false)
    }
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setPage(1)
    }

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Service Map Filters</DialogTitle>
                                <DialogDescription>Filter the service map list from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={draftFilters.vendorId} onChange={(e) => setDraftFilters((prev) => ({ ...prev, vendorId: e.target.value }))}>
                                    <option value="">All vendors</option>
                                    {vendorsData?.data?.map((vendor) => (
                                        <option key={vendor.id} value={String(vendor.id)}>{vendor.vendorName}</option>
                                    ))}
                                </select>
                                <Input placeholder="Service Type" className="h-9 bg-background" value={draftFilters.serviceType} onChange={(e) => setDraftFilters((prev) => ({ ...prev, serviceType: e.target.value }))} />
                                <Input placeholder="Status" className="h-9 bg-background" value={draftFilters.status} onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard permission="master.service_map.create">
                        <MasterExcelImportButton master="service-map" label="Service Maps" queryKey={["service-maps"]} />
                    </PermissionGuard>
                    <PermissionGuard permission="master.service_map.read">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Export CSV"
                            disabled={exporting}
                            onClick={() => void handleExportCsv()}
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
                <PermissionGuard permission="master.service_map.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={handleCreate}>
                        <FilePlus className="h-4 w-4" />
                        Add Service Map
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1200px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><SortableColumnHeader label="Vendor" field="vendor" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Service Type" field="serviceType" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Weight (Min-Max)</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Single Pc</TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading service maps...</TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No service maps found.</TableCell>
                            </TableRow>
                        ) : (
                            rows.map((serviceMap: ServiceMap, index) => (
                                <TableRow key={serviceMap.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">
                                        <div className="flex items-center">
                                            {serviceMap.vendor?.vendorName || `ID: ${serviceMap.vendorId}`}
                                            {serviceMap.vendorLink && (
                                                <a href={serviceMap.vendorLink} target="_blank" rel="noopener noreferrer" className="ml-2">
                                                    <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{serviceMap.serviceType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-foreground">{decimalToNumber(serviceMap.minWeight)} - {decimalToNumber(serviceMap.maxWeight)} kg</TableCell>
                                    <TableCell className="text-center">
                                        {serviceMap.isSinglePiece ? (
                                            <Check className="mx-auto h-4 w-4 text-green-600" />
                                        ) : (
                                            <X className="mx-auto h-4 w-4 text-red-600" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={serviceMap.status === "ACTIVE" ? "secondary" : "secondary"} className={serviceMap.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                                            {serviceMap.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.service_map.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(serviceMap.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.service_map.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(serviceMap.id)}>
                                                    <Trash2 className="h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">Showing {from} to {to} of {total} entries</p>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)} title="First">«</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} title="Previous">‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data?.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} title="Next">›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)} title="Last">»</Button>
                </div>
            </div>
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service map
                            from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
