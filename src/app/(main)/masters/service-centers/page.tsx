"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, FileDown, Filter, FilePlus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
import { cn } from "@/lib/utils"

import { serviceCenterService } from "@/services/masters/service-center-service"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { MasterExcelImportButton } from "@/components/masters/master-excel-import-button"
import { useDebounce } from "@/hooks/use-debounce"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

export default function ServiceCentersPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", code: "", name: "", subName: "" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)
    const debouncedCode = useDebounce(appliedFilters.code, 400)
    const debouncedName = useDebounce(appliedFilters.name, 400)
    const debouncedSubName = useDebounce(appliedFilters.subName, 400)
    const [sortBy, setSortBy] = useState("code")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["service-centers", page, debouncedSearch, debouncedCode, debouncedName, debouncedSubName, sortBy, sortOrder],
        queryFn: () =>
            serviceCenterService.getServiceCenters({
                page,
                limit,
                search: debouncedSearch,
                sortBy,
                sortOrder,
                code: debouncedCode || undefined,
                name: debouncedName || undefined,
                subName: debouncedSubName || undefined,
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await serviceCenterService.exportServiceCenters({
                search: debouncedSearch,
                sortBy,
                sortOrder,
                code: debouncedCode || undefined,
                name: debouncedName || undefined,
                subName: debouncedSubName || undefined,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Service centers exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export service centers")
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceCenterService.deleteServiceCenter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service-centers"] })
            toast.success("Service center deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete service center")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/service-centers/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/service-centers/${id}/edit`)
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
                                <DialogTitle>Service Center Filters</DialogTitle>
                                <DialogDescription>Filter the service center list from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                <Input placeholder="SC Name" className="h-9 bg-background" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                                <Input placeholder="Sub Name" className="h-9 bg-background" value={draftFilters.subName} onChange={(e) => setDraftFilters((prev) => ({ ...prev, subName: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard permission="master.service_center.create">
                        <MasterExcelImportButton master="service-centers" label="Service Centers" queryKey={["service-centers"]} />
                    </PermissionGuard>
                    <PermissionGuard permission="master.service_center.read">
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
                <PermissionGuard permission="master.service_center.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={handleCreate}>
                        <FilePlus className="h-4 w-4" />
                        Add Service Center
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1250px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><SortableColumnHeader label="Code" field="code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="SC Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Sub Name" field="subName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Pin Code</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">City</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">State</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Telephone</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Email</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Loading service centers...</TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No service centers found.</TableCell>
                            </TableRow>
                        ) : (
                            rows.map((sc, index) => (
                                <TableRow key={sc.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{sc.code}</TableCell>
                                    <TableCell className="font-medium text-foreground">{sc.name}</TableCell>
                                    <TableCell className="text-foreground">{sc.subName}</TableCell>
                                    <TableCell className="text-foreground">{sc.serviceablePincode?.pinCode ?? "-"}</TableCell>
                                    <TableCell className="text-foreground">{sc.serviceablePincode?.cityName ?? "-"}</TableCell>
                                    <TableCell className="text-foreground">{sc.state?.stateName ?? "-"}</TableCell>
                                    <TableCell className="text-foreground">{sc.telephone}</TableCell>
                                    <TableCell className="text-foreground">{sc.email}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.service_center.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(sc.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.service_center.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(sc.id)}>
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
                            This action cannot be undone. This will permanently delete the service center
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
