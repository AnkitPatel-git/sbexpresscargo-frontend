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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { MASTER_READ, hasMasterLookupForPortalTransaction } from "@/lib/portal-permissions";
import { customerService } from "@/services/masters/customer-service";
import { allocationMisReportService } from "@/services/reports/allocation-mis-report-service";
import type { AllocationMisReportColumnKey } from "@/types/reports/allocation-mis-report";

type AllocationMisFilters = {
  customerId?: number;
  allocationDateFrom: string;
  allocationDateTo: string;
};

const DEFAULT_FILTERS: AllocationMisFilters = {
  allocationDateFrom: "",
  allocationDateTo: "",
};

const COUNT_COLUMNS = new Set<AllocationMisReportColumnKey>([
  "totalAssigned",
  "used",
  "cancelled",
  "available",
]);

const SORTABLE_COLUMNS = new Set<AllocationMisReportColumnKey>([
  "customerName",
  "allocationDate",
  "awbFrom",
  "awbTo",
]);

function formatCell(column: AllocationMisReportColumnKey, value: string | number | null) {
  if (column === "remarks") return value ? String(value) : "";
  if (value == null || value === "") return "—";
  if (COUNT_COLUMNS.has(column) && typeof value === "number") {
    return value.toLocaleString("en-IN");
  }
  return String(value);
}

export default function AllocationMisReportPage() {
  const { hasPermission, isLoading: authLoading } = useAuth();
  const canReadCustomers = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.customer);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("customerName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<AllocationMisFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<AllocationMisFilters>(DEFAULT_FILTERS);

  const { data: customerData } = useQuery({
    queryKey: ["allocation-mis-report-customer-options"],
    queryFn: () =>
      customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled: !authLoading && canReadCustomers,
  });

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [appliedFilters, filtersOpen]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      ...Object.fromEntries(
        Object.entries(appliedFilters).filter(([, value]) => value !== undefined && value !== ""),
      ),
    }),
    [appliedFilters, limit, page, search, sortBy, sortOrder],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["allocation-mis-report", listParams],
    queryFn: () => allocationMisReportService.getReport(listParams),
  });

  const rows = data?.data ?? [];
  const headers = data?.headers ?? {};
  const displayColumns = (data?.columns ?? [
    "srNo",
    "customerName",
    "allocationDate",
    "awbFrom",
    "awbTo",
    "totalAssigned",
    "used",
    "cancelled",
    "available",
    "status",
    "remarks",
  ]) as AllocationMisReportColumnKey[];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const customerOptions = (customerData?.data ?? []).map((customer) => ({
    value: String(customer.id),
    label: customer.code ? `${customer.code} - ${customer.name}` : customer.name,
  }));

  const onSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSearch("");
    setSearchInput("");
    setPage(1);
    setFiltersOpen(false);
  };

  async function handleExport() {
    try {
      const { blob, filename } = await allocationMisReportService.exportXlsx(listParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Allocation MIS report exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export Allocation MIS report");
    }
  }

  return (
    <PermissionGuard
      permission="report.allocation_mis.read"
      fallback={
        <div className="rounded-lg border border-border/80 bg-card p-6 text-sm text-muted-foreground">
          You do not have permission to view the Allocation MIS report.
        </div>
      }
    >
      <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight">Allocation MIS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AWB number blocks assigned to customers, with used, cancelled, and available counts.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex gap-2">
            <Input
              placeholder="Search customer or AWB number..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                setSearch(searchInput.trim());
                setPage(1);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2"
              onClick={() => {
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="h-9 gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Filter Allocation MIS</DialogTitle>
                  <DialogDescription>
                    Filter allocated AWB ranges by customer and allocation date.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Combobox
                    className="w-full sm:col-span-2"
                    placeholder="Select customer"
                    searchPlaceholder="Search customer..."
                    emptyMessage="No customer found."
                    value={draftFilters.customerId ? String(draftFilters.customerId) : ""}
                    onChange={(value) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        customerId: value ? Number(value) : undefined,
                      }))
                    }
                    options={customerOptions}
                  />
                  <Input
                    type="date"
                    aria-label="Allocation date from"
                    value={draftFilters.allocationDateFrom}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        allocationDateFrom: event.target.value,
                      }))
                    }
                  />
                  <Input
                    type="date"
                    aria-label="Allocation date to"
                    value={draftFilters.allocationDateTo}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        allocationDateTo: event.target.value,
                      }))
                    }
                  />
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

            <Button type="button" variant="outline" className="h-9 gap-2" onClick={() => void handleExport()}>
              <FileUp className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2"
              onClick={() =>
                queryClient.refetchQueries({ queryKey: ["allocation-mis-report"], type: "active" })
              }
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue>{limit}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table className="min-w-[1100px] border-0">
            <TableHeader>
              <TableRow className="border-0 bg-primary hover:bg-primary">
                {displayColumns.map((column) => (
                  <TableHead
                    key={column}
                    className="whitespace-nowrap font-semibold text-primary-foreground"
                  >
                    {SORTABLE_COLUMNS.has(column) ? (
                      <SortableColumnHeader
                        label={headers[column] ?? column}
                        field={column}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={onSort}
                      />
                    ) : (
                      headers[column] ?? column
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length} className="h-24 text-center text-muted-foreground">
                    Loading Allocation MIS...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length} className="h-24 text-center text-muted-foreground">
                    Could not load Allocation MIS.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length} className="h-24 text-center text-muted-foreground">
                    No allocations found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow
                    key={`${row.awbFrom}-${row.awbTo}-${index}`}
                    className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                  >
                    {displayColumns.map((column) => (
                      <TableCell
                        key={`${column}-${index}`}
                        className={cn(
                          COUNT_COLUMNS.has(column) && "text-right tabular-nums",
                          (column === "awbFrom" || column === "awbTo") && "font-mono",
                        )}
                      >
                        {formatCell(column, row[column])}
                      </TableCell>
                    ))}
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-8 px-2"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              ‹
            </Button>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
              {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-8 px-2"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              ›
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-8 px-2"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              »
            </Button>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
