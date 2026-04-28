"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Columns3, FileUp, Filter, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { SortableColumnHeader } from "@/components/ui/sortable-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { customerService } from "@/services/masters/customer-service";
import { productService } from "@/services/masters/product-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { shipperService } from "@/services/masters/shipper-service";
import { zoneService } from "@/services/masters/zone-service";
import { misReportService } from "@/services/reports/mis-report-service";
import { MIS_REPORT_COLUMNS, type MisReportColumn } from "@/types/reports/mis-report";

type MisReportFilters = {
  awbNo: string;
  forwardingAwb: string;
  ewaybillNumber: string;
  bookDateFrom: string;
  bookDateTo: string;
  customerId?: number;
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
};

const DEFAULT_FILTERS: MisReportFilters = {
  awbNo: "",
  forwardingAwb: "",
  ewaybillNumber: "",
  bookDateFrom: "",
  bookDateTo: "",
};

const DEFAULT_COLUMNS: MisReportColumn[] = [
  "awbNo",
  "ewaybillNumber",
  "forwardingAwb",
  "bookDate",
  "customerName",
  "shipperName",
  "consigneeName",
  "serviceCenter",
  "fromZone",
  "toZone",
  "declaredWeight",
  "chargeWeight",
  "totalAmount",
  "currentStatus",
];

const COLUMN_LABELS: Record<MisReportColumn, string> = {
  awbNo: "AWB No",
  forwardingAwb: "FWD. No",
  ewaybillNumber: "Ref No",
  bookDate: "Booking Date",
  customerName: "Customer Name",
  shipperName: "Shipper Name",
  consigneeName: "Consignee Name",
  paymentType: "Payment Type",
  currentStatus: "Status",
  fromZone: "From Zone",
  toZone: "To Zone",
  serviceCenter: "Service Center",
  productName: "Product",
  declaredWeight: "Declared Weight",
  chargeWeight: "Charge Weight",
  shipmentTotalValue: "Shipment Value",
  totalAmount: "Total Amount",
  createdAt: "Created At",
};

const STATUS_OPTIONS = ["CREATED", "PICKED", "IN_TRANSIT", "DELIVERED", "FAILED"];

