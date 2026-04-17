"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit, FilePlus, FileUp, Filter, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/permission-guard"
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
import { consigneeService } from "@/services/masters/consignee-service"
import { Consignee } from "@/types/masters/consignee"
import { cn } from "@/lib/utils"

type ConsigneeFilters = { search: string; code: string; name: string }
const emptyFilters: ConsigneeFilters = { search: "", code: "", name: "" }

export default function ConsigneePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState<ConsigneeFilters>(emptyFilters)
    const [draftFilters, setDraftFilters] = useState<ConsigneeFilters>(emptyFilters)
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
        sortBy: "code",
        sortOrder: "asc" as const,
        code: appliedFilters.code || undefined,
        name: appliedFilters.name || undefined,
    }

    const { data, isLoading } = useQuery({
        queryKey: ["consignees", listParams],
        queryFn: () => consigneeService.getConsignees(listParams),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => consigneeService.deleteConsignee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["consignees"] })
            toast.success("Consignee deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete consignee")
            setDeleteId(null)
        },
    })

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await consigneeService.exportConsignees(listParams)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Consignees exported")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to export consignees")
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
                                <DialogTitle>Consignee Filters</DialogTitle>
                                <DialogDescription>Use popup filters to keep the list page clean.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search consignees..." className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                <Input placeholder="Consignee Name" className="h-9 bg-background sm:col-span-2" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard permission="master.consignee.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => router.push("/masters/consignee/create")}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="master.consignee.read">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" disabled={exporting} onClick={() => void handleExportCsv()}>
                            <FileUp className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["consignees"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <PermissionGuard permission="master.consignee.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={() => router.push("/masters/consignee/create")}>
                        <FilePlus className="h-4 w-4" />
                        Add Consignee
                    </Button>
                </PermissionGuard>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[760px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Code</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Consignee Name</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Loading consignees...</TableCell>
                            </TableRow>
                        ) : (data?.data ?? []).length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No consignees found.</TableCell>
                            </TableRow>
                        ) : (
                            (data?.data ?? []).map((consignee: Consignee, index) => (
                                <TableRow key={consignee.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{consignee.code}</TableCell>
                                    <TableCell className="font-medium text-foreground">{consignee.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.consignee.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => router.push(`/masters/consignee/${consignee.id}/edit`)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.consignee.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => setDeleteId(consignee.id)}>
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
                            This action cannot be undone. This will permanently delete the consignee from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
