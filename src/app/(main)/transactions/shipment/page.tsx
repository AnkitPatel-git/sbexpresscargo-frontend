"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, FilePlus, FileUp, Filter, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { customerService } from "@/services/masters/customer-service";
import { shipmentService } from "@/services/transactions/shipment-service";
import type { Shipment } from "@/types/transactions/shipment";

type ShipmentFilters = {
  awbNo: string;
  ewaybillNumber: string;
  clientName: string;
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
  origin: "",
  destination: "",
  paymentType: "",
  bookDateFrom: "",
  bookDateTo: "",
};

export default function ShipmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ShipmentFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<ShipmentFilters>(defaultFilters);

  const { data: customerData } = useQuery({
    queryKey: ["shipment-client-options"],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });

  useEffect(() => {
    if (filtersOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [appliedFilters, filtersOpen]);

  const listParams = {
    page,
    limit,
    sortBy: "id",
    sortOrder: "desc" as const,
    ...Object.fromEntries(
      Object.entries(appliedFilters).map(([key, value]) => [key, value.trim() ? value : undefined]),
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
      toast.success("Shiment bookings exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export shiment bookings");
    }
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Shiment Booking</h1>
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
                <DialogTitle>Shiment Booking Filters</DialogTitle>
                <DialogDescription>Choose one or more filters, then apply them to the shiment booking list.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="AWB no" value={draftFilters.awbNo} onChange={(e) => setDraftFilters((prev) => ({ ...prev, awbNo: e.target.value }))} />
                <Input placeholder="E-waybill no" value={draftFilters.ewaybillNumber} onChange={(e) => setDraftFilters((prev) => ({ ...prev, ewaybillNumber: e.target.value }))} />
                <div className="sm:col-span-2">
                  <Combobox
                    className="w-full"
                    placeholder="Select client"
                    searchPlaceholder="Search client..."
                    emptyMessage="No client found."
                    value={draftFilters.clientName}
                    onChange={(value) => setDraftFilters((prev) => ({ ...prev, clientName: String(value || "") }))}
                    options={(customerData?.data ?? []).map((customer) => ({
                      value: customer.name,
                      label: customer.code ? `${customer.code} - ${customer.name}` : customer.name,
                    }))}
                  />
                </div>
                <Input placeholder="Payment type" value={draftFilters.paymentType} onChange={(e) => setDraftFilters((prev) => ({ ...prev, paymentType: e.target.value }))} />
                <Input placeholder="Origin" value={draftFilters.origin} onChange={(e) => setDraftFilters((prev) => ({ ...prev, origin: e.target.value }))} />
                <Input placeholder="Destination" value={draftFilters.destination} onChange={(e) => setDraftFilters((prev) => ({ ...prev, destination: e.target.value }))} />
                <Input type="date" value={draftFilters.bookDateFrom} onChange={(e) => setDraftFilters((prev) => ({ ...prev, bookDateFrom: e.target.value }))} />
                <Input type="date" value={draftFilters.bookDateTo} onChange={(e) => setDraftFilters((prev) => ({ ...prev, bookDateTo: e.target.value }))} />
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
          <Button
            type="button"
            variant="default"
            className="h-8 gap-2 px-3 font-semibold"
            onClick={handleCreate}
            title="Create shiment booking"
          >
            <FilePlus className="h-4 w-4" />
            Create Booking
          </Button>
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
                  Loading shiment bookings…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                  No shiment bookings found.
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
