"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, FileDown, Loader2, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const POD_PROOF_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf";

function mergePodRows(current: PodRow[] | null, incoming: PodRow[]): PodRow[] {
    if (!current?.length) return incoming;
    const byAwb = new Map(incoming.map((r) => [r.AWBNo, r]));
    const merged = current.map((r) => byAwb.get(r.AWBNo) ?? r);
    for (const r of incoming) {
        if (!merged.some((m) => m.AWBNo === r.AWBNo)) merged.push(r);
    }
    return merged;
}

export default function PodPage() {
    const [awbInput, setAwbInput] = useState("");
    const [podData, setPodData] = useState<PodRow[] | null>(null);
    const bulkPodProofInputRef = useRef<HTMLInputElement>(null);
    const rowPodProofInputRef = useRef<HTMLInputElement>(null);
    const [pendingUploadAwb, setPendingUploadAwb] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [colFilters, setColFilters] = useState({
        awbNo: "",
        receiver: "",
        remark: "",
        status: "",
    });

    const refreshPodRows = async (awbNos: string[]) => {
        if (awbNos.length === 0) return;
        const res = await podService.viewPod(awbNos);
        setPodData((prev) => mergePodRows(prev, res.data.podRows));
    };

    const viewMutation = useMutation({
        mutationFn: async (awbNos: string[]) => podService.viewPod(awbNos),
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
            .map((awb) => awb.trim())
            .filter((awb) => awb.length > 0);

        if (awbList.length === 0) {
            toast.error("Please enter at least one AWB number");
            return;
        }

        viewMutation.mutate(awbList);
    };

    const bulkPodProofMutation = useMutation({
        mutationFn: (files: File[]) => podService.bulkUploadProofs(files),
        onSuccess: async (res) => {
            const { uploaded, failed, podRows } = res.data;
            if (podRows?.length) {
                setPodData((prev) => mergePodRows(prev, podRows));
            } else if (uploaded.length) {
                await refreshPodRows(uploaded.map((u) => u.awbNo));
            }
            if (uploaded.length) {
                toast.success(`Uploaded ${uploaded.length} POD file(s)`);
            }
            if (failed.length) {
                toast.error(
                    failed.length === 1
                        ? `${failed[0].filename}: ${failed[0].reason}`
                        : `${failed.length} file(s) failed (check filenames match AWB)`,
                );
            }
            if (bulkPodProofInputRef.current) bulkPodProofInputRef.current.value = "";
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to upload POD files");
            if (bulkPodProofInputRef.current) bulkPodProofInputRef.current.value = "";
        },
    });

    const rowPodProofMutation = useMutation({
        mutationFn: ({ awbNo, file }: { awbNo: string; file: File }) =>
            podService.uploadProofByAwb(awbNo, file),
        onSuccess: async (_res, { awbNo }) => {
            toast.success(`POD uploaded for ${awbNo}`);
            await refreshPodRows([awbNo]);
            if (rowPodProofInputRef.current) rowPodProofInputRef.current.value = "";
            setPendingUploadAwb(null);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to upload POD");
            if (rowPodProofInputRef.current) rowPodProofInputRef.current.value = "";
            setPendingUploadAwb(null);
        },
    });

    const bulkBlankZipMutation = useMutation({
        mutationFn: () => {
            if (!podData || podData.length === 0) {
                return Promise.reject(new Error("Load AWBs first using Search"));
            }
            const awbs = [...new Set(podData.map((r) => r.AWBNo).filter(Boolean))];
            return podService.downloadBulkBlankZip(awbs);
        },
        onSuccess: ({ blob, filename }) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Blank POD forms (ZIP) downloaded");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to download ZIP");
        },
    });

    const blankPdfMutation = useMutation({
        mutationFn: ({ awbNo }: { awbNo: string }) => podService.downloadBlankPdf(awbNo, false),
        onSuccess: ({ blob, filename }) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("POD form downloaded");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to download POD form");
        },
    });

    const filteredRows =
        podData?.filter((row) => {
            if (colFilters.awbNo && !(row.AWBNo || "").toLowerCase().includes(colFilters.awbNo.toLowerCase()))
                return false;
            if (colFilters.receiver && !(row.Recivername || "").toLowerCase().includes(colFilters.receiver.toLowerCase()))
                return false;
            if (colFilters.remark && !(row.Remark || "").toLowerCase().includes(colFilters.remark.toLowerCase()))
                return false;
            if (colFilters.status && !(row.MSG || "pending").toLowerCase().includes(colFilters.status.toLowerCase()))
                return false;
            return true;
        }) ?? [];
    const total = filteredRows.length;
    const start = (page - 1) * limit;
    const paginatedRows = filteredRows.slice(start, start + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const from = total === 0 ? 0 : start + 1;
    const to = Math.min(start + limit, total);

    const handleBulkPodProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? [...e.target.files] : [];
        if (files.length === 0) return;
        bulkPodProofMutation.mutate(files);
    };

    const handleRowPodProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingUploadAwb) return;
        rowPodProofMutation.mutate({ awbNo: pendingUploadAwb, file });
    };

    const triggerRowUpload = (awbNo: string) => {
        setPendingUploadAwb(awbNo);
        rowPodProofInputRef.current?.click();
    };

    const allAwbs = podData ? [...new Set(podData.map((r) => r.AWBNo).filter(Boolean))] : [];

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-3">
                <h1 className="text-lg font-semibold text-foreground">POD</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Search AWBs to load the list, download blank POD forms, and upload signed POD scans. Name each file
                    after the AWB (e.g. <span className="font-mono text-xs">AWB123456.pdf</span>) so bulk upload can match
                    shipments automatically.
                </p>
            </div>

            <input
                ref={rowPodProofInputRef}
                type="file"
                className="hidden"
                accept={POD_PROOF_ACCEPT}
                onChange={handleRowPodProofUpload}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bulk upload</span>
                    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                        <PermissionGuard permission="transaction.pod.upload">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                title="Upload POD files — filename = AWB (up to 50)"
                                onClick={() => bulkPodProofInputRef.current?.click()}
                                disabled={bulkPodProofMutation.isPending}
                            >
                                {bulkPodProofMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                            </Button>
                        </PermissionGuard>
                        <input
                            type="file"
                            ref={bulkPodProofInputRef}
                            className="hidden"
                            accept={POD_PROOF_ACCEPT}
                            multiple
                            onChange={handleBulkPodProofUpload}
                        />
                    </div>
                </div>

                <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-2xl">
                    <Label htmlFor="pod-awb-search" className="text-sm text-muted-foreground">
                        Search AWBs
                    </Label>
                    <Textarea
                        id="pod-awb-search"
                        rows={6}
                        placeholder="Enter AWB numbers — one per line, or separated by commas"
                        className="min-h-[9rem] w-full resize-y bg-background text-sm"
                        value={awbInput}
                        onChange={(e) => setAwbInput(e.target.value)}
                    />
                    <PermissionGuard permission="transaction.pod.read">
                        <Button
                            type="button"
                            className="h-9 w-fit rounded-md px-3"
                            onClick={handleSearch}
                            disabled={viewMutation.isPending}
                        >
                            {viewMutation.isPending ? (
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="mr-1 h-4 w-4" />
                            )}
                            <Plus className="mr-1 h-4 w-4" /> Load POD
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {podData && (
                <>
                    <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
                        <PermissionGuard permission="transaction.pod.download">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => bulkBlankZipMutation.mutate()}
                                disabled={bulkBlankZipMutation.isPending || allAwbs.length === 0}
                            >
                                {bulkBlankZipMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <FileDown className="mr-2 h-4 w-4" />
                                )}
                                Download blank PODs (ZIP)
                            </Button>
                        </PermissionGuard>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-border">
                        <Table className="min-w-[1080px] border-0">
                            <TableHeader>
                                <TableRow className="border-0 bg-primary hover:bg-primary">
                                    <TableHead className="h-11 font-semibold text-primary-foreground">
                                        AWB No
                                    </TableHead>
                                    <TableHead className="font-semibold text-primary-foreground">
                                        Delivery Date/Time
                                    </TableHead>
                                    <TableHead className="font-semibold text-primary-foreground">
                                        Receiver
                                    </TableHead>
                                    <TableHead className="font-semibold text-primary-foreground">
                                        Remark
                                    </TableHead>
                                    <TableHead className="font-semibold text-primary-foreground">
                                        Comment
                                    </TableHead>
                                    <TableHead className="font-semibold text-primary-foreground">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-primary-foreground">
                                        Upload POD
                                    </TableHead>
                                    <TableHead className="text-center font-semibold text-primary-foreground">
                                        Blank POD
                                    </TableHead>
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
                                    <TableHead className="p-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-full justify-start px-2 text-xs text-muted-foreground hover:bg-transparent"
                                        >
                                            Filter Row
                                        </Button>
                                    </TableHead>
                                    <TableHead className="p-2">
                                        <Textarea
                                            placeholder="Receiver"
                                            className="h-8 min-h-0 resize-none border-border bg-background py-2 text-xs"
                                            value={colFilters.receiver}
                                            onChange={(e) => setColFilters((f) => ({ ...f, receiver: e.target.value }))}
                                        />
                                    </TableHead>
                                    <TableHead className="p-2">
                                        <Textarea
                                            placeholder="Remark"
                                            className="h-8 min-h-0 resize-none border-border bg-background py-2 text-xs"
                                            value={colFilters.remark}
                                            onChange={(e) => setColFilters((f) => ({ ...f, remark: e.target.value }))}
                                        />
                                    </TableHead>
                                    <TableHead className="p-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-full justify-start px-2 text-xs text-muted-foreground hover:bg-transparent"
                                        >
                                            -
                                        </Button>
                                    </TableHead>
                                    <TableHead className="p-2">
                                        <Textarea
                                            placeholder="Status"
                                            className="h-8 min-h-0 resize-none border-border bg-background py-2 text-xs"
                                            value={colFilters.status}
                                            onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))}
                                        />
                                    </TableHead>
                                    <TableHead className="p-2" />
                                    <TableHead className="p-2" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRows.map((row, idx) => {
                                    const rowUploading =
                                        rowPodProofMutation.isPending && pendingUploadAwb === row.AWBNo;
                                    const rowBlankDownloading =
                                        blankPdfMutation.isPending &&
                                        blankPdfMutation.variables?.awbNo === row.AWBNo;
                                    return (
                                        <TableRow
                                            key={`${row.AWBNo}-${idx}`}
                                            className={cn("border-border", idx % 2 === 1 ? "bg-muted/40" : "bg-card")}
                                        >
                                            <TableCell className="font-medium text-primary">
                                                <div className="flex flex-col gap-0.5">
                                                    <span>{row.AWBNo}</span>
                                                    {row.hasPodProof ? (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-emerald-700">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            POD on file
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {row.DelvDate ? `${row.DelvDate} ${row.DelvTime}` : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{row.Recivername || "-"}</span>
                                                    {row.ReciverTelNo ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            {row.ReciverTelNo}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={row.Remark}>
                                                {row.Remark || "-"}
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={row.Comment}>
                                                {row.Comment || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {row.MSG ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-blue-200 bg-blue-50 text-blue-700"
                                                    >
                                                        {row.MSG}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs italic text-muted-foreground">Pending</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <PermissionGuard permission="transaction.pod.upload">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1 text-xs"
                                                            title={`Upload POD for ${row.AWBNo}`}
                                                            onClick={() => triggerRowUpload(row.AWBNo)}
                                                            disabled={rowUploading || !row.shipmentId}
                                                        >
                                                            {rowUploading ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Upload className="h-3.5 w-3.5" />
                                                            )}
                                                            Upload
                                                        </Button>
                                                    </PermissionGuard>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center">
                                                    <PermissionGuard permission="transaction.pod.download">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 gap-1 text-xs"
                                                            title={`Download blank POD for ${row.AWBNo}`}
                                                            onClick={() => blankPdfMutation.mutate({ awbNo: row.AWBNo })}
                                                            disabled={rowBlankDownloading || !row.shipmentId}
                                                        >
                                                            {rowBlankDownloading ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <FileDown className="h-3.5 w-3.5" />
                                                            )}
                                                            Download
                                                        </Button>
                                                    </PermissionGuard>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {total === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                            No tracking information found for the entered AWBs.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                        <p className="text-sm text-muted-foreground">
                            Showing {from} to {to} of {total} entries
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 min-w-8 px-2"
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                            >
                                «
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 min-w-8 px-2"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ‹
                            </Button>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                {page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 min-w-8 px-2"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            >
                                ›
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 min-w-8 px-2"
                                disabled={page >= totalPages}
                                onClick={() => setPage(totalPages)}
                            >
                                »
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
