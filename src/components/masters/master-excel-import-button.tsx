"use client"

import { useRef, useState } from "react"
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { Download, FileUp } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/permission-guard"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { masterExcelImportService, type MasterExcelImportSummary } from "@/services/masters/master-excel-import-service"
import {
    bulkUploadLogService,
    canDownloadBulkUploadErrorsCsv,
} from "@/services/utilities/bulk-upload-log-service"

type MasterExcelImportButtonProps = {
    master: string
    label: string
    queryKey: QueryKey
}

export function MasterExcelImportButton({ master, label, queryKey }: MasterExcelImportButtonProps) {
    const queryClient = useQueryClient()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [summary, setSummary] = useState<MasterExcelImportSummary | null>(null)
    const [downloading, setDownloading] = useState(false)
    const [downloadingErrorCsv, setDownloadingErrorCsv] = useState(false)

    async function downloadErrorCsv() {
        if (!summary?.bulkUploadLogId || !canDownloadBulkUploadErrorsCsv(summary.failed)) return
        setDownloadingErrorCsv(true)
        try {
            const { blob, filename } = await bulkUploadLogService.downloadErrorRowsCsv(summary.bulkUploadLogId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Error details CSV downloaded")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to download error CSV")
        } finally {
            setDownloadingErrorCsv(false)
        }
    }

    async function downloadTemplate() {
        setDownloading(true)
        try {
            const { blob, filename } = await masterExcelImportService.downloadTemplate(master)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Template downloaded")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to download template")
        } finally {
            setDownloading(false)
        }
    }

    const importMutation = useMutation({
        mutationFn: (selectedFile: File) => masterExcelImportService.importFile(master, selectedFile),
        onSuccess: (result) => {
            setSummary(result)
            setFile(null)
            if (inputRef.current) inputRef.current.value = ""
            queryClient.invalidateQueries({ queryKey })
            if (result.failed > 0) {
                toast.warning(`Imported ${result.created} ${label}, ${result.failed} failed`)
            } else {
                toast.success(`Imported ${result.created} ${label}`)
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to import ${label}`)
        },
    })

    function onOpenChange(nextOpen: boolean) {
        setOpen(nextOpen)
        if (!nextOpen) {
            setFile(null)
            setSummary(null)
            if (inputRef.current) inputRef.current.value = ""
        }
    }

    function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0] ?? null
        if (!selectedFile) {
            setFile(null)
            return
        }
        const lower = selectedFile.name.toLowerCase()
        if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
            toast.error("Only .xlsx or .xls files are allowed")
            event.target.value = ""
            setFile(null)
            return
        }
        setFile(selectedFile)
        setSummary(null)
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                title="Import from Excel"
                onClick={() => setOpen(true)}
            >
                <FileUp className="h-4 w-4" />
            </Button>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Import {label}</DialogTitle>
                        <DialogDescription>
                            Download the Excel template, fill the rows, then upload it for bulk import.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-center gap-2"
                            disabled={downloading}
                            onClick={() => void downloadTemplate()}
                        >
                            <Download className="h-4 w-4" />
                            {downloading ? "Downloading..." : "Download Excel template"}
                        </Button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={onPickFile}
                        />
                        <Button type="button" variant="secondary" className="w-full" onClick={() => inputRef.current?.click()}>
                            {file ? `Selected: ${file.name}` : "Choose Excel file (.xlsx / .xls)"}
                        </Button>
                        {summary ? (
                            <div className="max-h-52 space-y-3 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-sm">
                                <p className="font-medium text-foreground">
                                    {summary.created} added · {summary.failed} failed
                                </p>
                                {summary.successes.length > 0 ? (
                                    <div>
                                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Successful rows</p>
                                        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                                            {summary.successes.slice(0, 40).map((success) => (
                                                <li key={`ok-${success.row}-${success.code}`}>Row {success.row}: {success.code}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                                {summary.failures.length > 0 ? (
                                    <div>
                                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Errors</p>
                                        <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                                            {summary.failures.slice(0, 50).map((failure) => (
                                                <li key={`${failure.row}-${failure.message}`}>Row {failure.row}: {failure.message}</li>
                                            ))}
                                        </ul>
                                        {canDownloadBulkUploadErrorsCsv(summary.failed) &&
                                        summary.bulkUploadLogId != null ? (
                                            <PermissionGuard permission="utility.bulk_upload_log.read">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-2 w-full"
                                                    disabled={downloadingErrorCsv}
                                                    onClick={() => void downloadErrorCsv()}
                                                >
                                                    {downloadingErrorCsv ? "Downloading…" : "Download all errors (CSV)"}
                                                </Button>
                                            </PermissionGuard>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        <Button
                            type="button"
                            disabled={!file || importMutation.isPending}
                            onClick={() => file && importMutation.mutate(file)}
                        >
                            {importMutation.isPending ? "Importing..." : "Upload & import"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
