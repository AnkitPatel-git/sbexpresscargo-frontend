"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit, FilePlus, FileDown, Filter, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { rateService } from "@/services/masters/rate-service";
import type { RateMaster } from "@/types/masters/rate";
import { PermissionGuard } from "@/components/auth/permission-guard"
import {
  defaultRateListUpdateType,
  isVendorRateMasterRow,
  parseRateContractParam,
  rateMasterCreatePath,
  rateMasterDuplicatePath,
  type RateMasterContract,
} from "@/lib/rate-master-nav";

function displayName(
  value?:
    | { code?: string; name?: string }
    | { productCode?: string; productName?: string }
    | { serviceType?: string }
    | null,
  fallback = "—",
) {
  if (!value) return fallback;
  if ("serviceType" in value && value.serviceType) return value.serviceType;
  if ("productName" in value) return value.productName || value.productCode || fallback;
  if ("name" in value) {
    const namedValue = value as { name?: string; code?: string };
    return namedValue.name || namedValue.code || fallback;
  }
  const codedValue = value as { code?: string };
  return codedValue.code || fallback;
}

function displayRateScope(row: RateMaster, contract: RateMasterContract) {
  if (contract === "vendor") {
    return displayName(row.serviceMap);
  }
  return displayName(row.product);
}

export default function RateMasterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const contract: RateMasterContract = useMemo(
    () => parseRateContractParam(searchParams.get("contract")),
    [searchParams],
  );
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
    updateType: "",
  });
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(appliedFilters.search, 500);
  const [sortBy, setSortBy] = useState("fromDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    if (filtersOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [appliedFilters, filtersOpen]);

  useEffect(() => {
    const raw = searchParams.get("contract");
    if (raw !== "vendor" && raw !== "customer") {
      router.replace("/masters/rates?contract=customer");
    }
  }, [router, searchParams]);

  useEffect(() => {
    const ut = defaultRateListUpdateType(contract);
    setAppliedFilters((prev) => ({ ...prev, updateType: ut }));
    setDraftFilters((prev) => ({ ...prev, updateType: ut }));
    setSortBy("fromDate");
    setSortOrder("desc");
    setPage(1);
  }, [contract]);

  const listParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    fromDate: appliedFilters.fromDate || undefined,
    toDate: appliedFilters.toDate || undefined,
    updateType: appliedFilters.updateType || undefined,
    sortBy,
    sortOrder,
  };

  const exportParams = {
    search: debouncedSearch || undefined,
    fromDate: appliedFilters.fromDate || undefined,
    toDate: appliedFilters.toDate || undefined,
    updateType: appliedFilters.updateType || undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["rate-masters", listParams],
    queryFn: () => rateService.getRateMasters(listParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rateService.deleteRateMaster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-masters"] });
      toast.success("Rate master deleted successfully");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete rate master");
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

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      search: "",
      fromDate: "",
      toDate: "",
      updateType: "",
    };
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  const pageTitle =
    contract === "vendor" ? "Vendor rate masters" : "Customer rate masters";
  const partyColumnLabel = contract === "vendor" ? "Vendor" : "Customer";
  const partySortField = contract === "vendor" ? "vendorName" : "customerName";
  const scopeColumnLabel = contract === "vendor" ? "Service" : "Product";
  const scopeSortField = contract === "vendor" ? "serviceType" : "productName";

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {contract === "vendor"
            ? "Buy-side contracts (VENDOR_RATE). Use Customer → Customer rates for sell-side AWB pricing."
            : "Sell-side customer contracts (default filter AWB_ENTRY_RATE). Use Vendor → Vendor rates for forwarding buy rates."}
        </p>
      </div>
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
                <DialogTitle>Rate Filters</DialogTitle>
                <DialogDescription>Filter the rate list and apply changes only when you are ready.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search</label>
                  <Input
                    placeholder="Search…"
                    className="h-9 bg-background"
                    value={draftFilters.search}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update Type</label>
                  <Input
                    placeholder="Update type"
                    className="h-9 bg-background"
                    value={draftFilters.updateType}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, updateType: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From Date</label>
                  <Input
                    type="date"
                    className="h-9 bg-background"
                    value={draftFilters.fromDate}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To Date</label>
                  <Input
                    type="date"
                    className="h-9 bg-background"
                    value={draftFilters.toDate}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                  />
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
          <PermissionGuard permission="master.rate.read">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              title="Export full detail (Excel)"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <Input
            placeholder="Search..."
            value={appliedFilters.search}
            onChange={(e) => {
              setAppliedFilters((prev) => ({ ...prev, search: e.target.value }));
              setPage(1);
            }}
            className="h-8 w-full sm:w-[240px]"
          />
          <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            className="h-8 gap-2 px-3 font-semibold"
            onClick={() => router.push(rateMasterCreatePath(contract))}
            title="Create rate master"
          >
            <FilePlus className="h-4 w-4" />
            Create Rate
          </Button>
          <PermissionGuard permission="master.rate.create">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-2 px-3 font-semibold"
              onClick={() => router.push(rateMasterDuplicatePath(contract))}
              title="Duplicate from existing rate"
            >
              <Copy className="h-4 w-4" />
              Duplicate Rate
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[960px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="ID" field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="Update type" field="updateType" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label={partyColumnLabel} field={partySortField} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label={scopeColumnLabel} field={scopeSortField} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="From" field="fromDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="To" field="toDate" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              </TableHead>
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
                <TableRow key={row.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.updateType}</TableCell>
                  <TableCell>
                    {contract === "vendor"
                      ? displayName(
                          row.vendor
                            ? {
                                name: row.vendor.vendorName,
                                code: row.vendor.vendorCode,
                              }
                            : null,
                          "—",
                        )
                      : displayName(row.customer)}
                  </TableCell>
                  <TableCell>{displayRateScope(row, contract)}</TableCell>
                  <TableCell>{row.fromDate?.slice(0, 10)}</TableCell>
                  <TableCell>{row.toDate?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                        onClick={() =>
                          router.push(
                            `/masters/rates/${row.id}/edit?contract=${isVendorRateMasterRow(row) ? "vendor" : "customer"}`,
                          )
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>
            «
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            ‹
          </Button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {page}
          </span>
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
            <AlertDialogTitle>Delete this rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the rate master record. Existing rate details stay intact for the backend history.
            </AlertDialogDescription>
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
