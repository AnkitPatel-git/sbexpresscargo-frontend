"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceService } from "@/services/document/invoice-service";
import {
  INVOICE_PDF_FORMAT_OPTIONS,
  InvoicePdfFormat,
  InvoiceRecord,
} from "@/types/document/invoice";

export default function InvoicePrintPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [invoiceIds, setInvoiceIds] = useState("");
  const [printData, setPrintData] = useState<unknown>(null);
  const [invoiceFormat, setInvoiceFormat] = useState<InvoicePdfFormat>("CUSTOMER_1");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["document-invoices", page, search],
    queryFn: () => invoiceService.listInvoices({ page, limit: 20, search }),
  });

  const printMutation = useMutation({
    mutationFn: (ids: string) => invoiceService.getPrintData(ids),
    onSuccess: (response) => {
      setPrintData(response.data);
      toast.success("Invoice print data loaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to fetch print data"),
  });

  const downloadPdfMutation = useMutation({
    mutationFn: (id: number) => invoiceService.downloadInvoicePdf(id, invoiceFormat),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to download invoice PDF"),
  });

  const downloadSelectedMutation = useMutation({
    mutationFn: async (idsRaw: string) => {
      const ids = idsRaw
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1);
      if (ids.length === 0) {
        throw new Error("Enter at least one valid invoice ID");
      }
      const results: Array<{ blob: Blob; filename: string }> = [];
      for (const id of ids) {
        results.push(await invoiceService.downloadInvoicePdf(id, invoiceFormat));
      }
      return results;
    },
    onSuccess: (files) => {
      for (const { blob, filename } of files) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(
        files.length === 1
          ? "Invoice PDF downloaded"
          : `${files.length} invoice PDFs downloaded`,
      );
    },
    onError: (error: Error) => toast.error(error.message || "Failed to download invoice PDF"),
  });

  return (
    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Invoice Print</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">Invoice format</label>
          <Select
            value={invoiceFormat}
            onValueChange={(value) => setInvoiceFormat(value as InvoicePdfFormat)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_PDF_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="w-64"
          placeholder="Search invoices"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Refresh List
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">ID</TableHead>
              <TableHead className="text-primary-foreground">Invoice No</TableHead>
              <TableHead className="text-primary-foreground">Customer</TableHead>
              <TableHead className="text-primary-foreground">Status</TableHead>
              <TableHead className="text-primary-foreground">Total</TableHead>
              <TableHead className="text-primary-foreground">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              (data?.data ?? []).map((item: InvoiceRecord) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{String(item.invoiceNo ?? "-")}</TableCell>
                  <TableCell>{String(item.customerName ?? "-")}</TableCell>
                  <TableCell>{String(item.status ?? "-")}</TableCell>
                  <TableCell>{item.grandTotal ?? "-"}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={downloadPdfMutation.isPending}
                      onClick={() => downloadPdfMutation.mutate(item.id)}
                    >
                      <FileDown className="mr-1 h-3.5 w-3.5" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </Button>
        <span className="text-sm">Page {page}</span>
        <Button type="button" variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-border bg-background p-3">
        <p className="text-sm font-medium">Download / Print by Invoice IDs</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Invoice IDs (comma separated) e.g. 1,2,3"
            value={invoiceIds}
            onChange={(e) => setInvoiceIds(e.target.value)}
            className="min-w-[280px] flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => printMutation.mutate(invoiceIds)}
            disabled={!invoiceIds.trim() || printMutation.isPending}
          >
            Fetch Print Data
          </Button>
          <Button
            type="button"
            onClick={() => downloadSelectedMutation.mutate(invoiceIds)}
            disabled={!invoiceIds.trim() || downloadSelectedMutation.isPending}
          >
            <FileDown className="mr-1 h-4 w-4" />
            Download PDF
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses the selected invoice format above. Each ID downloads as a separate PDF.
        </p>
        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
          {JSON.stringify(printData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
