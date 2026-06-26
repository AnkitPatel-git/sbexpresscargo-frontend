"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Filter, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { SortableColumnHeader } from "@/components/ui/sortable-column-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select";
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
import { vendorService } from "@/services/masters/vendor-service";
import { zoneService } from "@/services/masters/zone-service";
import { vendorBillingMisReportService } from "@/services/reports/vendor-billing-mis-report-service";
import type { Vendor } from "@/types/masters/vendor";
import type { VendorBillingMisReportColumnKey } from "@/types/reports/vendor-billing-mis-report";
import { useAuth } from "@/context/auth-context";
import { MASTER_READ, hasMasterLookupForPortalTransaction } from "@/lib/portal-permissions";

type VendorBillingMisFilters = {
  awbNo: string;
  forwardingAwb: string;
  ewaybillNumber: string;
  bookDateFrom: string;
  bookDateTo: string;
  forwardingDateFrom: string;
  forwardingDateTo: string;
  vendorId?: number;
  customerId?: number;
  shipperId?: number;
  serviceCenterId?: number;
  productId?: number;
  fromZoneId?: number;
  toZoneId?: number;
  currentStatus?: string;
};

const DEFAULT_FILTERS: VendorBillingMisFilters = {
  awbNo: "",
  forwardingAwb: "",
  ewaybillNumber: "",
  bookDateFrom: "",
  bookDateTo: "",
  forwardingDateFrom: "",
  forwardingDateTo: "",
};

const STATUS_OPTIONS = [
  "BOOKED",
  "MANIFESTED",
  "PICKED_UP",
  "PICKUP_FAILED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERY_ATTEMPTED",
  "PARTIAL_DELIVERED",
  "DELIVERED",
  "CANCELLED",
  "LOST",
  "RETURN_IN_TRANSIT",
  "RETURN_OUT_FOR_DELIVERY",
  "RETURNED",
];

const NUMERIC_COLUMNS = new Set<VendorBillingMisReportColumnKey>([
  "qty",
  "actualWeight",
  "length",
  "breadth",
  "height",
  "noOfBox",
  "dimensionWeight",
  "chargeableWeight",
  "rate",
  "freight",
  "awbCharge",
  "fov",
  "ecc",
  "ras",
  "odaCharge",
  "handlingCharges",
  "ospCharges",
  "appointmentDelivery",
  "reversePickupCharges",
  "floorDeliveryCharges",
  "fuelCharges",
  "cafCharges",
  "idcCharges",
  "totalAmount",
  "gst",
  "invoiceAmount",
]);

function formatCell(value: string | number | null) {
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return String(value);
}

