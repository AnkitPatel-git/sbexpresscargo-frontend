"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceService } from "@/services/document/invoice-service";
import { InvoiceRecord } from "@/types/document/invoice";

export default function InvoicePrintPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [invoiceIds, setInvoiceIds] = useState("");
  const [printData, setPrintData] = useState<unknown>(null);

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

  return (
    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <h1 className="text-xl font-semibold">Invoice Print</h1>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : (data?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
        <p className="text-sm font-medium">Print Data by Invoice IDs</p>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Invoice IDs (comma separated) e.g. 1,2,3"
            value={invoiceIds}
            onChange={(e) => setInvoiceIds(e.target.value)}
            className="min-w-[280px] flex-1"
          />
          <Button type="button" onClick={() => printMutation.mutate(invoiceIds)} disabled={!invoiceIds.trim()}>
            Fetch Print Data
          </Button>
        </div>
        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
          {JSON.stringify(printData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
