"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Loader2, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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

import { vendorService } from "@/services/masters/vendor-service"
import { Vendor } from "@/types/masters/vendor"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function VendorPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({ code: "", name: "", origin: "", status: "" })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["vendors", page, debouncedSearch],
        queryFn: () => vendorService.getVendors({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorService.deleteVendor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] })
            toast.success("Vendor deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete vendor")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/vendor/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/vendor/${id}/edit`)
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
        data?.data.filter((vendor) => {
            if (colFilters.code && !(vendor.vendorCode || "").toLowerCase().includes(colFilters.code.toLowerCase())) return false
            if (colFilters.name && !(vendor.vendorName || "").toLowerCase().includes(colFilters.name.toLowerCase())) return false
            if (colFilters.origin && !(vendor.origin || "").toLowerCase().includes(colFilters.origin.toLowerCase())) return false
            if (colFilters.status && !(vendor.status || "").toLowerCase().includes(colFilters.status.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.vendor.create"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button></PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={async () => { try { const blob = await vendorService.exportVendorsCsv(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "vendors.csv"; a.click(); URL.revokeObjectURL(url); } catch { toast.error("Failed to export vendors"); } }}><FileUp className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["vendors"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input placeholder="Search vendors..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <PermissionGuard permission="master.vendor.create"><Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><Plus className="mr-1 h-4 w-4" />Add Vendor</Button></PermissionGuard>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[980px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Vendor Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Contact Person <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Origin <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground text-center">Status <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Code" className="h-8 border-border bg-background text-xs" value={colFilters.code} onChange={(e) => setColFilters((f) => ({ ...f, code: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Vendor Name" className="h-8 border-border bg-background text-xs" value={colFilters.name} onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Contact Person" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Origin" className="h-8 border-border bg-background text-xs" value={colFilters.origin} onChange={(e) => setColFilters((f) => ({ ...f, origin: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Status" className="h-8 border-border bg-background text-xs" value={colFilters.status} onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading vendors...</span></TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No vendors found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((vendor: Vendor, index) => (
                                <TableRow key={vendor.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{vendor.vendorCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{vendor.vendorName}</TableCell>
                                    <TableCell className="text-foreground">{vendor.contactPerson}</TableCell>
                                    <TableCell className="text-foreground">{vendor.origin || "-"}</TableCell>
                                    <TableCell className="text-center"><Badge variant={vendor.status === "ACTIVE" ? "success" : "secondary"}>{vendor.status === "ACTIVE" ? "Active" : "Inactive"}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.vendor.update"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(vendor.id)}><Edit className="h-4 w-4" /></Button></PermissionGuard>
                                            <PermissionGuard permission="master.vendor.delete"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(vendor.id)}><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
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
                            This action cannot be undone. This will permanently delete the vendor record.
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
