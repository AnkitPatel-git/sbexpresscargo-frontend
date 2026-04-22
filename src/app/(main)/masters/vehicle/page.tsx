"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, Loader2, RefreshCw, FilePlus, Filter, ChevronUp, ChevronDown } from "lucide-react"
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

import { vehicleService } from "@/services/masters/vehicle-service"
import { Vehicle } from "@/types/masters/vehicle"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function VehiclePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", vehicleNo: "", vehicleType: "", status: "", driverUserId: "" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)
    const debouncedVehicleNo = useDebounce(appliedFilters.vehicleNo, 500)
    const debouncedVehicleType = useDebounce(appliedFilters.vehicleType, 500)
    const debouncedStatus = useDebounce(appliedFilters.status, 500)
    const debouncedDriverUserId = useDebounce(appliedFilters.driverUserId, 500)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["vehicles", page, debouncedSearch, debouncedVehicleNo, debouncedVehicleType, debouncedStatus, debouncedDriverUserId],
        queryFn: () => vehicleService.getVehicles({
            page,
            limit,
            search: debouncedSearch,
            sortBy: "vehicleNo",
            sortOrder: "asc",
            vehicleNo: debouncedVehicleNo,
            vehicleType: debouncedVehicleType,
            status: debouncedStatus,
            driverUserId: debouncedDriverUserId ? Number(debouncedDriverUserId) : undefined,
        }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vehicleService.deleteVehicle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] })
            toast.success("Vehicle deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete vehicle")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/vehicle/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/vehicle/${id}/edit`)
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
                                <DialogTitle>Vehicle Filters</DialogTitle>
                                <DialogDescription>Filter the vehicle list from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Vehicle No" className="h-9 bg-background" value={draftFilters.vehicleNo} onChange={(e) => setDraftFilters((prev) => ({ ...prev, vehicleNo: e.target.value }))} />
                                <Input placeholder="Type" className="h-9 bg-background" value={draftFilters.vehicleType} onChange={(e) => setDraftFilters((prev) => ({ ...prev, vehicleType: e.target.value }))} />
                                <Input placeholder="Driver User ID" className="h-9 bg-background" value={draftFilters.driverUserId} onChange={(e) => setDraftFilters((prev) => ({ ...prev, driverUserId: e.target.value }))} />
                                <Input placeholder="Status" className="h-9 bg-background" value={draftFilters.status} onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["vehicles"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <PermissionGuard permission="master.vehicle.create"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button></PermissionGuard>
                </div>
                <PermissionGuard permission="master.vehicle.create"><Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><FilePlus className="mr-1 h-4 w-4" />Add Vehicle</Button></PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[980px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Vehicle No <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Type <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Owner <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Driver <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Capacity (kg)</TableHead>
                            <TableHead className="font-semibold text-primary-foreground text-center">Status <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading vehicles...</span></TableCell></TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No vehicles found.</TableCell></TableRow>
                        ) : (
                            rows.map((vehicle: Vehicle, index) => (
                                <TableRow key={vehicle.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{vehicle.vehicleNo}</TableCell>
                                    <TableCell className="text-foreground">{vehicle.vehicleType.replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="text-foreground">{vehicle.ownerName || '-'}</TableCell>
                                    <TableCell className="text-foreground">{vehicle.driverName || '-'}</TableCell>
                                    <TableCell className="text-foreground">{vehicle.capacityKg ?? '-'}</TableCell>
                                    <TableCell className="text-center"><Badge variant={vehicle.status === "ACTIVE" ? "success" : "secondary"}>{vehicle.status === "ACTIVE" ? "Active" : "Inactive"}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.vehicle.update"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(vehicle.id)}><Edit className="h-4 w-4" /></Button></PermissionGuard>
                                            <PermissionGuard permission="master.vehicle.delete"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(vehicle.id)}><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
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

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            This action cannot be undone. This will permanently delete the vehicle record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            Delete Record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
