"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, FilePlus, FileSpreadsheet, FileUp, Filter, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsClient } from "@/hooks/use-is-client";
import { customerService } from "@/services/masters/customer-service";
import { shipmentService } from "@/services/transactions/shipment-service";
import type { Shipment } from "@/types/transactions/shipment";
import type { Customer } from "@/types/masters/customer";

type ShipmentFilters = {
  awbNo: string;
  ewaybillNumber: string;
  clientName: string;
  /** UI only: binds client row picker to API `clientName`. */
  clientFilterCustomerId?: number;
  origin: string;
  destination: string;
  paymentType: string;
  bookDateFrom: string;
  bookDateTo: string;
};

const defaultFilters: ShipmentFilters = {
  awbNo: "",
  ewaybillNumber: "",
  clientName: "",
  clientFilterCustomerId: undefined,
  origin: "",
  destination: "",
  paymentType: "",
  bookDateFrom: "",
  bookDateTo: "",
};

const SHIPMENT_CLIENT_ANY = "__all__";

export default function ShipmentsPage() {
  const isClient = useIsClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShipmentFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<ShipmentFilters>(defaultFilters);

  useEffect(() => {
    if (filtersOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [appliedFilters, filtersOpen]);

  useEffect(() => {
    if (!filtersOpen || !draftFilters.clientName?.trim() || draftFilters.clientFilterCustomerId != null) return;
    let cancelled = false;
    void customerService
      .getCustomers({
        search: draftFilters.clientName.trim(),
        page: 1,
        limit: 20,
        sortBy: "name",
        sortOrder: "asc",
      })
      .then((res) => {
        if (cancelled) return;
        const match = res.data.find((c) => c.name === draftFilters.clientName.trim());
        if (match) setDraftFilters((p) => ({ ...p, clientFilterCustomerId: match.id }));
      });
    return () => {
      cancelled = true;
    };
  }, [filtersOpen, draftFilters.clientName, draftFilters.clientFilterCustomerId]);

  const extraShipmentFilterCustomer = useMemo((): Customer[] | undefined => {
    const id = draftFilters.clientFilterCustomerId;
    const name = draftFilters.clientName?.trim();
    if (id == null || !name) return undefined;
    return [{ id, name, code: "" }] as unknown as Customer[];
  }, [draftFilters.clientFilterCustomerId, draftFilters.clientName]);

  const listParams = {
    page,
    limit,
    sortBy: "id",
    sortOrder: "desc" as const,
    ...Object.fromEntries(
      Object.entries(appliedFilters)
        .filter(([key]) => key !== "clientFilterCustomerId")
        .map(([key, value]) => [key, typeof value === "string" && value.trim() ? value : undefined]),
    ),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["shipments", listParams],
    queryFn: () => shipmentService.getShipments(listParams),
  });

  const total = data?.meta?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const rows = data?.data ?? [];

  const handleCreate = () => router.push("/transactions/shipment/create");
  const handleEdit = (shipment: Shipment) => router.push(`/transactions/shipment/${shipment.id}/edit`);
  const handleViewDetails = (shipment: Shipment) => router.push(`/transactions/shipment/${shipment.id}`);

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

  async function handleExport() {
    try {
      const { blob, filename } = await shipmentService.exportShipmentsCsv(listParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Shipment bookings exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export shipment bookings");
    }
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Shipment Booking</h1>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 self-start rounded-md border border-border p-1 sm:self-auto">
          {isClient ? (
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                  <Filter className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Shipment Booking Filters</DialogTitle>
                  <DialogDescription>
                    Choose one or more filters, then apply them to the shipment booking list.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="AWB no"
                    value={draftFilters.awbNo}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, awbNo: e.target.value }))}
                  />
                  <Input
                    placeholder="E-waybill no"
                    value={draftFilters.ewaybillNumber}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, ewaybillNumber: e.target.value }))}
                  />
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Client</span>
                    <DbAsyncSelect<Customer>
                      queryKey={["shipment-booking", "client-filter"]}
                      fetchPage={(page, search) =>
                        customerService.getCustomers({
                          page,
                          limit: DB_ASYNC_SELECT_PAGE_SIZE,
                          sortBy: "name",
                          sortOrder: "asc",
                          search: search || undefined,
                        })
                      }
                      getItemLabel={(c) => (c.code ? `${c.code} - ${c.name}` : c.name)}
                      extraItems={extraShipmentFilterCustomer}
                      clearOption={{ value: SHIPMENT_CLIENT_ANY, label: "Any client" }}
                      value={
                        draftFilters.clientFilterCustomerId != null
                          ? String(draftFilters.clientFilterCustomerId)
                          : SHIPMENT_CLIENT_ANY
                      }
                      onValueChange={(v) => {
                        if (v === SHIPMENT_CLIENT_ANY) {
                          setDraftFilters((p) => ({ ...p, clientName: "", clientFilterCustomerId: undefined }));
                          return;
                        }
                        void customerService.getCustomerById(Number(v)).then((res) => {
                          setDraftFilters((p) => ({
                            ...p,
                            clientName: res.data.name,
                            clientFilterCustomerId: res.data.id,
                          }));
                        });
                      }}
                      placeholder="Any client"
                      searchPlaceholder="Search client…"
                      triggerClassName="w-full"
                    />
                  </div>
                  <Input
                    placeholder="Payment type"
                    value={draftFilters.paymentType}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, paymentType: e.target.value }))}
                  />
                  <Input
                    placeholder="Origin"
                    value={draftFilters.origin}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, origin: e.target.value }))}
                  />
                  <Input
                    placeholder="Destination"
                    value={draftFilters.destination}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, destination: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={draftFilters.bookDateFrom}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, bookDateFrom: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={draftFilters.bookDateTo}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, bookDateTo: e.target.value }))}
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
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary opacity-60"
              disabled
              title="Filters (loading)"
              aria-label="Filters, loading"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          <PermissionGuard permission="transaction.shipment.read">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => void handleExport()} title="Export CSV">
              <FileUp className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["shipments"], type: "active" })} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <PermissionGuard permission="transaction.shipment.create">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-2 px-3 font-semibold"
              onClick={() => router.push("/transactions/shipment/bulk-import")}
              title="Bulk import from Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Bulk import
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-8 gap-2 px-3 font-semibold"
              onClick={handleCreate}
              title="Create shipment booking"
            >
              <FilePlus className="h-4 w-4" />
              Create Booking
            </Button>
          </div>
        </PermissionGuard>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[1500px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">AWB No</TableHead>
              <TableHead className="font-semibold text-primary-foreground">E-waybill</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Book Date</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Customer</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Shipper</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Consignee</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Origin</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Destination</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Product</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Payment</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Status</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Pieces</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Amount</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                  Loading shipment bookings…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                  No shipment bookings found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((shipment, index) => (
                <TableRow key={shipment.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell className="font-medium underline text-primary" onClick={() => handleViewDetails(shipment)}>
                    {shipment.awbNo}
                  </TableCell>
                  <TableCell>{shipment.ewaybillNumber || "—"}</TableCell>
                  <TableCell>{shipment.bookDate ? format(new Date(shipment.bookDate), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell>{shipment.customer?.name || shipment.customer?.code || shipment.customerId}</TableCell>
                  <TableCell>{shipment.shipper?.shipperName || shipment.shipper?.name || "—"}</TableCell>
                  <TableCell>{shipment.consignee?.consigneeName || shipment.consignee?.name || "—"}</TableCell>
                  <TableCell>{shipment.origin || "—"}</TableCell>
                  <TableCell>{shipment.destination || "—"}</TableCell>
                  <TableCell>{shipment.product?.productName || shipment.product?.name || "—"}</TableCell>
                  <TableCell>{shipment.paymentType || "—"}</TableCell>
                  <TableCell>{shipment.currentStatus || "—"}</TableCell>
                  <TableCell>{shipment.pieces ?? "—"}</TableCell>
                  <TableCell>{shipment.totalAmount != null ? String(shipment.totalAmount) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <PermissionGuard permission="transaction.shipment.update">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(shipment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleViewDetails(shipment)}>
                        <Search className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}
