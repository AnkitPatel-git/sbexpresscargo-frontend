"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { shipmentService } from "@/services/transactions/shipment-service";
import type { Shipment, ShipmentStatus } from "@/types/transactions/shipment";

function labelDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd-MM-yyyy HH:mm");
}

export default function CustomerShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = Number(params.id);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer-shipment", shipmentId],
    queryFn: () => shipmentService.getShipmentById(shipmentId),
    enabled: Number.isInteger(shipmentId) && shipmentId > 0,
  });
  const shipment = data?.data as Shipment | undefined;
  const statuses = (shipment?.statuses ?? []) as ShipmentStatus[];
  const podStatus = [...statuses].reverse().find((row) => row.podFilePath?.trim());

  const podDownload = useMutation({
    mutationFn: () => shipmentService.downloadUploadedPodProof(shipmentId),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => toast.error(error.message || "Failed to open POD"),
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !shipment) {
    return <p className="text-sm text-muted-foreground">Shipment not found.</p>;
  }

  const facts = [
    ["AWB", shipment.awbNo],
    ["Book date", labelDate(shipment.bookDate)],
    ["Reference", shipment.referenceNo || "—"],
    ["Status", shipment.currentStatus || "—"],
    ["Shipper", shipment.shipper?.shipperName || shipment.shipper?.name || "—"],
    ["Consignee", shipment.consignee?.name || "—"],
    ["Origin", shipment.origin || shipment.shipper?.serviceablePincode?.cityName || "—"],
    ["Destination", shipment.destination || shipment.consignee?.serviceablePincode?.cityName || "—"],
    ["Product", shipment.product?.productName || "—"],
    ["Pieces", shipment.pieces ?? "—"],
    ["Actual weight", shipment.declaredWeight ?? "—"],
    ["Invoice no.", shipment.invoiceNumber || "—"],
    ["Invoice value", shipment.shipmentTotalValue ?? "—"],
    ["E-waybill", shipment.ewaybillNumber || "—"],
    ["Payment", shipment.paymentType || "—"],
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{shipment.awbNo}</h1>
          <p className="text-sm text-muted-foreground">{shipment.currentStatus}</p>
        </div>
        <div className="flex gap-2">
          {podStatus ? (
            <Button type="button" variant="outline" onClick={() => podDownload.mutate()} disabled={podDownload.isPending}>
              Company stamp
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/customer/shipments">Back</Link>
          </Button>
        </div>
      </div>
      <dl className="grid gap-3 rounded-md border bg-white p-4 sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm">{String(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="rounded-md border bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Status</h2>
        {statuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scans yet.</p>
        ) : (
          <ol className="space-y-3">
            {statuses.map((row) => (
              <li key={row.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm font-medium">{row.status}</p>
                <p className="text-xs text-muted-foreground">
                  {labelDate(row.scannedAt || row.createdAt)}
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
  );
}