export default function MisReportPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("bookDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<MisReportFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<MisReportFilters>(DEFAULT_FILTERS);
  const [selectedColumns, setSelectedColumns] = useState<MisReportColumn[]>(DEFAULT_COLUMNS);
  const [draftColumns, setDraftColumns] = useState<MisReportColumn[]>(DEFAULT_COLUMNS);

  const { data: customerData } = useQuery({
    queryKey: ["mis-report-customer-options"],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });
  const { data: shipperData } = useQuery({
    queryKey: ["mis-report-shipper-options"],
    queryFn: () => shipperService.getShippers({ page: 1, limit: 100, sortBy: "shipperName", sortOrder: "asc" }),
  });
  const { data: zoneData } = useQuery({
    queryKey: ["mis-report-zone-options"],
    queryFn: () => zoneService.getZones({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });
  const { data: productData } = useQuery({
    queryKey: ["mis-report-product-options"],
    queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: "productName", sortOrder: "asc" }),
  });
  const { data: serviceCenterData } = useQuery({
    queryKey: ["mis-report-service-center-options"],
    queryFn: () =>
      serviceCenterService.getServiceCenters({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });

  useEffect(() => {
    if (filtersOpen) setDraftFilters(appliedFilters);
  }, [appliedFilters, filtersOpen]);

  useEffect(() => {
    if (columnsOpen) setDraftColumns(selectedColumns);
  }, [columnsOpen, selectedColumns]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      columns: selectedColumns,
      ...Object.fromEntries(
        Object.entries(appliedFilters)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, value]),
      ),
    }),
    [appliedFilters, limit, page, search, selectedColumns, sortBy, sortOrder],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["mis-report", listParams],
    queryFn: () => misReportService.getMisReport(listParams),
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const allColumns = data?.availableColumns?.length ? data.availableColumns : MIS_REPORT_COLUMNS;
  const displayColumns = data?.columns?.length ? data.columns : selectedColumns;

  const customerOptions = (customerData?.data ?? []).map((customer) => ({
    value: String(customer.id),
    label: customer.code ? `${customer.code} - ${customer.name}` : customer.name,
  }));
  const shipperOptions = (shipperData?.data ?? []).map((shipper) => ({
    value: String(shipper.id),
    label: shipper.shipperCode ? `${shipper.shipperCode} - ${shipper.shipperName}` : shipper.shipperName,
  }));
  const zoneOptions = (zoneData?.data ?? []).map((zone) => ({
    value: String(zone.id),
    label: zone.code ? `${zone.code} - ${zone.name}` : zone.name,
  }));
  const productOptions = (productData?.data ?? []).map((product) => ({
    value: String(product.id),
    label: product.productCode ? `${product.productCode} - ${product.productName}` : product.productName,
  }));
  const serviceCenterOptions = (serviceCenterData?.data ?? []).map((center) => ({
    value: String(center.id),
    label: center.code ? `${center.code} - ${center.name}` : center.name,
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

  const toggleColumn = (column: MisReportColumn, checked: boolean) => {
    if (checked) {
      if (!draftColumns.includes(column)) {
        setDraftColumns((prev) => [...prev, column]);
      }
      return;
    }
    setDraftColumns((prev) => prev.filter((col) => col !== column));
  };

  const moveColumn = (column: MisReportColumn, direction: "up" | "down") => {
    const index = draftColumns.indexOf(column);
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= draftColumns.length) return;
    const next = [...draftColumns];
    const [picked] = next.splice(index, 1);
    next.splice(target, 0, picked);
    setDraftColumns(next);
  };

  const applyColumns = () => {
    if (draftColumns.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    setSelectedColumns(draftColumns);
    setPage(1);
    setColumnsOpen(false);
  };

  const resetColumns = () => {
    setDraftColumns(DEFAULT_COLUMNS);
  };

  async function handleExport() {
    try {
      const { blob, filename } = await misReportService.exportMisReportCsv(listParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("MIS report exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export MIS report");
    }
  }

  const formatCell = (value: string | number | null) => {
    if (value == null || value === "") return "—";
    return String(value);
  };

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">MIS Report</h1>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex gap-2">
          <Input
            placeholder="Search AWB, customer, shipper, consignee..."
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
                <DialogTitle>Filter MIS Report</DialogTitle>
                <DialogDescription>Apply the fields available in current system data.</DialogDescription>
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
                  placeholder="FWD No"
                  value={draftFilters.forwardingAwb}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, forwardingAwb: event.target.value }))
                  }
                />
                <Input
                  placeholder="Ref No"
                  value={draftFilters.ewaybillNumber}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({ ...prev, ewaybillNumber: event.target.value }))
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
                <Select
                  value={draftFilters.currentStatus ?? "__ALL__"}
                  onValueChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      currentStatus: value === "__ALL__" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
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
                      customerId: value ? Number(value) : undefined,
                    }))
                  }
                  options={customerOptions}
                />
                <Combobox
                  className="w-full"
                  placeholder="Select shipper"
                  searchPlaceholder="Search shipper..."
                  emptyMessage="No shipper found."
                  value={draftFilters.shipperId ? String(draftFilters.shipperId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      shipperId: value ? Number(value) : undefined,
                    }))
                  }
                  options={shipperOptions}
                />
                <Combobox
                  className="w-full"
                  placeholder="Select service center"
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
                <Combobox
                  className="w-full"
                  placeholder="Select product"
                  searchPlaceholder="Search product..."
                  emptyMessage="No product found."
                  value={draftFilters.productId ? String(draftFilters.productId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      productId: value ? Number(value) : undefined,
                    }))
                  }
                  options={productOptions}
                />
                <Combobox
                  className="w-full"
                  placeholder="From Zone"
                  searchPlaceholder="Search zone..."
                  emptyMessage="No zone found."
                  value={draftFilters.fromZoneId ? String(draftFilters.fromZoneId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      fromZoneId: value ? Number(value) : undefined,
                    }))
                  }
                  options={zoneOptions}
                />
                <Combobox
                  className="w-full"
                  placeholder="To Zone"
                  searchPlaceholder="Search zone..."
                  emptyMessage="No zone found."
                  value={draftFilters.toZoneId ? String(draftFilters.toZoneId) : ""}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      toZoneId: value ? Number(value) : undefined,
                    }))
                  }
                  options={zoneOptions}
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

          <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="h-9 gap-2">
                <Columns3 className="h-4 w-4" />
                Format Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adjust Columns</DialogTitle>
                <DialogDescription>Choose visible columns and adjust order.</DialogDescription>
              </DialogHeader>

              <div className="max-h-[52vh] space-y-2 overflow-y-auto rounded-md border p-2">
                {allColumns.map((column) => {
                  const checked = draftColumns.includes(column);
                  const index = draftColumns.indexOf(column);
                  return (
                    <div key={column} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(state) => toggleColumn(column, state === true)}
                        />
                        {COLUMN_LABELS[column]}
                      </label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={!checked || index <= 0}
                          onClick={() => moveColumn(column, "up")}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={!checked || index < 0 || index >= draftColumns.length - 1}
                          onClick={() => moveColumn(column, "down")}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraftColumns([...allColumns])}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraftColumns([])}
                >
                  Clear All
                </Button>
                <Button type="button" variant="outline" onClick={resetColumns}>
                  Reset Default
                </Button>
                <Button type="button" onClick={applyColumns}>
                  Apply Columns
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <PermissionGuard permission="transaction.shipment.read">
            <Button type="button" variant="outline" className="h-9 gap-2" onClick={() => void handleExport()}>
              <FileUp className="h-4 w-4" />
              Export CSV
            </Button>
          </PermissionGuard>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2"
            onClick={() => queryClient.refetchQueries({ queryKey: ["mis-report"], type: "active" })}
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
            <SelectValue />
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
        <Table className="min-w-[1200px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              {displayColumns.map((column) => (
                <TableHead key={column} className="font-semibold text-primary-foreground">
                  <SortableColumnHeader
                    label={COLUMN_LABELS[column]}
                    field={column}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length || 1} className="h-24 text-center text-muted-foreground">
                  Loading MIS report...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length || 1} className="h-24 text-center text-muted-foreground">
                  No report data found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={`${row.awbNo ?? "row"}-${index}`}
                  className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                >
                  {displayColumns.map((column) => (
                    <TableCell key={`${column}-${index}`}>{formatCell(row[column])}</TableCell>
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
  );
}
