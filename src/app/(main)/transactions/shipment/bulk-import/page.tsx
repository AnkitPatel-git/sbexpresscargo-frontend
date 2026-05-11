"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/permission-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shipmentService } from "@/services/transactions/shipment-service";
import {
  bulkUploadLogService,
  canDownloadBulkUploadErrorsCsv,
} from "@/services/utilities/bulk-upload-log-service";

export default function ShipmentBulkImportPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingErrorCsv, setDownloadingErrorCsv] = useState(false);
  const [summary, setSummary] = useState<{
    created: number;
    failed: number;
    failures: Array<{ row: number; message: string }>;
    successes: Array<{ row: number; awbNo: string }>;
    bulkUploadLogId?: number;
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: (f: File) => shipmentService.bulkImportFromExcel(f),
    onSuccess: (data) => {
      setSummary(data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      if (data.failed > 0) {
        toast.warning(`Created ${data.created} shipment(s), ${data.failed} row(s) failed`);
      } else {
        toast.success(`Created ${data.created} shipment(s)`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk import failed");
    },
  });

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const { blob, filename } = await shipmentService.downloadBulkImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleDownloadErrorCsv() {
    if (!summary?.bulkUploadLogId || !canDownloadBulkUploadErrorsCsv(summary.failed)) return;
    setDownloadingErrorCsv(true);
    try {
      const { blob, filename } = await bulkUploadLogService.downloadErrorRowsCsv(summary.bulkUploadLogId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Error details CSV downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download error CSV");
    } finally {
      setDownloadingErrorCsv(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/transactions/shipment" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-lg font-semibold tracking-tight">Shipment bulk import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an Excel workbook with a <span className="font-mono">Shipments</span> sheet (or the first sheet if
          unnamed). Each row creates one booking using <strong>customer</strong> and <strong>shipper</strong> master
          codes, <strong>product</strong> and <strong>zone</strong> codes, and <strong>service center</strong> code.{" "}
          <strong>Consignee</strong> columns match or create a consignee like manual booking.{" "}
          <strong>Content</strong> is matched by <span className="font-mono">contentName</span> (trimmed, case-insensitive;
          optional <span className="font-mono">contentCode</span> still works). For several cartons with different sizes or
          contents, add a <span className="font-mono">Pieces</span> sheet: each line sets{" "}
          <span className="font-mono">shipmentRow</span> to the Excel row number on <span className="font-mono">Shipments</span>{" "}
          (row <span className="font-mono">2</span> is the first data row). Omit piece columns on{" "}
          <span className="font-mono">Shipments</span> for those bookings and put dimensions and{" "}
          <span className="font-mono">contentName</span> on <span className="font-mono">Pieces</span> instead; leave
          shipment-level weights blank on <span className="font-mono">Shipments</span> to derive totals from piece rows
          where possible.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PermissionGuard permission="transaction.shipment.read">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={downloadingTemplate}
              onClick={() => void handleDownloadTemplate()}
            >
              {downloadingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Excel template
            </Button>
          </PermissionGuard>

          <PermissionGuard permission="transaction.shipment.create">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFile(f ?? null);
                  setSummary(null);
                }}
              />
              <Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <FileSpreadsheet className="h-4 w-4" />
                {file ? file.name : "Choose Excel file"}
              </Button>
              <Button
                type="button"
                disabled={!file || importMutation.isPending}
                className="gap-2"
                onClick={() => file && importMutation.mutate(file)}
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import
              </Button>
            </div>
          </PermissionGuard>
        </div>
      </div>

      {summary && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">
            Created: {summary.created} · Failed: {summary.failed}
          </p>
          {summary.successes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Successful rows</p>
              <div className="overflow-x-auto rounded-md border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Excel row</TableHead>
                      <TableHead>AWB</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.successes.map((s) => (
                      <TableRow key={`${s.row}-${s.awbNo}`}>
                        <TableCell>{s.row}</TableCell>
                        <TableCell className="font-mono">{s.awbNo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {summary.failures.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-destructive">Failed rows</p>
              <div className="max-h-60 overflow-y-auto rounded-md border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Row</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.failures.map((f) => (
                      <TableRow key={f.row}>
                        <TableCell>{f.row}</TableCell>
                        <TableCell className="text-sm">{f.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {canDownloadBulkUploadErrorsCsv(summary.failed) && summary.bulkUploadLogId != null && (
                <PermissionGuard permission="utility.bulk_upload_log.read">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    disabled={downloadingErrorCsv}
                    onClick={() => void handleDownloadErrorCsv()}
                  >
                    {downloadingErrorCsv ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download error CSV
                  </Button>
                </PermissionGuard>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
