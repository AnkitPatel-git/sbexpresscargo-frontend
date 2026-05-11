"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, FilePlus, Filter, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useIsClient } from "@/hooks/use-is-client";
import { receiptService } from "@/services/transactions/receipt-service";
import type { ReceiptListItem } from "@/types/transactions/receipt";

export default function ReceiptsPage() {
  const isClient = useIsClient();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftShipmentId, setDraftShipmentId] = useState("");
  const [draftReceiptNo, setDraftReceiptNo] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [appliedShipmentId, setAppliedShipmentId] = useState("");
  const [appliedReceiptNo, setAppliedReceiptNo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ReceiptListItem | null>(null);

  useEffect(() => {
    if (filtersOpen) {
      setDraftShipmentId(appliedShipmentId);
      setDraftReceiptNo(appliedReceiptNo);
      setDraftFrom(appliedFrom);
      setDraftTo(appliedTo);
    }
  }, [filtersOpen, appliedShipmentId, appliedReceiptNo, appliedFrom, appliedTo]);

  const shipmentIdNum =
    appliedShipmentId.trim() === "" ? undefined : Number(appliedShipmentId);
  const listParams = {
    page,
    limit,
    sortBy: "id" as const,
    sortOrder: "desc" as const,
    ...(Number.isFinite(shipmentIdNum) && shipmentIdNum! > 0 ? { shipmentId: shipmentIdNum } : {}),
    ...(appliedReceiptNo.trim() ? { receiptNo: appliedReceiptNo.trim() } : {}),
    ...(appliedFrom.trim() ? { fromDate: appliedFrom.trim() } : {}),
    ...(appliedTo.trim() ? { toDate: appliedTo.trim() } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transaction-receipts", listParams],
    queryFn: () => receiptService.listReceipts(listParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => receiptService.deleteReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-receipts"] });
      toast.success("Receipt deleted");
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Delete failed");
      setDeleteTarget(null);
    },
  });

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const applyFilters = () => {
    setAppliedShipmentId(draftShipmentId);
    setAppliedReceiptNo(draftReceiptNo);
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftShipmentId("");
    setDraftReceiptNo("");
    setDraftFrom("");
    setDraftTo("");
    setAppliedShipmentId("");
    setAppliedReceiptNo("");
    setAppliedFrom("");
    setAppliedTo("");
    setPage(1);
    setFiltersOpen(false);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-sm lg:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Receipts</h1>
          <p className="text-sm text-muted-foreground">
            Shipment receipts (one receipt per shipment) with line items. Filter by shipment id, receipt no, or date
            range on lines.
          </p>
        </div>
        <PermissionGuard permission="transaction.receipt.create">
          <Button type="button" asChild className="gap-2 self-start sm:self-auto">
            <Link href="/transactions/receipt/create">
              <FilePlus className="h-4 w-4" />
              New receipt
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
          {isClient ? (
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                  <Filter className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Receipt filters</DialogTitle>
                  <DialogDescription>
                    Filter the list by shipment, receipt number, or receipt line dates.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="flt-shipment">Shipment id</Label>
                    <Input
                      id="flt-shipment"
                      inputMode="numeric"
                      placeholder="Shipment primary key"
                      value={draftShipmentId}
                      onChange={(e) => setDraftShipmentId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="flt-receipt-no">Receipt no (contains)</Label>
                    <Input
                      id="flt-receipt-no"
                      placeholder="Search on line receipt no"
                      value={draftReceiptNo}
                      onChange={(e) => setDraftReceiptNo(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="flt-from">From date</Label>
                      <Input id="flt-from" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="flt-to">To date</Label>
                      <Input id="flt-to" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetFilters}>
                    Clear
                  </Button>
                  <Button type="button" onClick={applyFilters}>
                    Apply
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary opacity-60"
              disabled
              title="Filters (loading)"
              aria-label="Filters, loading"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            title="Refresh"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isError && (
        <p className="mb-4 text-sm text-destructive">{error instanceof Error ? error.message : "Failed to load"}</p>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">ID</TableHead>
              <TableHead className="font-semibold text-primary-foreground">AWB</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Shipment</TableHead>
              <TableHead className="text-right font-semibold text-primary-foreground">Amount</TableHead>
              <TableHead className="text-right font-semibold text-primary-foreground">Total RCP</TableHead>
              <TableHead className="text-right font-semibold text-primary-foreground">Balance</TableHead>
              <TableHead className="text-right font-semibold text-primary-foreground">Lines</TableHead>
              <TableHead className="text-right font-semibold text-primary-foreground">Line total</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No receipts found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.id}</TableCell>
                  <TableCell>{row.awbNo ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{row.shipmentId}</TableCell>
                  <TableCell className="text-right">{row.amount ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.totalRcp ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.balance ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.lineCount}</TableCell>
                  <TableCell className="text-right">{row.lineAmountTotal}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <PermissionGuard permission="transaction.receipt.update">
                        <Button type="button" variant="ghost" size="icon" title="Edit" asChild>
                          <Link href={`/transactions/receipt/${row.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="transaction.receipt.delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          title="Delete"
                          onClick={() => setDeleteTarget(row)}
                        >
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

      {total > 0 && (
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              Receipt #{deleteTarget?.id} for shipment {deleteTarget?.shipmentId}
              {deleteTarget?.awbNo ? ` (${deleteTarget.awbNo})` : ""} will be soft-deleted. This cannot be undone from
              the portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
