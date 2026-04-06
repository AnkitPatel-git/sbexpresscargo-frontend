"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Edit, Plus, Trash, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useDebounce } from "@/hooks/use-debounce";
import { drsService } from "@/services/transactions/drs-service";
import { Drs } from "@/types/transactions/drs";

export default function DrsListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [colFilters, setColFilters] = useState({ drsNo: "", serviceCenter: "", status: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["drs", page, limit, debouncedSearch],
    queryFn: () => drsService.getDrs(page, limit, debouncedSearch),
  });

  const deleteMutation = useMutation({
    mutationFn: drsService.deleteDrs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drs"] });
      toast.success("DRS deleted successfully");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete DRS");
      setDeleteId(null);
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
  const filteredRows = data?.data.filter((drs) => {
    if (colFilters.drsNo && !(drs.drsNo || "").toLowerCase().includes(colFilters.drsNo.toLowerCase())) return false;
    if (colFilters.serviceCenter && !(drs.serviceCenter || "").toLowerCase().includes(colFilters.serviceCenter.toLowerCase())) return false;
    if (colFilters.status && !(drs.status || "").toLowerCase().includes(colFilters.status.toLowerCase())) return false;
    return true;
  }) ?? [];

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
          <PermissionGuard permission="transaction.drs.create"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => router.push("/transactions/drs/create")}><FilePlus className="h-4 w-4" /></Button></PermissionGuard>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary"><FileUp className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["drs"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input placeholder="Search DRS..." className="h-9 w-44 bg-background sm:w-52" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <PermissionGuard permission="transaction.drs.create"><Button type="button" className="h-9 rounded-md px-3" onClick={() => router.push("/transactions/drs/create")}><Plus className="mr-1 h-4 w-4" />Add DRS</Button></PermissionGuard>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
          <Table className="min-w-[820px] border-0">
            <TableHeader>
              <TableRow className="border-0 bg-primary hover:bg-primary">
                <TableHead className="h-11 font-semibold text-primary-foreground">DRS No <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                <TableHead className="font-semibold text-primary-foreground">Date <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                <TableHead className="font-semibold text-primary-foreground">Service Center <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                <TableHead className="font-semibold text-primary-foreground">Status <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="p-2"><Input placeholder="DRS No" className="h-8 border-border bg-background text-xs" value={colFilters.drsNo} onChange={(e) => setColFilters((f) => ({ ...f, drsNo: e.target.value }))} /></TableHead>
                <TableHead className="p-2"><Input placeholder="Date" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                <TableHead className="p-2"><Input placeholder="Service Center" className="h-8 border-border bg-background text-xs" value={colFilters.serviceCenter} onChange={(e) => setColFilters((f) => ({ ...f, serviceCenter: e.target.value }))} /></TableHead>
                <TableHead className="p-2"><Input placeholder="Status" className="h-8 border-border bg-background text-xs" value={colFilters.status} onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))} /></TableHead>
                <TableHead className="p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Loading DRS...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-red-500">
                    {error instanceof Error ? error.message : "Failed to load DRS"}
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No DRS found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((drs: Drs, index) => (
                  <TableRow key={drs.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                    <TableCell className="font-medium">{drs.drsNo}</TableCell>
                    <TableCell>
                      {drs.drsDate ? format(new Date(drs.drsDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell>{drs.serviceCenter || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        {drs.status || "CREATED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <PermissionGuard permission="transaction.drs.update"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => router.push(`/transactions/drs/${drs.id}/edit`)}><Edit className="h-4 w-4" /></Button></PermissionGuard>
                        <PermissionGuard permission="transaction.drs.delete"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => setDeleteId(drs.id)}><Trash className="h-4 w-4" /></Button></PermissionGuard>
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
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= data.totalPages} onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}>›</Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= data.totalPages} onClick={() => setPage(data?.totalPages || 1)}>»</Button>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the DRS.
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
