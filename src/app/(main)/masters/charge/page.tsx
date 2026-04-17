"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Edit, Trash2, FileUp, Filter, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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

import { chargeService } from "@/services/masters/charge-service"
import { Charge } from "@/types/masters/charge"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ChargePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", code: "", name: "", calculationBase: "", applyFuel: "all", applyTaxOnFuel: "all", applyTax: "all" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)
    const debouncedCode = useDebounce(appliedFilters.code, 500)
    const debouncedName = useDebounce(appliedFilters.name, 500)
    const debouncedCalculationBase = useDebounce(appliedFilters.calculationBase, 500)

    const parseBooleanFilter = (value: string): boolean | undefined =>
        value === "all" ? undefined : value === "true"

    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["charges", page, debouncedSearch, debouncedCode, debouncedName, debouncedCalculationBase, appliedFilters.applyFuel, appliedFilters.applyTaxOnFuel, appliedFilters.applyTax],
        queryFn: () =>
            chargeService.getCharges({
                page,
                limit,
                search: debouncedSearch,
                sortBy: "sequence",
                sortOrder: "asc",
                code: debouncedCode,
                name: debouncedName,
                calculationBase: debouncedCalculationBase,
                applyFuel: parseBooleanFilter(appliedFilters.applyFuel),
                applyTaxOnFuel: parseBooleanFilter(appliedFilters.applyTaxOnFuel),
                applyTax: parseBooleanFilter(appliedFilters.applyTax),
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await chargeService.exportCharges({
                search: debouncedSearch,
                sortBy: "sequence",
                sortOrder: "asc",
                code: debouncedCode,
                name: debouncedName,
                calculationBase: debouncedCalculationBase,
                applyFuel: parseBooleanFilter(appliedFilters.applyFuel),
                applyTaxOnFuel: parseBooleanFilter(appliedFilters.applyTaxOnFuel),
                applyTax: parseBooleanFilter(appliedFilters.applyTax),
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Charges exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export charges")
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => chargeService.deleteCharge(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["charges"] })
            toast.success("Charge deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete charge")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/charge/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/charge/${id}/edit`)
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
                                <DialogTitle>Charge Filters</DialogTitle>
                                <DialogDescription>Filter the charge list from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                <Input placeholder="Charge Name" className="h-9 bg-background" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                                <Input placeholder="Calc Base" className="h-9 bg-background" value={draftFilters.calculationBase} onChange={(e) => setDraftFilters((prev) => ({ ...prev, calculationBase: e.target.value }))} />
                                <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={draftFilters.applyFuel} onChange={(e) => setDraftFilters((prev) => ({ ...prev, applyFuel: e.target.value }))}>
                                    <option value="all">All Fuel</option>
                                    <option value="true">Fuel Yes</option>
                                    <option value="false">Fuel No</option>
                                </select>
                                <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={draftFilters.applyTaxOnFuel} onChange={(e) => setDraftFilters((prev) => ({ ...prev, applyTaxOnFuel: e.target.value }))}>
                                    <option value="all">All Tax On Fuel</option>
                                    <option value="true">Tax On Fuel Yes</option>
                                    <option value="false">Tax On Fuel No</option>
                                </select>
                                <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={draftFilters.applyTax} onChange={(e) => setDraftFilters((prev) => ({ ...prev, applyTax: e.target.value }))}>
                                    <option value="all">All Tax</option>
                                    <option value="true">Tax Yes</option>
                                    <option value="false">Tax No</option>
                                </select>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["charges"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                    <PermissionGuard permission="master.charge.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button>
                    </PermissionGuard>
                    <PermissionGuard permission="master.charge.read">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            disabled={exporting}
                            onClick={() => void handleExportCsv()}
                            title="Export CSV"
                        >
                            <FileUp className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["charges"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <PermissionGuard permission="master.charge.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><FilePlus className="mr-1 h-4 w-4" />Add Charge</Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1080px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Charge Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Charge Type <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Calc Base <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Rate <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground text-center">Sequence <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading charges...</TableCell></TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No charges found.</TableCell></TableRow>
                        ) : (
                            rows.map((charge: Charge, index) => (
                                <TableRow key={charge.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{charge.code}</TableCell>
                                    <TableCell className="font-medium text-foreground">{charge.name}</TableCell>
                                    <TableCell><Badge variant="outline">{charge.chargeType || "-"}</Badge></TableCell>
                                    <TableCell className="text-foreground">{charge.calculationBase}</TableCell>
                                    <TableCell className="font-bold text-foreground">₹{charge.chargeRate}</TableCell>
                                    <TableCell className="text-center text-foreground">{charge.sequence}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.charge.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(charge.id)}><Edit className="h-4 w-4" /></Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.charge.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(charge.id)}><Trash2 className="h-4 w-4" /></Button>
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
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)}>»</Button>
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the charge
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
