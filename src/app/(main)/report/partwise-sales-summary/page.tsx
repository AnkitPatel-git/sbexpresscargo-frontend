"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Filter, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { SortableColumnHeader } from "@/components/ui/sortable-column-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { MASTER_READ, hasMasterLookupForPortalTransaction } from "@/lib/portal-permissions";
import { customerGroupService } from "@/services/masters/customer-group-service";
import { partwiseSalesSummaryService } from "@/services/reports/partwise-sales-summary-service";

type PartwiseSalesFilters = {
  customerGroupId?: number;
};

const DEFAULT_FILTERS: PartwiseSalesFilters = {};

function formatAmount(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function PartwiseSalesSummaryPage() {
  const { hasPermission, isLoading: authLoading } = useAuth();
  const canReadCustomerGroups = hasMasterLookupForPortalTransaction(
    hasPermission,
    MASTER_READ.customer,
  );

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("clientName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<PartwiseSalesFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<PartwiseSalesFilters>(DEFAULT_FILTERS);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [appliedFilters, filtersOpen]);

  const { data: groupData } = useQuery({
    queryKey: ["partwise-sales-customer-group-options"],
    queryFn: () =>
      customerGroupService.getCustomerGroups({
        page: 1,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
    enabled: !authLoading && canReadCustomerGroups,
  });

  const groupOptions = useMemo(
    () =>
      (groupData?.data ?? []).map((row) => ({
        value: String(row.id),
        label: row.name ?? String(row.id),
      })),
    [groupData],
  );

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "partwise-sales-summary",
      page,
      search,
      sortBy,
      sortOrder,
      appliedFilters,
    ],
    queryFn: () =>
      partwiseSalesSummaryService.getReport({
        page,
        limit: 20,
        search: search || undefined,
        sortBy,
        sortOrder,
        customerGroupId: appliedFilters.customerGroupId,
      }),
    enabled: !authLoading,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const months = data?.months;

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { blob, filename } = await partwiseSalesSummaryService.exportCsv({
        search: search || undefined,
        sortBy,
        sortOrder,
        customerGroupId: appliedFilters.customerGroupId,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Partwise Sales Summary exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PermissionGuard
      permission="report.partwise_sales.read"
      fallback={
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          You need the <span className="font-mono">report.partwise_sales.read</span> permission
          to view this report (admin and finance only).
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Partwise Sales Summary</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Shipment total amount summed per client for the current month and the two prior months
              (by booking date).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => {
                void refetch();
                void queryClient.invalidateQueries({ queryKey: ["partwise-sales-summary"] });
              }}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            className="relative flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search client or group…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
                <DialogDescription>Limit the report by customer group.</DialogDescription>
              </DialogHeader>
              {canReadCustomerGroups ? (
                <Combobox
                  className="w-full"
                  placeholder="All groups"
                  searchPlaceholder="Search group…"
                  emptyMessage="No group found."
                  value={draftFilters.customerGroupId ? String(draftFilters.customerGroupId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      customerGroupId: value ? Number(value) : undefined,
                    }))
                  }
                  options={groupOptions}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Customer group filter requires customer master read access.
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraftFilters(DEFAULT_FILTERS);
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setAppliedFilters(draftFilters);
                    setPage(1);
                    setFiltersOpen(false);
                  }}
                >
                  Apply
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table className="min-w-[720px] border-0">
            <TableHeader>
              <TableRow className="border-0 bg-primary hover:bg-primary">
                <TableHead className="font-semibold text-primary-foreground">
                  <SortableColumnHeader
                    label="Client Name"
                    field="clientName"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-primary-foreground">
                  <SortableColumnHeader
                    label="Group"
                    field="groupName"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="font-semibold text-primary-foreground text-right">
                  <SortableColumnHeader
                    label={months?.currentMonth ?? "Current month"}
                    field="currentMonthTotal"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="font-semibold text-primary-foreground text-right">
                  <SortableColumnHeader
                    label={months?.lastMonth ?? "Last month"}
                    field="lastMonthTotal"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="justify-end"
                  />
                </TableHead>
                <TableHead className="font-semibold text-primary-foreground text-right">
                  <SortableColumnHeader
                    label={months?.lastLastMonth ?? "Month before last"}
                    field="lastLastMonthTotal"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    className="justify-end"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading Partwise Sales Summary…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell className="font-medium">{row.clientName}</TableCell>
                    <TableCell>{row.groupName || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.currentMonthTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.lastMonthTotal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(row.lastLastMonthTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} clients)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
