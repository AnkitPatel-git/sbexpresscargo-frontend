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
import { productService } from "@/services/masters/product-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { dpBatchReportService } from "@/services/reports/dp-batch-report-service";
import type { DpBatchMode } from "@/types/reports/dp-batch-report";

type DpBatchFilters = {
  awbNo: string;
  bookDateFrom: string;
  bookDateTo: string;
  customerId?: number;
  serviceCenterId?: number;
  productId?: number;
  mode?: DpBatchMode;
};

const DEFAULT_FILTERS: DpBatchFilters = {
  awbNo: "",
  bookDateFrom: "",
  bookDateTo: "",
};

const MODE_OPTIONS: { value: DpBatchMode; label: string }[] = [
  { value: "AIR", label: "Air" },
  { value: "SURFACE", label: "Surface" },
];

export default function DpBatchReportPage() {
  const {
    isCustomerUser,
    defaultCustomerId,
    hasPermission,
    isLoading: authLoading,
  } = useAuth();
  const canReadCustomers = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.customer);
  const canReadProducts = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.product);
  const canReadServiceCenters = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.serviceCenter);
  const scopedCustomerId =
    isCustomerUser && Number.isInteger(Number(defaultCustomerId)) && Number(defaultCustomerId) > 0
      ? Number(defaultCustomerId)
      : undefined;

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("awbNo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<DpBatchFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<DpBatchFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!isCustomerUser || !scopedCustomerId) return;
    setAppliedFilters((prev) => ({ ...prev, customerId: scopedCustomerId }));
    setDraftFilters((prev) => ({ ...prev, customerId: scopedCustomerId }));
  }, [isCustomerUser, scopedCustomerId]);

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [appliedFilters, filtersOpen]);

  const { data: customerData } = useQuery({
    queryKey: ["dp-batch-report-customer-options"],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled: !authLoading && canReadCustomers && !isCustomerUser,
  });
  const { data: productData } = useQuery({
    queryKey: ["dp-batch-report-product-options"],
    queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: "productName", sortOrder: "asc" }),
    enabled: !authLoading && canReadProducts,
  });
  const { data: serviceCenterData } = useQuery({
    queryKey: ["dp-batch-report-service-center-options"],
    queryFn: () =>
      serviceCenterService.getServiceCenters({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled: !authLoading && canReadServiceCenters && !isCustomerUser,
  });

  const customerOptions = useMemo(
    () =>
      (customerData?.data ?? []).map((row) => ({
        value: String(row.id),
        label: row.name ?? String(row.id),
      })),
    [customerData],
  );
  const productOptions = useMemo(
    () =>
      (productData?.data ?? []).map((row) => ({
        value: String(row.id),
        label: row.productName ?? String(row.id),
      })),
    [productData],
  );
  const serviceCenterOptions = useMemo(
    () =>
      (serviceCenterData?.data ?? []).map((row) => ({
        value: String(row.id),
        label: row.code ? `${row.code} — ${row.name}` : (row.name ?? String(row.id)),
      })),
    [serviceCenterData],
  );

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      ...Object.fromEntries(
        Object.entries(appliedFilters).filter(([, value]) => value !== "" && value != null),
      ),
    }),
    [appliedFilters, limit, page, search, sortBy, sortOrder],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["dp-batch-report", listParams],
    queryFn: () => dpBatchReportService.getDpBatchReport(listParams),
    enabled: !authLoading,
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const onSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortOrder("asc");
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    const next: DpBatchFilters = {
      ...DEFAULT_FILTERS,
      ...(scopedCustomerId ? { customerId: scopedCustomerId } : {}),
    };
    setDraftFilters(next);
    setAppliedFilters(next);
    setSearch("");
    setSearchInput("");
    setPage(1);
    setFiltersOpen(false);
  };

  async function handleExport() {
    try {
      const { blob, filename } = await dpBatchReportService.exportDpBatchReportCsv(listParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("DP Batch report exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export DP Batch report");
    }
  }

  const formatCell = (value: string | number | null) => {
    if (value == null || value === "") return "—";
    return String(value);
  };

  const activeModeLabel =
    appliedFilters.mode != null
      ? MODE_OPTIONS.find((option) => option.value === appliedFilters.mode)?.label
      : null;
  const activeProductLabel = appliedFilters.productId
    ? productOptions.find((option) => option.value === String(appliedFilters.productId))?.label
    : null;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-1">
        <h1 className="text-lg font-semibold tracking-tight">DP Batch Report</h1>
        <p className="text-sm text-muted-foreground">
          Air/Surface batch control — filter by product or mode, then export CSV.
        </p>
      </div>

      <div className="mb-4 mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex gap-2">
          <Input
            placeholder="Search AWB, pin code, content..."
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
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Filter DP Batch Report</DialogTitle>
                <DialogDescription>
                  Use product for a specific service, or mode for all Air/Surface products.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  placeholder="AWB No"
                  value={draftFilters.awbNo}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, awbNo: event.target.value }))
                  }
                />
                <Input
                  type="date"
                  value={draftFilters.bookDateFrom}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, bookDateFrom: event.target.value }))
                  }
                />
                <Input
                  type="date"
                  value={draftFilters.bookDateTo}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, bookDateTo: event.target.value }))
                  }
                />
                <Combobox
                  className="w-full"
                  placeholder="Product (search)"
                  searchPlaceholder="Search product..."
                  emptyMessage="No product found."
                  value={draftFilters.productId ? String(draftFilters.productId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      productId: value ? Number(value) : undefined,
                      ...(value ? { mode: undefined } : {}),
                    }))
                  }
                  options={productOptions}
                />
                <Select
                  value={draftFilters.mode ?? "__ALL__"}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      mode: value === "__ALL__" ? undefined : (value as DpBatchMode),
                      ...(value !== "__ALL__" ? { productId: undefined } : {}),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mode">
                      {draftFilters.mode ?? "All modes"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">All modes</SelectItem>
                    {MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Combobox
                  className="w-full"
                  placeholder="Select customer"
                  searchPlaceholder="Search customer..."
                  emptyMessage="No customer found."
                  value={draftFilters.customerId ? String(draftFilters.customerId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      customerId:
                        isCustomerUser && scopedCustomerId
                          ? scopedCustomerId
                          : value
                            ? Number(value)
                            : undefined,
                    }))
                  }
                  options={customerOptions}
                  disabled={isCustomerUser}
                />
                <Combobox
                  className="w-full"
                  placeholder="Service center (ORG)"
                  searchPlaceholder="Search service center..."
                  emptyMessage="No service center found."
                  value={draftFilters.serviceCenterId ? String(draftFilters.serviceCenterId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      serviceCenterId: value ? Number(value) : undefined,
                    }))
                  }
                  options={serviceCenterOptions}
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

          <PermissionGuard permission="report.dp_batch.read">
            <Button type="button" variant="outline" className="h-9 gap-2" onClick={() => void handleExport()}>
              <FileUp className="h-4 w-4" />
              Export CSV
            </Button>
          </PermissionGuard>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2"
            onClick={() => queryClient.refetchQueries({ queryKey: ["dp-batch-report"], type: "active" })}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {(activeProductLabel || activeModeLabel) && (
        <p className="mb-3 text-sm text-muted-foreground">
          {activeProductLabel ? `Product: ${activeProductLabel}` : null}
          {activeProductLabel && activeModeLabel ? " · " : null}
          {activeModeLabel ? `Mode: ${activeModeLabel}` : null}
        </p>
      )}

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
        <Table className="min-w-[900px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="SR NO." field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="AWB NO" field="awbNo" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">ORG</TableHead>
              <TableHead className="font-semibold text-primary-foreground">PIN CODE</TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader label="PCS." field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">
                <SortableColumnHeader
                  label="WGT."
                  field="chargeWeight"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="font-semibold text-primary-foreground">CONTENT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading DP Batch report...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No report data found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={`${row.awbNo ?? "row"}-${index}`}
                  className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                >
                  <TableCell>{formatCell(row.srNo)}</TableCell>
                  <TableCell>{formatCell(row.awbNo)}</TableCell>
                  <TableCell>{formatCell(row.org)}</TableCell>
                  <TableCell>{formatCell(row.pinCode)}</TableCell>
                  <TableCell>{formatCell(row.pcs)}</TableCell>
                  <TableCell>{formatCell(row.wgt)}</TableCell>
                  <TableCell>{formatCell(row.content)}</TableCell>
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
  );
}
