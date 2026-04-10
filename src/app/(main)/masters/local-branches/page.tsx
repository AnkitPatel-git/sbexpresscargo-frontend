"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
import { cn } from "@/lib/utils"

import { localBranchService } from "@/services/masters/local-branch-service"
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

export default function LocalBranchesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({
        code: "",
        branchName: "",
        city: "",
        state: "",
        telephone: "",
        gstNo: "",
    })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["local-branches", page, debouncedSearch],
        queryFn: () =>
            localBranchService.getLocalBranches({
                page,
                limit,
                search: debouncedSearch,
                sortBy: "branchCode",
                sortOrder: "asc",
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await localBranchService.exportLocalBranches({
                search: debouncedSearch,
                sortBy: "branchCode",
                sortOrder: "asc",
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Local branches exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export local branches")
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => localBranchService.deleteLocalBranch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["local-branches"] })
            toast.success("Local branch deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete local branch")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/local-branches/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/local-branches/${id}/edit`)
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
        data?.data.filter((branch) => {
            if (colFilters.code && !(branch.branchCode || "").toLowerCase().includes(colFilters.code.toLowerCase())) return false
            if (colFilters.branchName && !(branch.name || "").toLowerCase().includes(colFilters.branchName.toLowerCase())) return false
            if (colFilters.city && !(branch.city || "").toLowerCase().includes(colFilters.city.toLowerCase())) return false
            if (colFilters.state && !(branch.state || "").toLowerCase().includes(colFilters.state.toLowerCase())) return false
            if (colFilters.telephone && !(branch.telephone || "").toLowerCase().includes(colFilters.telephone.toLowerCase())) return false
            if (colFilters.gstNo && !(branch.gstNo || "").toLowerCase().includes(colFilters.gstNo.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.local_branch.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="master.local_branch.read">
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
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["local-branches"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <PermissionGuard permission="master.local_branch.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Branch">
                        <Plus className="mr-1 h-4 w-4" /> Add Branch
                    </Button>
                </PermissionGuard>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Search:</span>
                <Input placeholder="Search branches..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1150px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Code <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Branch Name <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">City <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">State <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Telephone <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">GST No <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Code" className="h-8 border-border bg-background text-xs" value={colFilters.code} onChange={(e) => setColFilters((f) => ({ ...f, code: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Branch Name" className="h-8 border-border bg-background text-xs" value={colFilters.branchName} onChange={(e) => setColFilters((f) => ({ ...f, branchName: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="City" className="h-8 border-border bg-background text-xs" value={colFilters.city} onChange={(e) => setColFilters((f) => ({ ...f, city: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="State" className="h-8 border-border bg-background text-xs" value={colFilters.state} onChange={(e) => setColFilters((f) => ({ ...f, state: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Telephone" className="h-8 border-border bg-background text-xs" value={colFilters.telephone} onChange={(e) => setColFilters((f) => ({ ...f, telephone: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="GST No" className="h-8 border-border bg-background text-xs" value={colFilters.gstNo} onChange={(e) => setColFilters((f) => ({ ...f, gstNo: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading branches...</TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No branches found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((branch, index) => (
                                <TableRow key={branch.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{branch.branchCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{branch.name}</TableCell>
                                    <TableCell className="text-foreground">{branch.city}</TableCell>
                                    <TableCell className="text-foreground">{branch.state}</TableCell>
                                    <TableCell className="text-foreground">{branch.telephone || "-"}</TableCell>
                                    <TableCell className="text-foreground">{branch.gstNo}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.local_branch.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(branch.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.local_branch.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(branch.id)}>
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
                            This action cannot be undone. This will permanently delete the local branch
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
