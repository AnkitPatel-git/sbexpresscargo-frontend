"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackingService } from "@/services/transactions/tracking-service";
import type { TrackingDetailResponse } from "@/types/transactions/tracking";

export default function CustomerTrackingPage() {
  const [awbNo, setAwbNo] = useState("");
  const [detail, setDetail] = useState<TrackingDetailResponse["data"] | null>(null);

  const search = useMutation({
    mutationFn: () => trackingService.getTrackingByAwb(awbNo.trim()),
    onSuccess: (response) => setDetail(response.data),
  });

  const shipment = detail?.shipmentDetails;
  const timeline = detail?.statusDetails ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Track</h1>
        <p className="text-sm text-muted-foreground">Check status for one of your AWBs.</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!awbNo.trim()) return;
          setDetail(null);
          search.mutate();
        }}
      >
        <Input value={awbNo} onChange={(event) => setAwbNo(event.target.value)} placeholder="SB AWB number" />
        <Button type="submit" disabled={search.isPending}>
          {search.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
        </Button>
      </form>
      {search.isError ? (
        <p className="text-sm text-red-600">{search.error instanceof Error ? search.error.message : "AWB not found"}</p>
      ) : null}
      {detail && shipment ? (
        <div className="space-y-4">
          <dl className="grid gap-3 rounded-md border bg-white p-4 sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">AWB</dt><dd className="text-sm">{detail.awbNo}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="text-sm">{detail.currentStatus || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Origin</dt><dd className="text-sm">{shipment.origin || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Destination</dt><dd className="text-sm">{shipment.destination || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Product</dt><dd className="text-sm">{shipment.product || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Pieces</dt><dd className="text-sm">{shipment.pcs ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Actual weight</dt><dd className="text-sm">{shipment.weight || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Reference</dt><dd className="text-sm">{shipment.refNo || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Invoice</dt><dd className="text-sm">{shipment.invoiceNo || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Expected delivery</dt><dd className="text-sm">{detail.expectedDeliveryDate || "—"}</dd></div>
          </dl>
          <div className="rounded-md border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Status</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans yet.</p>
            ) : (
              <ol className="space-y-3">
                {timeline.map((row, index) => (
                  <li key={`${row.status}-${index}`} className="border-l-2 border-primary/30 pl-3">
                    <p className="text-sm font-medium">{row.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.eventAt || row.date || "—"}
                      {row.location ? ` · ${row.location}` : ""}
                      {row.receiverName ? ` · ${row.receiverName}` : ""}
                    </p>
                    {row.remark ? <p className="text-xs">{row.remark}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
