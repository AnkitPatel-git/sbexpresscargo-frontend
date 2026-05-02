"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shipmentService } from "@/services/transactions/shipment-service";
import type { Shipment } from "@/types/transactions/shipment";

const fallbackText = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

function buildCalculationPayload(shipment: Shipment) {
  const actualWeight = Math.max(0, Number(shipment.declaredWeight ?? 0));
  const volumetricWeight = Math.round(
    (shipment.piecesRows || []).reduce(
      (sum, row) => sum + (Number(row.volumetricWeight) || 0),
      0,
    ),
  );
  const chargeWeight = Math.max(actualWeight, volumetricWeight);
  return {
    awbNo: shipment.awbNo,
    ewaybillNumber: shipment.ewaybillNumber || undefined,
    bookDate: shipment.bookDate,
    bookTime: shipment.bookTime,
    referenceNo: shipment.referenceNo,
    customerId: shipment.customerId,
    clientId: shipment.customerId,
    shipperId: shipment.shipperId || undefined,
    consigneeId: shipment.consigneeId || undefined,
    shipper: shipment.shipper
      ? {
          shipperCode: shipment.shipper.shipperCode || shipment.shipper.name || "",
          shipperName: shipment.shipper.shipperName || shipment.shipper.name || "",
        }
      : undefined,
    consignee: shipment.consignee
      ? {
          code: shipment.consignee.code || shipment.consignee.consigneeName || "",
          name: shipment.consignee.consigneeName || shipment.consignee.name || "",
        }
      : undefined,
    productId: shipment.productId,
    fromZoneId: shipment.fromZoneId ?? undefined,
    toZoneId: shipment.toZoneId ?? undefined,
    shipmentTotalValue: shipment.shipmentTotalValue ?? shipment.totalAmount ?? undefined,
    actualWeight,
    volumetricWeight,
    chargeWeight,
    reversePickup: shipment.reversePickup ?? false,
    appointmentDelivery: shipment.appointmentDelivery ?? false,
    floorDelivery: shipment.floorDelivery ?? false,
    floorCount: shipment.floorCount ?? undefined,
    km: shipment.km ?? undefined,
    isEdl: shipment.isEdl ?? false,
    odaEdlDistanceKm:
      shipment.odaEdlDistanceKm != null && shipment.odaEdlDistanceKm !== ""
        ? Number(shipment.odaEdlDistanceKm)
        : undefined,
    commercial: shipment.commercial ?? false,
    paymentType: shipment.paymentType,
    instruction: shipment.instruction || undefined,
    serviceCenterId: shipment.serviceCenterId ?? undefined,
    isCod: shipment.isCod,
    codAmount: shipment.codAmount ?? undefined,
    piecesRows: (shipment.piecesRows || []).map((row) => ({
      actualWeight: Number(row.actualWeight) || 0,
      pieces: Number(row.pieces) || 0,
      length: row.length ?? undefined,
      breadth: row.breadth ?? undefined,
      height: row.height ?? undefined,
      division: row.division ?? undefined,
      volumetricWeight: row.volumetricWeight ?? undefined,
      chargeWeight: row.chargeWeight ?? undefined,
      items: (row.items || []).map((item) => ({
        contentId: Number(item.contentId) || 0,
        quantity: item.quantity ?? undefined,
        measureValue: item.measureValue ?? undefined,
        measureUnit: item.measureUnit ?? undefined,
        totalValue: item.totalValue ?? undefined,
        invoiceDate: item.invoiceDate ?? undefined,
        invoiceNumber: item.invoiceNumber ?? undefined,
      })),
    })),
    charges: shipment.charges || [],
  };
}

