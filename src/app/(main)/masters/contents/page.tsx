"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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

function contentCountryLabel(c: Content): string {
    const x = c.country
    if (x == null) return "-"
    if (typeof x === "string") return x || "-"
    return x.name ?? "-"
}

export default function ContentsPage() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", code: "", name: "", hsn: "", country: "" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["contents", page, debouncedSearch],
        queryFn: () =>
            contentService.getContents({
                page,
                limit,
                search: debouncedSearch,
                sortBy: "contentCode",
                sortOrder: "asc",
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await contentService.exportContents({
                search: debouncedSearch,
                sortBy: "contentCode",
                sortOrder: "asc",
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Contents exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export contents")
        } finally {
            setExporting(false)
        }
    }

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
            const countryName = contentCountryLabel(content)
            if (appliedFilters.code && !(content.contentCode || "").toLowerCase().includes(appliedFilters.code.toLowerCase())) return false
            if (appliedFilters.name && !(content.contentName || "").toLowerCase().includes(appliedFilters.name.toLowerCase())) return false
            if (appliedFilters.hsn && !(content.hsnCode || "").toLowerCase().includes(appliedFilters.hsn.toLowerCase())) return false
            if (appliedFilters.country && !countryName.toLowerCase().includes(appliedFilters.country.toLowerCase())) return false
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
                                <DialogTitle>Content Filters</DialogTitle>
                                <DialogDescription>Filter the content list from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                <Input placeholder="Content Name" className="h-9 bg-background" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                                <Input placeholder="HSN Code" className="h-9 bg-background" value={draftFilters.hsn} onChange={(e) => setDraftFilters((prev) => ({ ...prev, hsn: e.target.value }))} />
                                <Input placeholder="Country" className="h-9 bg-background" value={draftFilters.country} onChange={(e) => setDraftFilters((prev) => ({ ...prev, country: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["contents"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                    <PermissionGuard permission="master.content.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button>
                    </PermissionGuard>
                    <PermissionGuard permission="master.content.read">
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
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["contents"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <PermissionGuard permission="master.content.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><FilePlus className="mr-1 h-4 w-4" />Add Content</Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[800px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Content Name <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">HSN Code <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Country <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading contents...</TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No contents found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((content: Content, index) => (
                                <TableRow key={content.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{content.contentCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{content.contentName}</TableCell>
                                    <TableCell className="text-foreground">{content.hsnCode || "-"}</TableCell>
                                    <TableCell className="text-foreground">{contentCountryLabel(content)}</TableCell>
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
