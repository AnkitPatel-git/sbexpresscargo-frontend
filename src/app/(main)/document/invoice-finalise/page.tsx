"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoiceService } from "@/services/document/invoice-service";
import {
  InvoiceDetail,
  InvoiceLockAction,
  InvoiceRecord,
  InvoiceStatus,
} from "@/types/document/invoice";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusBadge(status?: InvoiceStatus) {
  if (status === "LOCKED") {
    return <Badge variant="success">Locked</Badge>;
  }
  return <Badge variant="warning">Draft</Badge>;
}

export default function InvoiceFinalisePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [logFromDate, setLogFromDate] = useState("");
  const [logToDate, setLogToDate] = useState("");
  const [logAction, setLogAction] = useState<"ALL" | InvoiceLockAction>("ALL");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["document-invoices-finalise", page, search, statusFilter],
    queryFn: () =>
      invoiceService.listInvoices({
        page,
        limit: 20,
        search,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  });

  const { data: selectedInvoice, isLoading: isDetailLoading } = useQuery({
    queryKey: ["invoice-detail", selectedId],
    queryFn: () => invoiceService.getInvoiceById(selectedId!),
    enabled: selectedId != null,
  });

  const {
    data: lockLog,
    refetch: refetchLockLog,
    isLoading: isLockLogLoading,
  } = useQuery({
    queryKey: ["invoice-lock-log", logFromDate, logToDate, logAction],
    queryFn: () =>
      invoiceService.getInvoiceLockLog({
        fromDate: logFromDate || undefined,
        toDate: logToDate || undefined,
        lockType: logAction === "ALL" ? undefined : logAction,
      }),
  });

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["document-invoices-finalise"] });
    queryClient.invalidateQueries({ queryKey: ["invoice-lock-log"] });
    if (selectedId != null) {
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", selectedId] });
    }
  };

  const lockMutation = useMutation({
    mutationFn: (id: number) => invoiceService.lockInvoice(id),
    onSuccess: (response) => {
      setSelectedId(response.data.id);
      invalidateLists();
      toast.success(`Invoice ${response.data.invoiceNo ?? response.data.id} locked`);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to lock invoice"),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => invoiceService.unlockInvoice(id),
    onSuccess: (response) => {
      setSelectedId(response.data.id);
      invalidateLists();
      toast.success(`Invoice ${response.data.invoiceNo ?? response.data.id} unlocked`);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to unlock invoice"),
  });

  const invoices = data?.data ?? [];
  const meta = data?.meta;
  const detail: InvoiceDetail | undefined = selectedInvoice?.data;
  const logEntries = lockLog?.data ?? [];
  const isMutating = lockMutation.isPending || unlockMutation.isPending;

  return (
    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Invoice Finalise</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lock invoices to finalise billing. Locked invoices cannot be repriced.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="w-64"
          placeholder="Search invoice no..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "ALL" | InvoiceStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="LOCKED">Locked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">ID</TableHead>
              <TableHead className="text-primary-foreground">Invoice No</TableHead>
              <TableHead className="text-primary-foreground">Date</TableHead>
              <TableHead className="text-primary-foreground">Customer</TableHead>
              <TableHead className="text-primary-foreground">Period</TableHead>
              <TableHead className="text-primary-foreground">AWBs</TableHead>
              <TableHead className="text-primary-foreground">Total</TableHead>
              <TableHead className="text-primary-foreground">Status</TableHead>
              <TableHead className="text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((item: InvoiceRecord) => {
                const isLocked = item.status === "LOCKED";
                const isSelected = selectedId === item.id;
                return (
                  <TableRow
                    key={item.id}
                    className={isSelected ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <TableCell>{item.id}</TableCell>
                    <TableCell className="font-medium">
                      {String(item.invoiceNo ?? "—")}
                    </TableCell>
                    <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                    <TableCell>{String(item.customerName ?? "—")}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {formatDate(item.fromDate)} – {formatDate(item.toDate)}
                    </TableCell>
                    <TableCell>{item.awbCount ?? "—"}</TableCell>
                    <TableCell>{formatMoney(item.grandTotal)}</TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell>
                      {isLocked ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                          onClick={(e) => {
                            e.stopPropagation();
                            unlockMutation.mutate(item.id);
                          }}
                        >
                          <Unlock className="mr-1 h-3.5 w-3.5" />
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isMutating}
                          onClick={(e) => {
                            e.stopPropagation();
                            lockMutation.mutate(item.id);
                          }}
                        >
                          <Lock className="mr-1 h-3.5 w-3.5" />
                          Lock
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </Button>
        <span className="text-sm">
          Page {meta?.page ?? page}
          {meta?.totalPages ? ` of ${meta.totalPages}` : ""}
          {meta?.total != null ? ` (${meta.total} invoices)` : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={meta?.totalPages != null && page >= meta.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {selectedId != null && (
        <div className="rounded-md border border-border bg-background p-4">
          <p className="mb-3 text-sm font-medium">Selected invoice</p>
          {isDetailLoading ? (
            <p className="text-sm text-muted-foreground">Loading details...</p>
          ) : detail ? (
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Invoice</p>
                <p className="font-medium">{detail.invoiceNo ?? detail.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{detail.customerName ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <div className="mt-0.5">{statusBadge(detail.status)}</div>
              </div>
              <div>
                <p className="text-muted-foreground">Grand total</p>
                <p className="font-medium">{formatMoney(detail.grandTotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Billing period</p>
                <p>
                  {formatDate(detail.fromDate)} – {formatDate(detail.toDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">AWB count</p>
                <p>{detail.awbCount ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax (IGST/CGST/SGST)</p>
                <p>
                  {formatMoney(detail.igst)} / {formatMoney(detail.cgst)} /{" "}
                  {formatMoney(detail.sgst)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Invoice not found.</p>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-md border border-border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Lock / unlock log</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetchLockLog()}>
            Refresh log
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            className="w-[160px]"
            value={logFromDate}
            onChange={(e) => setLogFromDate(e.target.value)}
          />
          <Input
            type="date"
            className="w-[160px]"
            value={logToDate}
            onChange={(e) => setLogToDate(e.target.value)}
          />
          <Select
            value={logAction}
            onValueChange={(value) => setLogAction(value as "ALL" | InvoiceLockAction)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              <SelectItem value="LOCK">Lock</SelectItem>
              <SelectItem value="UNLOCK">Unlock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Invoice No</TableHead>
                <TableHead>Invoice date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLockLogLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading log...
                  </TableCell>
                </TableRow>
              ) : logEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No lock/unlock activity found.
                  </TableCell>
                </TableRow>
              ) : (
                logEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      {entry.action === "LOCK" ? (
                        <Badge variant="success">Lock</Badge>
                      ) : (
                        <Badge variant="outline">Unlock</Badge>
                      )}
                    </TableCell>
                    <TableCell>{entry.invoiceId}</TableCell>
                    <TableCell>{entry.invoiceNo ?? "—"}</TableCell>
                    <TableCell>{formatDate(entry.invoiceDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
