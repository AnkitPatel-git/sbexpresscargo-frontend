"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Link as LinkIcon, Check, X, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"

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
import { useDebounce } from "@/hooks/use-debounce"

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    )
}

export default function ServiceMapPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({
        vendor: "",
        serviceType: "",
        weight: "",
        status: "",
    })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data: vendorsData } = useQuery({
        queryKey: ["vendors-list"],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const { data, isLoading } = useQuery({
        queryKey: ["service-maps", page, debouncedSearch],
        queryFn: () =>
            serviceMapService.getServiceMaps({
                page,
                limit,
                search: debouncedSearch,
                sortBy: "vendor",
                sortOrder: "asc",
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await serviceMapService.exportServiceMaps({
                search: debouncedSearch,
                sortBy: "vendor",
                sortOrder: "asc",
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

    const getVendorName = (id: number) => {
        return vendorsData?.data?.find((v: any) => v.id === id)?.vendorName || `ID: ${id}`
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
    const filteredRows =
        data?.data.filter((serviceMap: ServiceMap) => {
            const vendorName = getVendorName(serviceMap.vendorId)
            const weightText = `${serviceMap.minWeight} - ${serviceMap.maxWeight} kg`

            if (colFilters.vendor && !vendorName.toLowerCase().includes(colFilters.vendor.toLowerCase())) return false
            if (colFilters.serviceType && !serviceMap.serviceType.toLowerCase().includes(colFilters.serviceType.toLowerCase())) return false
            if (colFilters.weight && !weightText.toLowerCase().includes(colFilters.weight.toLowerCase())) return false
            if (colFilters.status && !serviceMap.status.toLowerCase().includes(colFilters.status.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.service_map.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
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
                            <FileUp className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["service-maps"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <PermissionGuard permission="master.service_map.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Service Map">
                        <Plus className="mr-1 h-4 w-4" /> Add Service Map
                    </Button>
                </PermissionGuard>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Search:</span>
                <Input placeholder="Search service maps..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1200px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Vendor <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Service Type <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Weight (Min-Max) <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground"><span className="inline-flex items-center">Single Pc <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Status <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Vendor" className="h-8 border-border bg-background text-xs" value={colFilters.vendor} onChange={(e) => setColFilters((f) => ({ ...f, vendor: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Service Type" className="h-8 border-border bg-background text-xs" value={colFilters.serviceType} onChange={(e) => setColFilters((f) => ({ ...f, serviceType: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Weight" className="h-8 border-border bg-background text-xs" value={colFilters.weight} onChange={(e) => setColFilters((f) => ({ ...f, weight: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Single Pc" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Status" className="h-8 border-border bg-background text-xs" value={colFilters.status} onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading service maps...</TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No service maps found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((serviceMap: ServiceMap, index) => (
                                <TableRow key={serviceMap.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">
                                        <div className="flex items-center">
                                            {getVendorName(serviceMap.vendorId)}
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
                                    <TableCell className="text-foreground">{serviceMap.minWeight} - {serviceMap.maxWeight} kg</TableCell>
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
