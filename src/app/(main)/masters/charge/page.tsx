"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Edit, Trash2, FileUp, Filter, RefreshCw, FilePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

import { chargeService } from "@/services/masters/charge-service";
import type { Charge } from "@/types/masters/charge";
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function ChargePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    code: "",
    name: "",
    applyFuel: "all",
  });
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [appliedFilters, filtersOpen]);

  const parseBooleanFilter = (value: string): boolean | undefined => (value === "all" ? undefined : value === "true");

  const listParams = {
    page,
    limit,
    search: appliedFilters.search || undefined,
    sortBy: "code" as const,
    sortOrder: "asc" as const,
    code: appliedFilters.code || undefined,
    name: appliedFilters.name || undefined,
    applyFuel: parseBooleanFilter(appliedFilters.applyFuel),
  };

  const exportParams = {
    search: appliedFilters.search || undefined,
    sortBy: "code" as const,
    sortOrder: "asc" as const,
    code: appliedFilters.code || undefined,
    name: appliedFilters.name || undefined,
    applyFuel: parseBooleanFilter(appliedFilters.applyFuel),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["charges", listParams],
    queryFn: () => chargeService.getCharges(listParams),
  });

  const exportMutation = useMutation({
    mutationFn: () => chargeService.exportCharges(exportParams),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Charges exported");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Export failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => chargeService.deleteCharge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      toast.success("Charge deleted successfully");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete charge");
      setDeleteId(null);
    },
  });

  const total = data?.meta?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const rows = data?.data ?? [];

  const defaultFilters = { search: "", code: "", name: "", applyFuel: "all" };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 self-start rounded-md border border-border p-1 sm:self-auto">
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Charge Filters</DialogTitle>
                <DialogDescription>Filter the charge list and apply when ready.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
                  <Input
                    className="h-9 bg-background"
                    placeholder="Search…"
                    value={draftFilters.search}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</label>
                  <Input
                    className="h-9 bg-background"
                    value={draftFilters.code}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
                  <Input
                    className="h-9 bg-background"
                    value={draftFilters.name}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apply fuel</label>
                  <Select value={draftFilters.applyFuel} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, applyFuel: value }))}>
                    <SelectTrigger className="h-9 w-full bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button type="button" onClick={applyFilters}>
                  Apply
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <PermissionGuard permission="master.charge.read">
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
            title="Refresh"
            onClick={() => queryClient.refetchQueries({ queryKey: ["charges"], type: "active" })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <PermissionGuard permission="master.charge.create">
          <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={() => router.push("/masters/charge/create")}>
            <FilePlus className="h-4 w-4" />
            Create Charge
          </Button>
        </PermissionGuard>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[800px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">ID</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Code</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Name</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Apply fuel</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Sequence</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Version</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading charges…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No charges found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((charge: Charge, index: number) => (
                <TableRow key={charge.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell className="font-medium">{charge.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{charge.code}</TableCell>
                  <TableCell className="text-foreground">{charge.name}</TableCell>
                  <TableCell className="text-foreground">{charge.applyFuel ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-center text-foreground">{charge.sequence}</TableCell>
                  <TableCell className="text-center text-foreground">{charge.version}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <PermissionGuard permission="master.charge.update">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                          onClick={() => router.push(`/masters/charge/${charge.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="master.charge.delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                          onClick={() => setDeleteId(charge.id)}
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
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>
            «
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            ‹
          </Button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>
            ›
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)}>
            »
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this charge?</AlertDialogTitle>
            <AlertDialogDescription>This removes the charge master record from active use.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 focus:ring-red-600" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
