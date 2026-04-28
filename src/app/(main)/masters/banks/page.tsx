"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, FileDown, Filter, FilePlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useRouter } from "next/navigation"
import { bankService } from "@/services/masters/bank-service"
import { Bank } from "@/types/masters/bank"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { MasterExcelImportButton } from "@/components/masters/master-excel-import-button"
import { useDebounce } from "@/hooks/use-debounce"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

type BankFilters = { code: string; name: string; status: string }
const defaultFilters: BankFilters = { code: "", name: "", status: "all" }

export default function BanksPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState<BankFilters>(defaultFilters)
    const [draftFilters, setDraftFilters] = useState<BankFilters>(defaultFilters)
    const [sortBy, setSortBy] = useState("bankCode")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["banks", page, debouncedSearch, sortBy, sortOrder],
        queryFn: () =>
            bankService.getBanks({
                page,
                limit,
                search: debouncedSearch,
                sortBy,
                sortOrder,
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await bankService.exportBanks({
                search: debouncedSearch,
                sortBy,
                sortOrder,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Banks exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export banks")
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => bankService.deleteBank(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banks"] })
            toast.success("Bank deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete bank")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/banks/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/banks/${id}/edit`)
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
    const filteredData = data?.data.filter((bank) => {
        if (appliedFilters.code && !bank.bankCode.toLowerCase().includes(appliedFilters.code.toLowerCase())) return false
        if (appliedFilters.name && !bank.bankName.toLowerCase().includes(appliedFilters.name.toLowerCase())) return false
        if (appliedFilters.status !== "all" && !bank.status.toLowerCase().includes(appliedFilters.status.toLowerCase())) return false
        return true
    }) ?? []
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
                <div className="flex flex-wrap items-center gap-1 self-start rounded-md border border-border p-1 sm:self-auto">
                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Bank Filters</DialogTitle>
                                <DialogDescription>Filter the bank list from this popup, then apply changes.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                <Input placeholder="Bank Name" className="h-9 bg-background" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                                <Select value={draftFilters.status} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}>
                                    <SelectTrigger className="h-9 w-full bg-background">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard permission="master.bank.create">
                        <MasterExcelImportButton master="banks" label="Banks" queryKey={["banks"]} />
                    </PermissionGuard>
                    <PermissionGuard permission="master.bank.read">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            disabled={exporting}
                            onClick={() => void handleExportCsv()}
                            title="Export CSV"
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
                <PermissionGuard permission="master.bank.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={handleCreate}>
                        <FilePlus className="h-4 w-4" />
                        Add Bank
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[760px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Code" field="bankCode" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Bank Name" field="bankName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading banks...</TableCell></TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No banks found.</TableCell></TableRow>
                        ) : (
                            filteredData.map((bank: Bank, index) => (
                                <TableRow key={bank.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{bank.bankCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{bank.bankName}</TableCell>
                                    <TableCell><Badge variant={bank.status === "ACTIVE" ? "success" : "secondary"}>{bank.status}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.bank.update"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(bank.id)}><Edit className="h-4 w-4" /></Button></PermissionGuard>
                                            <PermissionGuard permission="master.bank.delete"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(bank.id)}><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
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
                            This action cannot be undone. This will permanently delete the bank
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
