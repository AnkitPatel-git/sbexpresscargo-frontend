"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Check, X, FileDown, FileUp, Filter, Download } from "lucide-react"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { vendorServiceablePincodeService } from "@/services/utilities/vendor-serviceable-pincode-service"
import {
    bulkUploadLogService,
    canDownloadBulkUploadErrorsCsv,
} from "@/services/utilities/bulk-upload-log-service"
import { BulkUploadOriginalFileButton } from "@/components/utilities/bulk-upload-original-file-button"
import { VendorServiceablePincode } from "@/types/utilities/vendor-serviceable-pincode"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useAuth } from "@/context/auth-context"
import { useDebounce } from "@/hooks/use-debounce"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

export default function VendorServiceablePincodesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { hasPermission } = useAuth()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = {
        vendorCode: "",
        pinCode: "",
    }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const [sortBy, setSortBy] = useState("id")
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

    const debouncedVendorCode = useDebounce(appliedFilters.vendorCode, 400)
    const debouncedPinCode = useDebounce(appliedFilters.pinCode, 400)

    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [importOpen, setImportOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [importSummary, setImportSummary] = useState<{
        created: number
        updated: number
        failed: number
        failures: Array<{ row: number; message: string }>
        successes: Array<{ row: number; pinCode: string; vendorCode?: string; action?: "created" | "updated" }>
        bulkUploadLogId?: number
    } | null>(null)
    const [downloadingTemplate, setDownloadingTemplate] = useState(false)
    const [downloadingErrorCsv, setDownloadingErrorCsv] = useState(false)
    const importFileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: [
            "vendor-serviceable-pincodes",
            page,
            debouncedSearch,
            debouncedVendorCode,
            debouncedPinCode,
            sortBy,
            sortOrder,
        ],
        queryFn: () =>
            vendorServiceablePincodeService.getVendorServiceablePincodes({
                page,
                limit,
                search: debouncedSearch,
                sortBy,
                sortOrder,
                vendorCode: debouncedVendorCode || undefined,
                pinCode: debouncedPinCode || undefined,
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        const toastId = toast.loading("Exporting vendor pincodes…", {
            description: "Large datasets may take a minute. Please keep this tab open.",
        })
        try {
            const { blob, filename } = await vendorServiceablePincodeService.exportVendorServiceablePincodes({
                search: debouncedSearch,
                sortBy,
                sortOrder,
                vendorCode: debouncedVendorCode || undefined,
                pinCode: debouncedPinCode || undefined,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Vendor pincodes exported", { id: toastId })
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export vendor pincodes", {
                id: toastId,
            })
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorServiceablePincodeService.deleteVendorServiceablePincode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-serviceable-pincodes"] })
            toast.success("Vendor pincode deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete vendor pincode")
            setDeleteId(null)
        },
    })

    const importMutation = useMutation({
        mutationFn: (file: File) => vendorServiceablePincodeService.importVendorServiceablePincodesFromExcel(file),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["vendor-serviceable-pincodes"] })
            setImportSummary(result)
            if (result.failed === 0) {
                const ok = result.successes ?? []
                const sample = ok
                    .slice(0, 8)
                    .map((s) => `${s.vendorCode ?? ''}:${s.pinCode}`.replace(/^:/, ''))
                    .join(", ")
                const suffix = sample ? ` (${sample}${ok.length > 8 ? ", …" : ""})` : ""
                toast.success(
                    `Import completed: ${result.created} created, ${result.updated} updated${suffix}`,
                )
                setImportOpen(false)
                setImportFile(null)
                if (importFileInputRef.current) importFileInputRef.current.value = ""
            } else {
                toast.message("Import finished with some errors", {
                    description: `${result.created} created, ${result.updated} updated, ${result.failed} failed. See the dialog for details.`,
                })
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || "Import failed")
        },
    })

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
            const { blob, filename } = await vendorServiceablePincodeService.downloadImportTemplate()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Template downloaded")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to download template")
        } finally {
            setDownloadingTemplate(false)
        }
    }

    function onImportDialogOpenChange(open: boolean) {
        setImportOpen(open)
        if (!open) {
            setImportFile(null)
            setImportSummary(null)
            if (importFileInputRef.current) importFileInputRef.current.value = ""
        }
    }

    function onPickImportFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) {
            setImportFile(null)
            return
        }
        const lower = f.name.toLowerCase()
        if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
            toast.error("Only .xlsx or .xls files are allowed")
            e.target.value = ""
            setImportFile(null)
            return
        }
        setImportFile(f)
        setImportSummary(null)
    }

    const handleCreate = () => {
        router.push("/utilities/vendor-serviceable-pincodes/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/utilities/vendor-serviceable-pincodes/${id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

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

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    const rows = useMemo(() => data?.data ?? [], [data?.data])

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
                                <DialogTitle>Vendor Pincode Filters</DialogTitle>
                                <DialogDescription>Filter the vendor pincode list, then apply.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input
                                    placeholder="Vendor Code"
                                    className="h-9 bg-background"
                                    value={draftFilters.vendorCode}
                                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, vendorCode: e.target.value }))}
                                />
                                <Input
                                    placeholder="Pin Code"
                                    className="h-9 bg-background"
                                    value={draftFilters.pinCode}
                                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, pinCode: e.target.value }))}
                                />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard
                        anyOf={[
                            "utility.vendor_serviceable_pincode.create",
                            "utility.vendor_serviceable_pincode.update",
                        ]}
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Import from Excel"
                            onClick={() => {
                                setImportSummary(null)
                                setImportFile(null)
                                setImportOpen(true)
                            }}
                        >
                            <FileUp className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="utility.vendor_serviceable_pincode.read">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Export CSV"
                            disabled={exporting}
                            onClick={() => void handleExportCsv()}
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Input
                        placeholder="Search vendor or pincode..."
                        className="h-8 w-full sm:w-[240px]"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                    />
                    <PermissionGuard permission="utility.vendor_serviceable_pincode.create">
                        <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Vendor Pincode">
                            <Plus className="mr-1 h-4 w-4" /> Add Vendor Pincode
                        </Button>
                    </PermissionGuard>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1280px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Vendor Code</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Vendor Name</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Pin Code</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Service</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">City</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Area</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Zone</TableHead>
                            <TableHead className="text-right font-semibold text-primary-foreground">EDL km</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Serviceable" field="serviceable" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">
                                <SortableColumnHeader label="EDL" field="edl" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">Loading vendor pincodes...</TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">No vendor pincodes found.</TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row: VendorServiceablePincode, index) => (
                                <TableRow key={row.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{row.vendor?.vendorCode || '-'}</TableCell>
                                    <TableCell className="text-foreground">{row.vendor?.vendorName || '-'}</TableCell>
                                    <TableCell className="font-medium text-foreground">{row.pinCode ?? row.serviceablePincode?.pinCode ?? '-'}</TableCell>
                                    <TableCell className="text-foreground">
                                        {row.serviceMap?.serviceType ?? (row.serviceMapId == null ? 'All' : `-`)}
                                    </TableCell>
                                    <TableCell className="text-foreground">{row.cityName ?? row.serviceablePincode?.cityName ?? '-'}</TableCell>
                                    <TableCell className="text-foreground">{row.areaName ?? row.serviceablePincode?.areaName ?? '-'}</TableCell>
                                    <TableCell className="text-foreground">{row.zone?.code ?? '-'}</TableCell>
                                    <TableCell className="text-right text-foreground text-sm">
                                        {row.odaEdlDistanceKm != null && row.odaEdlDistanceKm !== ''
                                            ? String(row.odaEdlDistanceKm)
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {row.serviceable ? (
                                                <div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div>
                                            ) : (
                                                <div className="bg-red-100 p-1 rounded-full"><X className="h-3 w-3 text-red-600" /></div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {row.edl ? (
                                                <div className="bg-amber-100 p-1 rounded-full"><Check className="h-3 w-3 text-amber-600" /></div>
                                            ) : (
                                                <div className="bg-gray-100 p-1 rounded-full"><X className="h-3 w-3 text-gray-400" /></div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="utility.vendor_serviceable_pincode.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(row.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="utility.vendor_serviceable_pincode.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(row.id)}>
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

            <Dialog open={importOpen} onOpenChange={onImportDialogOpenChange}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Import vendor pincodes</DialogTitle>
                        <DialogDescription>
                            Download the Excel template (sheet &quot;VendorPincodes&quot;). Use vendor code, master pin code, optional service type (blank = all services), zone code, and Yes/No for serviceable / EDL. Re-uploading updates existing vendor+pincode+service mappings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        {hasPermission("utility.vendor_serviceable_pincode.read") ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-center gap-2"
                                disabled={downloadingTemplate}
                                onClick={() => void handleDownloadImportTemplate()}
                            >
                                <Download className="h-4 w-4" />
                                {downloadingTemplate ? "Downloading…" : "Download Excel template"}
                            </Button>
                        ) : (
                            <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                                Download template requires <span className="font-mono">utility.vendor_serviceable_pincode.read</span>.
                            </p>
                        )}
                        <div className="space-y-2">
                            <input
                                ref={importFileInputRef}
                                type="file"
                                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                className="hidden"
                                onChange={onPickImportFile}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full"
                                onClick={() => importFileInputRef.current?.click()}
                            >
                                {importFile ? `Selected: ${importFile.name}` : "Choose Excel file (.xlsx / .xls)"}
                            </Button>
                        </div>
                        {importSummary && (importSummary.created > 0 || importSummary.updated > 0 || importSummary.failed > 0) && (
                            <div className="max-h-52 space-y-3 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-sm">
                                <p className="font-medium text-foreground">
                                    {importSummary.created} added · {importSummary.updated} updated · {importSummary.failed} failed
                                </p>
                                {importSummary.bulkUploadLogId != null ? (
                                    <BulkUploadOriginalFileButton
                                        logId={importSummary.bulkUploadLogId}
                                        className="w-full gap-2"
                                    />
                                ) : null}
                                {(importSummary.created > 0 || importSummary.updated > 0) && (
                                    <div>
                                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Successful rows</p>
                                        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                                            {(importSummary.successes ?? []).slice(0, 40).map((s) => (
                                                <li key={`ok-${s.row}-${s.pinCode}-${s.vendorCode ?? ''}`}>
                                                    Row {s.row}: {s.vendorCode ? `${s.vendorCode} / ` : ''}{s.pinCode}
                                                    {s.action ? ` (${s.action})` : ""}
                                                </li>
                                            ))}
                                        </ul>
                                        {(importSummary.successes ?? []).length > 40 && (
                                            <p className="mt-1 text-xs text-muted-foreground">Showing first 40 successful rows.</p>
                                        )}
                                    </div>
                                )}
                                {importSummary.failed > 0 && (
                                    <div>
                                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Errors</p>
                                        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                                            {importSummary.failures.slice(0, 50).map((f) => (
                                                <li key={`${f.row}-${f.message}`}>
                                                    Row {f.row}: {f.message}
                                                </li>
                                            ))}
                                        </ul>
                                        {importSummary.failures.length > 50 && (
                                            <p className="mt-1 text-xs text-muted-foreground">Showing first 50 errors.</p>
                                        )}
                                        {canDownloadBulkUploadErrorsCsv(importSummary.failed) &&
                                        importSummary.bulkUploadLogId != null ? (
                                            hasPermission("utility.bulk_upload_log.read") ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 w-full"
                                                    disabled={downloadingErrorCsv}
                                                    onClick={() => void handleDownloadImportErrorCsv()}
                                                >
                                                    {downloadingErrorCsv
                                                        ? "Downloading…"
                                                        : "Download all errors (CSV)"}
                                                </Button>
                                            ) : (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Full error CSV requires{" "}
                                                    <span className="font-mono">utility.bulk_upload_log.read</span>.
                                                </p>
                                            )
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onImportDialogOpenChange(false)}>
                            Close
                        </Button>
                        <PermissionGuard
                            anyOf={[
                                "utility.vendor_serviceable_pincode.create",
                                "utility.vendor_serviceable_pincode.update",
                            ]}
                        >
                            <Button
                                type="button"
                                disabled={!importFile || importMutation.isPending}
                                onClick={() => importFile && importMutation.mutate(importFile)}
                            >
                                {importMutation.isPending ? "Importing…" : "Upload & import"}
                            </Button>
                        </PermissionGuard>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the vendor pincode mapping
                            from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 font-semibold"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
