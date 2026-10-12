"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { shipmentService } from "@/services/transactions/shipment-service";
import {
  customerMisReportService,
  type CustomerMisQuery,
} from "@/services/reports/customer-mis-report-service";

export default function CustomerMisPage() {
  const { effectiveCustomerIds } = useAuth();
  const [page, setPage] = useState(1);
  const [awbNo, setAwbNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [bookDateFrom, setBookDateFrom] = useState("");
  const [bookDateTo, setBookDateTo] = useState("");
  const [customerId, setCustomerId] = useState("all");

  const query = useMemo<CustomerMisQuery>(() => ({
    page,
    limit: 20,
    awbNo: awbNo.trim() || undefined,
    referenceNo: referenceNo.trim() || undefined,
    bookDateFrom: bookDateFrom || undefined,
    bookDateTo: bookDateTo || undefined,
    ...(customerId !== "all" ? { customerId: Number(customerId) } : {}),
  }), [page, awbNo, referenceNo, bookDateFrom, bookDateTo, customerId]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-mis", query],
    queryFn: () => customerMisReportService.getReport(query),
  });

  const exportMis = useMutation({
    mutationFn: () => customerMisReportService.exportXlsx({ ...query, page: 1, limit: 20 }),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (exportError: Error) => toast.error(exportError.message || "Failed to export MIS"),
  });

  const openStamp = useMutation({
    mutationFn: async (path: string) => {
      const match = path.match(/\/transaction\/shipment\/(\d+)\/pod-proof/);
      const shipmentId = Number(match?.[1]);
      if (!shipmentId) throw new Error("POD is not available");
      return shipmentService.downloadUploadedPodProof(shipmentId);
    },
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (stampError: Error) => toast.error(stampError.message || "Failed to open POD"),
  });

  const columns = data?.columns ?? [];
  const headers = data?.headers ?? {};
  const rows = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">MIS</h1>
          <p className="text-sm text-muted-foreground">Operational shipment report for your account.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => exportMis.mutate()} disabled={exportMis.isPending}>
          {exportMis.isPending ? "Exporting..." : "Export Excel"}
        </Button>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        <Input placeholder="SB AWB" value={awbNo} onChange={(event) => { setAwbNo(event.target.value); setPage(1); }} />
        <Input placeholder="Reference" value={referenceNo} onChange={(event) => { setReferenceNo(event.target.value); setPage(1); }} />
        <Input type="date" value={bookDateFrom} onChange={(event) => { setBookDateFrom(event.target.value); setPage(1); }} />
        <Input type="date" value={bookDateTo} onChange={(event) => { setBookDateTo(event.target.value); setPage(1); }} />
        {effectiveCustomerIds.length > 1 ? (
          <select
            className="h-9 rounded-md border bg-white px-2 text-sm"
            value={customerId}
            onChange={(event) => { setCustomerId(event.target.value); setPage(1); }}
          >
            <option value="all">All accounts</option>
            {effectiveCustomerIds.map((id) => (
              <option key={id} value={id}>Customer {id}</option>
            ))}
          </select>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load MIS"}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="whitespace-nowrap">
                    {headers[column] || column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1)} className="text-center text-muted-foreground">
                    No rows for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={`${row.awbNo ?? "row"}-${index}`}>
                    {columns.map((column) => {
                      const value = row[column];
                      if (column === "companyStamp" && typeof value === "string" && value) {
                        return (
                          <TableCell key={column}>
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() => openStamp.mutate(value)}
                            >
                              View POD
                            </button>
                          </TableCell>
                        );
                      }
                      return <TableCell key={column} className="whitespace-nowrap">{value ?? "—"}</TableCell>;
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
