"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

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
import { useAuth } from "@/context/auth-context";
import { shipmentService } from "@/services/transactions/shipment-service";
import type { Shipment } from "@/types/transactions/shipment";

function labelDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd-MM-yyyy");
}

export default function CustomerShipmentsPage() {
  const { effectiveCustomerIds } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-shipments", page, search, customerId],
    queryFn: () =>
      shipmentService.getShipments({
        page,
        limit: 20,
        search,
        ...(customerId !== "all" ? { customerId: Number(customerId) } : {}),
      }),
  });

  const rows = (data?.data ?? []) as Shipment[];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My shipments</h1>
          <p className="text-sm text-muted-foreground">Bookings for your account.</p>
        </div>
        <Button asChild>
          <Link href="/customer/shipments/create">Book shipment</Link>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search AWB or reference"
          className="max-w-xs"
        />
        {effectiveCustomerIds.length > 1 && (
          <select
            className="h-9 rounded-md border bg-white px-2 text-sm"
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All accounts</option>
            {effectiveCustomerIds.map((id) => (
              <option key={id} value={id}>
                Customer {id}
              </option>
            ))}
          </select>
        )}
      </div>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-600">{error instanceof Error ? error.message : "Failed to load shipments"}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AWB</TableHead>
                <TableHead>Book date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Shipper</TableHead>
                <TableHead>Consignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pieces</TableHead>
                <TableHead>Actual weight</TableHead>
                <TableHead>Invoice value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No shipments found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link className="font-medium text-primary hover:underline" href={`/customer/shipments/${row.id}`}>
                        {row.awbNo}
                      </Link>
                    </TableCell>
                    <TableCell>{labelDate(row.bookDate)}</TableCell>
                    <TableCell>{row.referenceNo || "—"}</TableCell>
                    <TableCell>{row.shipper?.shipperName || row.shipper?.name || "—"}</TableCell>
                    <TableCell>{row.consignee?.name || "—"}</TableCell>
                    <TableCell>{row.currentStatus || "—"}</TableCell>
                    <TableCell>{row.pieces ?? "—"}</TableCell>
                    <TableCell>{row.declaredWeight ?? "—"}</TableCell>
                    <TableCell>{row.shipmentTotalValue ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