export default function ShipmentDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [statusValue, setStatusValue] = useState("CREATED");
  const [statusReason, setStatusReason] = useState("");
  const [podPath, setPodPath] = useState("");
  const [kycType, setKycType] = useState("AADHAAR");
  const [kycEntryType, setKycEntryType] = useState("ID_PROOF");
  const [kycEntryDate, setKycEntryDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data: shipmentResponse, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentService.getShipmentById(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const calcMutation = useMutation({
    mutationFn: () => shipmentService.calculateCharges(buildCalculationPayload(shipmentResponse!.data)),
    onSuccess: () => {
      toast.success("Charges calculated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to calculate charges"),
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      shipmentService.updateShipmentStatus(id, {
        status: statusValue,
        version: shipmentResponse?.data.version ?? 1,
        reason: statusReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      toast.success("Shipment booking status updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update shipment booking status"),
  });

  const podMutation = useMutation({
    mutationFn: () => shipmentService.addPod(id, podPath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      toast.success("POD saved");
      setPodPath("");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save POD"),
  });

  const kycMutation = useMutation({
    mutationFn: () =>
      shipmentService.uploadKyc(id, {
        type: kycType,
        entryType: kycEntryType,
        entryDate: kycEntryDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      toast.success("KYC saved");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to save KYC"),
  });

  const shipment = shipmentResponse?.data;
  const kycDocuments = shipment?.kycDocuments ?? [];
  const calcResult = calcMutation.data?.data;
  const statuses = useMemo(() => shipment?.statuses ?? [], [shipment?.statuses]);

  const currentStatus = useMemo(() => statuses[0]?.status || shipment?.currentStatus || "—", [statuses, shipment?.currentStatus]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!shipment?.id) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Shipment booking not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Shipment Booking Details</h1>
          <p className="text-xs text-muted-foreground">AWB: {shipment.awbNo}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <Link href="/transactions/shipment">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild type="button" size="sm">
            <Link href={`/transactions/shipment/${shipment.id}/edit`}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void calcMutation.mutate()} disabled={calcMutation.isPending}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Calculate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormSection title="Core Details" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">AWB No:</span> {fallbackText(shipment.awbNo)}</p>
          <p><span className="text-muted-foreground">E-waybill:</span> {fallbackText(shipment.ewaybillNumber)}</p>
          <p><span className="text-muted-foreground">Book Date:</span> {shipment.bookDate ? format(new Date(shipment.bookDate), "dd/MM/yyyy") : "—"}</p>
          <p><span className="text-muted-foreground">Book Time:</span> {fallbackText(shipment.bookTime)}</p>
          <p><span className="text-muted-foreground">Reference No:</span> {fallbackText(shipment.referenceNo)}</p>
          <p><span className="text-muted-foreground">Status:</span> {fallbackText(currentStatus)}</p>
        </FormSection>

        <FormSection title="Party & Route" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Customer:</span> {fallbackText(shipment.customer?.name)}</p>
          <p><span className="text-muted-foreground">Shipper:</span> {fallbackText(shipment.shipper?.shipperName || shipment.shipper?.name)}</p>
          <p><span className="text-muted-foreground">Consignee:</span> {fallbackText(shipment.consignee?.consigneeName || shipment.consignee?.name)}</p>
          <p><span className="text-muted-foreground">Origin:</span> {fallbackText(shipment.origin)}</p>
          <p><span className="text-muted-foreground">Destination:</span> {fallbackText(shipment.destination)}</p>
          <p><span className="text-muted-foreground">From zone:</span> {fallbackText(shipment.fromZoneId)}</p>
          <p><span className="text-muted-foreground">To zone:</span> {fallbackText(shipment.toZoneId)}</p>
        </FormSection>

        <FormSection title="Service & Billing" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Product:</span> {fallbackText(shipment.product?.productName || shipment.product?.name)}</p>
          <p><span className="text-muted-foreground">Payment Type:</span> {fallbackText(shipment.paymentType)}</p>
          <p><span className="text-muted-foreground">Currency:</span> INR</p>
          <p><span className="text-muted-foreground">COD:</span> {shipment.isCod ? `Yes (${fallbackText(shipment.codAmount)})` : "No"}</p>
          <p><span className="text-muted-foreground">Base Freight:</span> {fallbackText(shipment.baseFreight)}</p>
          <p><span className="text-muted-foreground">Total Amount:</span> {fallbackText(shipment.totalAmount)}</p>
        </FormSection>

        <FormSection title="Weight & Pieces" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Pieces:</span> {fallbackText(shipment.pieces)}</p>
          <p><span className="text-muted-foreground">Declared Weight:</span> {fallbackText(shipment.declaredWeight)}</p>
          <p><span className="text-muted-foreground">Charge Weight:</span> {fallbackText(shipment.chargeWeight)}</p>
          <p><span className="text-muted-foreground">Booking Value:</span> {fallbackText(shipment.shipmentTotalValue)}</p>
          <p><span className="text-muted-foreground">Commercial:</span> {shipment.commercial ? "Yes" : "No"}</p>
          <p><span className="text-muted-foreground">Reverse Pickup:</span> {shipment.reversePickup ? "Yes" : "No"}</p>
          <p><span className="text-muted-foreground">EDL charges:</span> {shipment.isEdl ? "Yes" : "No"}</p>
          <p><span className="text-muted-foreground">EDL distance (km):</span> {fallbackText(shipment.odaEdlDistanceKm)}</p>
          <p><span className="text-muted-foreground">Floor Delivery:</span> {shipment.floorDelivery ? "Yes" : "No"}</p>
        </FormSection>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FormSection title="Status History" contentClassName="space-y-2 text-sm">
          {statuses.length === 0 ? (
            <p className="text-muted-foreground">No status history found.</p>
          ) : (
            statuses.map((status) => (
              <div key={status.id} className="rounded-md border border-border bg-muted/20 p-3">
                <p className="font-medium">{status.status}</p>
                <p className="text-xs text-muted-foreground">{status.remark || "—"}</p>
              </div>
            ))
          )}
        </FormSection>

        <FormSection title="Charge Preview" contentClassName="space-y-2 text-sm">
          {calcResult ? (
            <>
              <p><span className="text-muted-foreground">Base Freight:</span> {fallbackText(calcResult.baseFreight)}</p>
              <p><span className="text-muted-foreground">Total Charges:</span> {fallbackText(calcResult.totalCharges)}</p>
              <p><span className="text-muted-foreground">Total Amount:</span> {fallbackText(calcResult.totalAmount)}</p>
              <div className="space-y-1 pt-2">
                {calcResult.rows?.map((row, index) => (
                  <div key={`${row.type}-${index}`} className="rounded-md border border-border bg-muted/20 p-2 text-xs">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-muted-foreground">
                      {row.type} | {fallbackText(row.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Use Calculate to fetch the backend charge breakdown.</p>
          )}
        </FormSection>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FormSection title="Update Status" contentClassName="space-y-3 text-sm">
          <Select value={statusValue} onValueChange={setStatusValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {["CREATED", "BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Reason" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
          <Button type="button" className="w-full" onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending}>
            Update Status
          </Button>
        </FormSection>

        <FormSection title="Save POD" contentClassName="space-y-3 text-sm">
          <Input placeholder="POD file path" value={podPath} onChange={(e) => setPodPath(e.target.value)} />
          <Button type="button" className="w-full" onClick={() => podMutation.mutate()} disabled={podMutation.isPending}>
            Save POD
          </Button>
        </FormSection>

        <FormSection title="Add KYC" contentClassName="space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-2">
            <Input placeholder="Type" value={kycType} onChange={(e) => setKycType(e.target.value)} />
            <Input placeholder="Entry Type" value={kycEntryType} onChange={(e) => setKycEntryType(e.target.value)} />
            <Input type="date" value={kycEntryDate} onChange={(e) => setKycEntryDate(e.target.value)} />
          </div>
          <Button type="button" className="w-full" onClick={() => kycMutation.mutate()} disabled={kycMutation.isPending}>
            Save KYC
          </Button>
        </FormSection>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormSection title="Forwarding" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Forwarding AWB:</span> {fallbackText(shipment.forwarding?.forwardingAwb)}</p>
          <p><span className="text-muted-foreground">Vendor:</span> {fallbackText(shipment.forwarding?.deliveryVendorId)}</p>
          <p><span className="text-muted-foreground">Service Map:</span> {fallbackText(shipment.forwarding?.deliveryServiceMapId)}</p>
        </FormSection>
        <FormSection title="KYC Documents" contentClassName="space-y-2 text-sm">
          {kycDocuments.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border/70">
              <div className="grid grid-cols-4 gap-2 border-b border-border/70 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                <div>Type</div>
                <div>Entry Type</div>
                <div>Entry Date</div>
                <div>Document</div>
              </div>
              {kycDocuments.map((doc) => (
                <div key={doc.id} className="grid grid-cols-4 gap-2 border-b border-border/60 px-3 py-2 last:border-b-0">
                  <div>{fallbackText(doc.type)}</div>
                  <div>{fallbackText(doc.entryType)}</div>
                  <div>{doc.entryDate ? format(new Date(doc.entryDate), "dd/MM/yyyy") : "—"}</div>
                  <div className="truncate">{fallbackText(doc.documentPath)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No KYC documents uploaded yet.</p>
          )}
        </FormSection>
      </div>
    </div>
  );
}
