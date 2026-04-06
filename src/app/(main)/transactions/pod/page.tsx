"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Download, FilePlus, FileSpreadsheet, Loader2, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { podService } from "@/services/transactions/pod-service";
import { PodRow } from "@/types/transactions/pod";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    );
}

export default function PodPage() {
    const [awbInput, setAwbInput] = useState("");
    const [podData, setPodData] = useState<PodRow[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [colFilters, setColFilters] = useState({
        awbNo: "",
        receiver: "",
        remark: "",
        status: "",
    });

    const viewMutation = useMutation({
        mutationFn: async (awbNos: string[]) => {
            return podService.viewPod(awbNos);
        },
        onSuccess: (data) => {
            setPodData(data.data.podRows);
            setPage(1);
            if (data.data.podRows.length === 0) {
                toast.info("No records found for the given AWBs.");
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to fetch POD data");
        },
    });

    const handleSearch = () => {
        const awbList = awbInput
            .split(/[\n,]+/)
            .map(awb => awb.trim())
            .filter(awb => awb.length > 0);

        if (awbList.length === 0) {
            toast.error("Please enter at least one AWB number");
            return;
        }

        viewMutation.mutate(awbList);
    };

    const downloadMutation = useMutation({
        mutationFn: () => podService.downloadTemplate(),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'POD_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success("Template downloaded successfully");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to download template");
        }
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => podService.uploadExcel(file),
        onSuccess: () => {
            toast.success("Excel uploaded successfully");
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to upload Excel");
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    });

    const exportMutation = useMutation({
        mutationFn: (awbNos: string[]) => podService.exportExcel(awbNos),
        onSuccess: (blob, awbNos) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().getTime();
            link.setAttribute('download', `POD_Export_${timestamp}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success(`Exported ${awbNos.length} records`);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to export data");
        }
    });

    const handleExport = () => {
        if (!podData || podData.length === 0) return;
        const awbNos = podData.map(row => row.AWBNo);
        exportMutation.mutate(awbNos);
    };

    const filteredRows =
        podData?.filter((row) => {
            if (colFilters.awbNo && !(row.AWBNo || "").toLowerCase().includes(colFilters.awbNo.toLowerCase())) return false;
            if (colFilters.receiver && !(row.Recivername || "").toLowerCase().includes(colFilters.receiver.toLowerCase())) return false;
            if (colFilters.remark && !(row.Remark || "").toLowerCase().includes(colFilters.remark.toLowerCase())) return false;
            if (colFilters.status && !(row.MSG || "pending").toLowerCase().includes(colFilters.status.toLowerCase())) return false;
            return true;
        }) ?? [];
    const total = filteredRows.length;
    const start = (page - 1) * limit;
    const paginatedRows = filteredRows.slice(start, start + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : start + 1;
    const to = Math.min(start + limit, total);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add">
                        <FilePlus className="h-4 w-4" />
                    </Button>
                    <PermissionGuard permission="transaction.pod.create">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Download Template"
                            onClick={() => downloadMutation.mutate()}
                            disabled={downloadMutation.isPending}
                        >
                            {downloadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="transaction.pod.create">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Upload Excel"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                    </PermissionGuard>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Textarea
                        placeholder="AWB123456, AWB789012"
                        className="h-9 min-h-0 w-72 resize-none bg-background py-2 text-sm"
                        value={awbInput}
                        onChange={(e) => setAwbInput(e.target.value)}
                    />
                    <PermissionGuard permission="transaction.pod.read">
                        <Button type="button" className="h-9 rounded-md px-3" onClick={handleSearch} disabled={viewMutation.isPending}>
                            {viewMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
                            <Plus className="mr-1 h-4 w-4" /> Add POD
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {podData && (
                <>
                    <div className="mb-3 flex items-center justify-end">
                        <PermissionGuard permission="transaction.pod.read">
                            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportMutation.isPending || podData.length === 0}>
                                {exportMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                )}
                                Export to Excel
                            </Button>
                        </PermissionGuard>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-border">
                        <Table className="min-w-[1080px] border-0">
                            <TableHeader>
                                <TableRow className="border-0 bg-primary hover:bg-primary">
                                    <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">AWB No <SortArrows /></span></TableHead>
                                    <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Delivery Date/Time <SortArrows /></span></TableHead>
                                    <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Receiver <SortArrows /></span></TableHead>
                                    <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Remark <SortArrows /></span></TableHead>
                                    <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Comment <SortArrows /></span></TableHead>
                                    <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Status <SortArrows /></span></TableHead>
                                    <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                                </TableRow>
                                <TableRow className="border-b border-border bg-card hover:bg-card">
                                    <TableHead className="p-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-full justify-start px-2 text-xs text-muted-foreground hover:bg-transparent"
                                            onClick={() => setPage(1)}
                                        >
                                            Found {podData.length} records
                                        </Button>
                                    </TableHead>
                                    <TableHead className="p-2"><Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2 text-xs text-muted-foreground hover:bg-transparent">Filter Row</Button></TableHead>
                                    <TableHead className="p-2"><Textarea placeholder="Receiver" className="h-8 min-h-0 resize-none border-border bg-background py-2 text-xs" value={colFilters.receiver} onChange={(e) => setColFilters((f) => ({ ...f, receiver: e.target.value }))} /></TableHead>
                                    <TableHead className="p-2"><Textarea placeholder="Remark" className="h-8 min-h-0 resize-none border-border bg-background py-2 text-xs" value={colFilters.remark} onChange={(e) => setColFilters((f) => ({ ...f, remark: e.target.value }))} /></TableHead>
                                    <TableHead className="p-2"><Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2 text-xs text-muted-foreground hover:bg-transparent">-</Button></TableHead>
                                    <TableHead className="p-2"><Textarea placeholder="Status" className="h-8 min-h-0 resize-none border-border bg-background py-2 text-xs" value={colFilters.status} onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))} /></TableHead>
                                    <TableHead className="p-2" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRows.map((row, idx) => (
                                    <TableRow key={`${row.AWBNo}-${idx}`} className={cn("border-border", idx % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                        <TableCell className="font-medium text-primary">{row.AWBNo}</TableCell>
                                        <TableCell>{row.DelvDate ? `${row.DelvDate} ${row.DelvTime}` : "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{row.Recivername || "-"}</span>
                                                {row.ReciverTelNo && <span className="text-xs text-muted-foreground">{row.ReciverTelNo}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate" title={row.Remark}>{row.Remark || "-"}</TableCell>
                                        <TableCell className="max-w-[150px] truncate" title={row.Comment}>{row.Comment || "-"}</TableCell>
                                        <TableCell>
                                            {row.MSG ? (
                                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{row.MSG}</Badge>
                                            ) : (
                                                <span className="text-xs italic text-muted-foreground">Pending</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary hover:bg-primary/10"
                                                    onClick={() => exportMutation.mutate([row.AWBNo])}
                                                    disabled={exportMutation.isPending}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {total === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No tracking information found for the entered AWBs.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                        <p className="text-sm text-muted-foreground">Showing {from} to {to} of {total} entries</p>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
                            <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</Button>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                            <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</Button>
                            <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
