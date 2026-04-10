"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  FilePlus,
  FileUp,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { Badge } from "@/components/ui/badge";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useDebounce } from "@/hooks/use-debounce";
import { undeliveredScanService } from "@/services/transactions/undelivered-scan-service";
import { UndeliveredScan } from "@/types/transactions/undelivered-scan";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function SortArrows() {
  return (
    <span className="ml-1 inline-flex flex-col leading-none opacity-80">
      <ChevronUp className="h-2.5 w-2.5 -mb-1" />
      <ChevronDown className="h-2.5 w-2.5" />
    </span>
  );
}

export default function UndeliveredScanListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [colFilters, setColFilters] = useState({
    scanId: "",
    eventType: "",
    itemsCount: "",
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["undelivered-scans", page, limit, debouncedSearch],
    queryFn: () => undeliveredScanService.getUndeliveredScans(page, limit, debouncedSearch),
  });

  const deleteMutation = useMutation({
    mutationFn: undeliveredScanService.deleteUndeliveredScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["undelivered-scans"] });
      toast.success("Scan deleted successfully");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete scan");
      setDeleteId(null);
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => undeliveredScanService.exportUndeliveredScansCsv(debouncedSearch),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `undelivered-scans-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to export CSV");
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const filteredRows =
    data?.data.filter((scan) => {
      if (colFilters.scanId && !String(scan.id).includes(colFilters.scanId)) return false;
      if (colFilters.eventType && !(scan.eventType || "").toLowerCase().includes(colFilters.eventType.toLowerCase())) return false;
      if (colFilters.itemsCount && !String(scan.items?.length || 0).includes(colFilters.itemsCount)) return false;
      return true;
    }) ?? [];

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
          <PermissionGuard permission="transaction.undelivered-scan.create">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              title="Add"
              onClick={() => router.push("/transactions/undelivered-scan/create")}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Import">
            <FileUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            title="Refresh"
            onClick={() => queryClient.refetchQueries({ queryKey: ["undelivered-scans"], type: "active" })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            title="Export CSV"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            placeholder="Search scans..."
            className="h-9 w-44 bg-background sm:w-52"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <PermissionGuard permission="transaction.undelivered-scan.create">
            <Button type="button" className="h-9 rounded-md px-3" onClick={() => router.push("/transactions/undelivered-scan/create")}>
              <Plus className="mr-1 h-4 w-4" /> Add Undelivered Scan
            </Button>
          </PermissionGuard>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[760px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Scan ID <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Date / Time <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Event Type <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Items Count <SortArrows /></span></TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
            <TableRow className="border-b border-border bg-card hover:bg-card">
              <TableHead className="p-2">
                <Input
                  placeholder="Scan ID"
                  className="h-8 border-border bg-background text-xs"
                  value={colFilters.scanId}
                  onChange={(e) => setColFilters((f) => ({ ...f, scanId: e.target.value }))}
                />
              </TableHead>
              <TableHead className="p-2"><Input placeholder="Date / Time" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
              <TableHead className="p-2">
                <Input
                  placeholder="Event Type"
                  className="h-8 border-border bg-background text-xs"
                  value={colFilters.eventType}
                  onChange={(e) => setColFilters((f) => ({ ...f, eventType: e.target.value }))}
                />
              </TableHead>
              <TableHead className="p-2">
                <Input
                  placeholder="Items Count"
                  className="h-8 border-border bg-background text-xs"
                  value={colFilters.itemsCount}
                  onChange={(e) => setColFilters((f) => ({ ...f, itemsCount: e.target.value }))}
                />
              </TableHead>
              <TableHead className="p-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading scans...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                  {error instanceof Error ? error.message : "Failed to load scans"}
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No scans found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((scan: UndeliveredScan, index) => (
                <TableRow key={scan.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell className="font-medium text-foreground">#{scan.id}</TableCell>
                  <TableCell className="text-foreground">
                    {scan.scanAt ? format(new Date(scan.scanAt), "dd MMM yyyy, HH:mm") : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">{scan.eventType}</Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{scan.items?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <PermissionGuard permission="transaction.undelivered-scan.update">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                          onClick={() => router.push(`/transactions/undelivered-scan/${scan.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="transaction.undelivered-scan.delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                          onClick={() => setDeleteId(scan.id)}
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
        <p className="text-sm text-muted-foreground">Showing {from} to {to} of {total} entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</Button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => setPage((p) => Math.min(data?.totalPages || p, p + 1))}
            disabled={!data || page >= data.totalPages}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => setPage(data?.totalPages ?? 1)}
            disabled={!data || page >= data.totalPages}
          >
            »
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the scan record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
