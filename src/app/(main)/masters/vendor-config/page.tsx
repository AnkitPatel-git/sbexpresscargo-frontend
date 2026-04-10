"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Loader2, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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

import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { VendorConfig } from "@/types/masters/vendor-config"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function VendorConfigPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({ vendor: "", mode: "", environment: "" })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["vendor-configs", page, debouncedSearch],
        queryFn: () => vendorConfigService.getVendorConfigs({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorConfigService.deleteVendorConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-configs"] })
            toast.success("Vendor config deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete vendor config")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/vendor-config/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/vendor-config/${id}/edit`)
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
        data?.data.filter((vc) => {
            if (colFilters.vendor && !(vc.vendor?.vendorName || "").toLowerCase().includes(colFilters.vendor.toLowerCase())) return false
            if (colFilters.mode && !(vc.mode || "").toLowerCase().includes(colFilters.mode.toLowerCase())) return false
            if (colFilters.environment && !(vc.environment || "").toLowerCase().includes(colFilters.environment.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.vendor_config.create"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button></PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["vendor-configs"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input placeholder="Search configs..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <PermissionGuard permission="master.vendor_config.create"><Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><Plus className="mr-1 h-4 w-4" />Add Config</Button></PermissionGuard>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[980px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Vendor <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Mode <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Environment <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Customer</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Base URL</TableHead>
                            <TableHead className="font-semibold text-primary-foreground text-center">Active</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Vendor" className="h-8 border-border bg-background text-xs" value={colFilters.vendor} onChange={(e) => setColFilters((f) => ({ ...f, vendor: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Mode" className="h-8 border-border bg-background text-xs" value={colFilters.mode} onChange={(e) => setColFilters((f) => ({ ...f, mode: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Environment" className="h-8 border-border bg-background text-xs" value={colFilters.environment} onChange={(e) => setColFilters((f) => ({ ...f, environment: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                            <TableHead className="p-2" />
                            <TableHead className="p-2" />
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading vendor configs...</span></TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No vendor configs found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((vc: VendorConfig, index) => (
                                <TableRow key={vc.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{vc.vendor?.vendorName || '-'}</TableCell>
                                    <TableCell className="text-foreground">{vc.mode}</TableCell>
                                    <TableCell className="text-foreground">{vc.environment}</TableCell>
                                    <TableCell className="text-foreground">{vc.customer?.name || '-'}</TableCell>
                                    <TableCell className="text-foreground text-xs truncate max-w-[200px]">{vc.baseUrl || '-'}</TableCell>
                                    <TableCell className="text-center"><Badge variant={vc.isActive ? "success" : "secondary"}>{vc.isActive ? "Yes" : "No"}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.vendor_config.update"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(vc.id)}><Edit className="h-4 w-4" /></Button></PermissionGuard>
                                            <PermissionGuard permission="master.vendor_config.delete"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(vc.id)}><Trash2 className="h-4 w-4" /></Button></PermissionGuard>
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
                            This action cannot be undone. This will permanently delete the vendor config record.
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
