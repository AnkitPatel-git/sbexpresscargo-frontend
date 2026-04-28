"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit, FilePlus, FileDown, Filter, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/permission-guard"
import { MasterExcelImportButton } from "@/components/masters/master-excel-import-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { shipperService } from "@/services/masters/shipper-service"
import { Shipper } from "@/types/masters/shipper"
import { cn } from "@/lib/utils"

type ShipperFilters = { search: string; shipperCode: string; shipperName: string; aadhaarNo: string }
const emptyFilters: ShipperFilters = { search: "", shipperCode: "", shipperName: "", aadhaarNo: "" }

export default function ShipperPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState<ShipperFilters>(emptyFilters)
    const [draftFilters, setDraftFilters] = useState<ShipperFilters>(emptyFilters)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        if (filtersOpen) {
            setDraftFilters(appliedFilters)
        }
    }, [appliedFilters, filtersOpen])

    const listParams = {
        page,
        limit,
        search: appliedFilters.search || undefined,
        sortBy: "shipperCode",
        sortOrder: "asc" as const,
        shipperCode: appliedFilters.shipperCode || undefined,
        shipperName: appliedFilters.shipperName || undefined,
        aadhaarNo: appliedFilters.aadhaarNo || undefined,
    }

    const { data, isLoading } = useQuery({
        queryKey: ["shippers", listParams],
        queryFn: () => shipperService.getShippers(listParams),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => shipperService.deleteShipper(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shippers"] })
            toast.success("Shipper deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete shipper")
            setDeleteId(null)
        },
    })

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await shipperService.exportShippers(listParams)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Shippers exported")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to export shippers")
        } finally {
            setExporting(false)
        }
    }

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    const applyFilters = () => {
        setAppliedFilters(draftFilters)
        setPage(1)
        setFiltersOpen(false)
    }

    const resetFilters = () => {
        setDraftFilters(emptyFilters)
        setAppliedFilters(emptyFilters)
        setPage(1)
        setFiltersOpen(false)
    }

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 self-start rounded-md border border-border p-1 sm:self-auto">
                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Shipper Filters</DialogTitle>
                                <DialogDescription>Use these filters to narrow the shipper list.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search shippers..." className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.shipperCode} onChange={(e) => setDraftFilters((prev) => ({ ...prev, shipperCode: e.target.value }))} />
                                <Input placeholder="Shipper Name" className="h-9 bg-background" value={draftFilters.shipperName} onChange={(e) => setDraftFilters((prev) => ({ ...prev, shipperName: e.target.value }))} />
                                <Input placeholder="Aadhaar No" className="h-9 bg-background" value={draftFilters.aadhaarNo} onChange={(e) => setDraftFilters((prev) => ({ ...prev, aadhaarNo: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard permission="master.shipper.create">
                        <MasterExcelImportButton master="shippers" label="Shippers" queryKey={["shippers"]} />
                    </PermissionGuard>
                    <PermissionGuard permission="master.shipper.read">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" disabled={exporting} onClick={() => void handleExportCsv()}>
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>

                <PermissionGuard permission="master.shipper.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={() => router.push("/masters/shipper/create")}>
                        <FilePlus className="h-4 w-4" />
                        Add Shipper
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[900px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Code</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Shipper Name</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Contact Person</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Aadhaar No</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading shippers...</TableCell>
                            </TableRow>
                        ) : (data?.data ?? []).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No shippers found.</TableCell>
                            </TableRow>
                        ) : (
                            (data?.data ?? []).map((shipper: Shipper, index) => (
                                <TableRow key={shipper.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{shipper.shipperCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{shipper.shipperName}</TableCell>
                                    <TableCell className="text-foreground">{shipper.contactPerson || "-"}</TableCell>
                                    <TableCell className="text-foreground">{shipper.aadhaarNo || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.shipper.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => router.push(`/masters/shipper/${shipper.id}/edit`)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.shipper.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => setDeleteId(shipper.id)}>
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
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)}>»</Button>
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the shipper record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
