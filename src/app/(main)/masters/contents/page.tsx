"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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
import { useRouter } from "next/navigation"
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
import { contentService } from "@/services/masters/content-service"
import { Content } from "@/types/masters/content"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ContentsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({ code: "", name: "", hsn: "", vendor: "", country: "" })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["contents", page, debouncedSearch],
        queryFn: () => contentService.getContents({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => contentService.deleteContent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contents"] })
            toast.success("Content deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete content")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/contents/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/contents/${id}/edit`)
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
        data?.data.filter((content) => {
            const vendorName = typeof content.vendor === "string" ? content.vendor : ""
            const countryName = typeof content.country === "string" ? content.country : ""
            if (colFilters.code && !(content.contentCode || "").toLowerCase().includes(colFilters.code.toLowerCase())) return false
            if (colFilters.name && !(content.contentName || "").toLowerCase().includes(colFilters.name.toLowerCase())) return false
            if (colFilters.hsn && !(content.hsnCode || "").toLowerCase().includes(colFilters.hsn.toLowerCase())) return false
            if (colFilters.vendor && !vendorName.toLowerCase().includes(colFilters.vendor.toLowerCase())) return false
            if (colFilters.country && !countryName.toLowerCase().includes(colFilters.country.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.content.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary"><FileUp className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["contents"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input placeholder="Search contents..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <PermissionGuard permission="master.content.create">
                        <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><Plus className="mr-1 h-4 w-4" />Add Content</Button>
                    </PermissionGuard>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[900px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Content Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">HSN Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Vendor <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Country <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Code" className="h-8 border-border bg-background text-xs" value={colFilters.code} onChange={(e) => setColFilters((f) => ({ ...f, code: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Content Name" className="h-8 border-border bg-background text-xs" value={colFilters.name} onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="HSN Code" className="h-8 border-border bg-background text-xs" value={colFilters.hsn} onChange={(e) => setColFilters((f) => ({ ...f, hsn: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Vendor" className="h-8 border-border bg-background text-xs" value={colFilters.vendor} onChange={(e) => setColFilters((f) => ({ ...f, vendor: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Country" className="h-8 border-border bg-background text-xs" value={colFilters.country} onChange={(e) => setColFilters((f) => ({ ...f, country: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading contents...</TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No contents found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((content: Content, index) => (
                                <TableRow key={content.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{content.contentCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{content.contentName}</TableCell>
                                    <TableCell className="text-foreground">{content.hsnCode || "-"}</TableCell>
                                    <TableCell className="text-foreground">{typeof content.vendor === "string" ? content.vendor : "-"}</TableCell>
                                    <TableCell className="text-foreground">{typeof content.country === "string" ? content.country : "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.content.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(content.id)}><Edit className="h-4 w-4" /></Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.content.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(content.id)}><Trash2 className="h-4 w-4" /></Button>
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
                            This action cannot be undone. This will permanently delete the content
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
