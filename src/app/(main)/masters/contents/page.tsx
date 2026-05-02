"use client"

import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, FileDown, FileUp, Filter, FilePlus, Download } from "lucide-react"
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
import {
    bulkUploadLogService,
    canDownloadBulkUploadErrorsCsv,
} from "@/services/utilities/bulk-upload-log-service"
import { Content } from "@/types/masters/content"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

export default function ContentsPage() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", code: "", name: "", hsn: "" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)
    const [sortBy, setSortBy] = useState("contentCode")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
    const importFileInputRef = useRef<HTMLInputElement | null>(null)

    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [importOpen, setImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importSummary, setImportSummary] = useState<{
        created: number
        failed: number
        failures: Array<{ row: number; message: string }>
        successes: Array<{ row: number; contentCode: string }>
        bulkUploadLogId?: number
    } | null>(null)
    const [downloadingTemplate, setDownloadingTemplate] = useState(false)
    const [downloadingErrorCsv, setDownloadingErrorCsv] = useState(false)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["contents", page, debouncedSearch, sortBy, sortOrder],
        queryFn: () =>
            contentService.getContents({
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
            const { blob, filename } = await contentService.exportContents({
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
            toast.success("Contents exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export contents")
        } finally {
            setExporting(false)
        }
    }

    async function handleDownloadImportErrorCsv() {
        if (
            !importSummary?.bulkUploadLogId ||
            !canDownloadBulkUploadErrorsCsv(importSummary.failed)
        ) {
            return
        }
        setDownloadingErrorCsv(true)
        try {
            const { blob, filename } = await bulkUploadLogService.downloadErrorRowsCsv(
                importSummary.bulkUploadLogId,
            )
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Error details CSV downloaded")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to download error CSV")
        } finally {
            setDownloadingErrorCsv(false)
        }
    }

    async function handleDownloadImportTemplate() {
        setDownloadingTemplate(true)
        try {
            const { blob, filename } = await contentService.downloadImportTemplate()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to download template")
        } finally {
            setDownloadingTemplate(false)
        }
    }

    const importMutation = useMutation({
        mutationFn: (file: File) => contentService.importContentsFromExcel(file),
        onSuccess: (summary) => {
            setImportSummary(summary)
            setImportFile(null)
            if (importFileInputRef.current) importFileInputRef.current.value = ""
            queryClient.invalidateQueries({ queryKey: ["contents"] })
            if (summary.failed > 0) {
                toast.warning(`Imported ${summary.created} contents, ${summary.failed} failed`)
            } else {
                toast.success(`Imported ${summary.created} contents`)
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to import contents")
        },
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

    const onImportDialogOpenChange = (open: boolean) => {
        setImportOpen(open)
        if (!open) {
            setImportFile(null)
            setImportSummary(null)
            if (importFileInputRef.current) importFileInputRef.current.value = ""
        }
    }

    const onPickImportFile = (fileList: FileList | null) => {
        setImportFile(fileList?.[0] ?? null)
        setImportSummary(null)
    }

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const filteredRows =
        data?.data.filter((content) => {
            if (appliedFilters.code && !(content.contentCode || "").toLowerCase().includes(appliedFilters.code.toLowerCase())) return false
            if (appliedFilters.name && !(content.contentName || "").toLowerCase().includes(appliedFilters.name.toLowerCase())) return false
            if (appliedFilters.hsn && !(content.hsnCode || "").toLowerCase().includes(appliedFilters.hsn.toLowerCase())) return false
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
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
                <PermissionGuard permission="master.content.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={handleCreate}>
                        <FilePlus className="h-4 w-4" />
                        Add Content
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[700px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><SortableColumnHeader label="Code" field="contentCode" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Content Name" field="contentName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="HSN Code" field="hsnCode" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading contents...</TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No contents found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((content: Content, index) => (
                                <TableRow key={content.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{content.contentCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{content.contentName}</TableCell>
                                    <TableCell className="text-foreground">{content.hsnCode || "-"}</TableCell>
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
            <Dialog open={importOpen} onOpenChange={onImportDialogOpenChange}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Import Contents</DialogTitle>
                        <DialogDescription>Upload an Excel file using the content import template.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9"
                            disabled={downloadingTemplate}
                            onClick={() => void handleDownloadImportTemplate()}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                        <Input
                            ref={importFileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            className="h-9 bg-background"
                            onChange={(e) => onPickImportFile(e.target.files)}
                        />
                        {importSummary ? (
                            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                                <p className="font-medium text-foreground">
                                    Created {importSummary.created}; Failed {importSummary.failed}
                                </p>
                                {importSummary.failures.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                        <div className="max-h-32 overflow-auto text-muted-foreground">
                                            {importSummary.failures.slice(0, 5).map((failure) => (
                                                <p key={`${failure.row}-${failure.message}`}>
                                                    Row {failure.row}: {failure.message}
                                                </p>
                                            ))}
                                        </div>
                                        {canDownloadBulkUploadErrorsCsv(importSummary.failed) &&
                                        importSummary.bulkUploadLogId != null ? (
                                            <PermissionGuard permission="utility.bulk_upload_log.read">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    disabled={downloadingErrorCsv}
                                                    onClick={() => void handleDownloadImportErrorCsv()}
                                                >
                                                    {downloadingErrorCsv
                                                        ? "Downloading…"
                                                        : "Download all errors (CSV)"}
                                                </Button>
                                            </PermissionGuard>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button type="button" variant="outline" onClick={() => onImportDialogOpenChange(false)}>Close</Button>
                        <Button
                            type="button"
                            disabled={!importFile || importMutation.isPending}
                            onClick={() => importFile && importMutation.mutate(importFile)}
                        >
                            Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