export default function VendorBillingMisReportPage() {
  const { hasPermission, isLoading: authLoading } = useAuth();
  const canReadVendors = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.vendor);
  const canReadCustomers = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.customer);
  const canReadShippers = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.shipper);
  const canReadZones = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.zone);
  const canReadProducts = hasMasterLookupForPortalTransaction(hasPermission, MASTER_READ.product);
  const canReadServiceCenters = hasMasterLookupForPortalTransaction(
    hasPermission,
    MASTER_READ.serviceCenter,
  );
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("bookDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<VendorBillingMisFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<VendorBillingMisFilters>(DEFAULT_FILTERS);

  const { data: pinnedVendorData } = useQuery({
    queryKey: ["vendor-billing-mis-report-vendor-pin", draftFilters.vendorId],
    queryFn: () => vendorService.getVendorById(draftFilters.vendorId!),
    enabled: !authLoading && canReadVendors && draftFilters.vendorId != null,
  });
  const { data: customerData } = useQuery({
    queryKey: ["vendor-billing-mis-report-customer-options"],
    queryFn: () =>
      customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled: !authLoading && canReadCustomers,
  });
  const { data: shipperData } = useQuery({
    queryKey: ["vendor-billing-mis-report-shipper-options"],
    queryFn: () =>
      shipperService.getShippers({ page: 1, limit: 100, sortBy: "shipperName", sortOrder: "asc" }),
    enabled: !authLoading && canReadShippers,
  });
  const { data: zoneData } = useQuery({
    queryKey: ["vendor-billing-mis-report-zone-options"],
    queryFn: () => zoneService.getZones({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled: !authLoading && canReadZones,
  });
  const { data: productData } = useQuery({
    queryKey: ["vendor-billing-mis-report-product-options"],
    queryFn: () =>
      productService.getProducts({ page: 1, limit: 100, sortBy: "productName", sortOrder: "asc" }),
    enabled: !authLoading && canReadProducts,
  });
  const { data: serviceCenterData } = useQuery({
    queryKey: ["vendor-billing-mis-report-service-center-options"],
    queryFn: () =>
      serviceCenterService.getServiceCenters({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    enabled: !authLoading && canReadServiceCenters,
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
        Object.entries(appliedFilters)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, value]),
      ),
    }),
    [appliedFilters, limit, page, search, sortBy, sortOrder],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-billing-mis-report", listParams],
    queryFn: () => vendorBillingMisReportService.getReport(listParams),
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const displayColumns = (data?.columns ?? []) as VendorBillingMisReportColumnKey[];
  const headers = data?.headers ?? {};

  const formatVendorLabel = (vendor: Pick<Vendor, "vendorCode" | "vendorName">) =>
    vendor.vendorCode ? `${vendor.vendorCode} - ${vendor.vendorName}` : vendor.vendorName;

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

  async function handleExport() {
    try {
      const { blob, filename } = await vendorBillingMisReportService.exportXlsx(listParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Vendor Billing MIS report exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export Vendor Billing MIS report");
    }
  }

  return (
    <PermissionGuard
      permission="report.vendor_billing_mis.read"
      fallback={
        <div className="rounded-lg border border-border/80 bg-card p-6 text-sm text-muted-foreground">
          You do not have permission to view the Vendor Billing MIS report.
        </div>
      }
    >
      <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight">Vendor Billing MIS Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vendor cost breakdown for forwarded shipments with charge columns matching the billing MIS format.
          </p>
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
                  <DialogTitle>Filter Vendor Billing MIS Report</DialogTitle>
                  <DialogDescription>Filter forwarded shipments by vendor, booking and master data fields.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DbAsyncSelect<Vendor>
                    queryKey={["vendor-billing-mis-report-vendor-options"]}
                    placeholder="Select vendor"
                    searchPlaceholder="Search vendor…"
                    disabled={!canReadVendors}
                    value={draftFilters.vendorId ? String(draftFilters.vendorId) : undefined}
                    onValueChange={(value) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        vendorId: value ? Number(value) : undefined,
                      }))
                    }
                    fetchPage={(page, search) =>
                      vendorService.getVendors({
                        page,
                        limit: DB_ASYNC_SELECT_PAGE_SIZE,
                        search: search || undefined,
                        sortBy: "vendorName",
                        sortOrder: "asc",
                      })
                    }
                    getItemLabel={formatVendorLabel}
                    extraItems={pinnedVendorData?.data ? [pinnedVendorData.data] : undefined}
                    triggerClassName="w-full"
                  />
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
                    placeholder="Ewaybill No"
                    value={draftFilters.ewaybillNumber}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, ewaybillNumber: event.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    aria-label="Booking date from"
                    value={draftFilters.bookDateFrom}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, bookDateFrom: event.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    aria-label="Booking date to"
                    value={draftFilters.bookDateTo}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, bookDateTo: event.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    aria-label="Forwarding date from"
                    value={draftFilters.forwardingDateFrom}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, forwardingDateFrom: event.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    aria-label="Forwarding date to"
                    value={draftFilters.forwardingDateTo}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({ ...prev, forwardingDateTo: event.target.value }))
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
                      <SelectValue placeholder="Select status">
                        {(draftFilters.currentStatus ?? "__ALL__") === "__ALL__"
                          ? "All Status"
                          : draftFilters.currentStatus}
                      </SelectValue>
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

            <Button type="button" variant="outline" className="h-9 gap-2" onClick={() => void handleExport()}>
              <FileUp className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2"
              onClick={() => queryClient.refetchQueries({ queryKey: ["vendor-billing-mis-report"], type: "active" })}
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
          <Table className="min-w-[5200px] border-0">
            <TableHeader>
              <TableRow className="border-0 bg-primary hover:bg-primary">
                {displayColumns.map((column) => (
                  <TableHead
                    key={column}
                    className="whitespace-pre-line font-semibold text-primary-foreground"
                  >
                    <SortableColumnHeader
                      label={headers[column] ?? column}
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
                  <TableCell
                    colSpan={displayColumns.length || 1}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading Vendor Billing MIS report...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={displayColumns.length || 1}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No report data found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow
                    key={`${row.awbNo ?? "row"}-${index}`}
                    className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                  >
                    {displayColumns.map((column) => {
                      const value = row[column];
                      return (
                        <TableCell
                          key={`${column}-${index}`}
                          className={NUMERIC_COLUMNS.has(column) ? "text-right tabular-nums" : undefined}
                        >
                          {formatCell(value)}
                        </TableCell>
                      );
                    })}
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
