"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { FileUp, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";
import { rateService } from "@/services/masters/rate-service";
import type { RateMaster } from "@/types/masters/rate";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useDebounce } from "@/hooks/use-debounce";

export default function RateMasterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [fromDate, setFromDate] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      fromDate,
      toDate,
      sortBy: "fromDate" as const,
      sortOrder: "desc" as const,
    }),
    [page, limit, debouncedSearch, fromDate, toDate],
  );

  const exportParams = useMemo(
    () => ({
      search: debouncedSearch,
      fromDate,
      toDate,
      sortBy: "fromDate" as const,
      sortOrder: "desc" as const,
    }),
    [debouncedSearch, fromDate, toDate],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["rate-masters", listParams],
    queryFn: () => rateService.getRateMasters(listParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rateService.deleteRateMaster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-masters"] });
      toast.success("Rate deleted successfully");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete rate");
      setDeleteId(null);
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => rateService.exportRateMasters(exportParams),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Rate masters exported");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Export failed");
    },
  });

  const total = data?.meta?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const rows = data?.data ?? [];

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              From
            </label>
            <Input
              type="date"
              className="h-9 w-[150px] bg-background"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              To
            </label>
            <Input
              type="date"
              className="h-9 w-[150px] bg-background"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Search
            </label>
            <Input
              placeholder="Search…"
              className="h-9 w-48 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
          <PermissionGuard permission="master.rate.read">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              title="Export CSV"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <FileUp className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            onClick={() => queryClient.refetchQueries({ queryKey: ["rate-masters"], type: "active" })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[900px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">ID</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Update type</TableHead>
              <TableHead className="font-semibold text-primary-foreground">From</TableHead>
              <TableHead className="font-semibold text-primary-foreground">To</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Customer</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Flat rate</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading rates…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No rate masters found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row: RateMaster, index: number) => (
                <TableRow
                  key={row.id}
                  className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                >
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.updateType}</TableCell>
                  <TableCell>{row.fromDate?.slice(0, 10)}</TableCell>
                  <TableCell>{row.toDate?.slice(0, 10)}</TableCell>
                  <TableCell>
                    {row.customer?.customerName ?? row.customer?.customerCode ?? row.customerId}
                  </TableCell>
                  <TableCell>{row.flatRate != null ? String(row.flatRate) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <PermissionGuard permission="master.rate.delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                          onClick={() => setDeleteId(row.id)}
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
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
            disabled={!data || page >= (data.meta?.totalPages || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 px-2"
            disabled={!data || page >= (data.meta?.totalPages || 1)}
            onClick={() => setPage(data?.meta?.totalPages ?? 1)}
          >
            »
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the rate master record. Shipments already linked are unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
