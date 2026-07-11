"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { SHIPMENT_CHARGE } from "@/lib/portal-permissions";
import { GST_PERCENT, gstOnTotal, grandTotalWithGst } from "@/lib/gst";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { optionLabelForSelect } from "@/lib/select-closed-label";
import { shipmentService } from "@/services/transactions/shipment-service";
import { SHIPMENT_STATUS_OPTIONS } from "@/lib/shipment-status-options";
import { formatShipmentStatusLabel } from "@/lib/shipment-status-label";
import { SHIPMENT_SUB_STATUS_CODES } from "@/lib/shipment-sub-status-codes";
import {
  formatShipmentPaymentTypeLabel,
  SHIPMENT_COD_TOPAY_LABEL,
} from "@/lib/shipment-payment-label";
import type { Shipment, ShipmentCharge, ShipmentStatus } from "@/types/transactions/shipment";

const fallbackText = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

function statusCreatorLabel(status: ShipmentStatus): string | null {
  const username =
    status.createdBy?.username?.trim() ||
    status.user?.username?.trim() ||
    null;
  if (username) return username;
  const source = status.source?.trim().toUpperCase();
  if (source === "CARRIER") return "carrier";
  if (source === "CORE" || source === "SYSTEM") return "system";
  return null;
}

function chargeRowLabel(row: ShipmentCharge) {
  return row.description?.trim() || row.chargeType?.trim() || (row.chargeId ? `Charge #${row.chargeId}` : "Charge");
}

function isFuelChargeRow(row: ShipmentCharge): boolean {
  const label = `${row.description ?? ""} ${row.chargeType ?? ""}`.toUpperCase();
  return label.includes("FUEL");
}

export default function ShipmentDetailsPage() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [statusValue, setStatusValue] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusLocation, setStatusLocation] = useState("");
  const [statusSubStatus, setStatusSubStatus] = useState("");
  const [statusScannedAt, setStatusScannedAt] = useState("");
  const [podRemark, setPodRemark] = useState("");
  const [podFile, setPodFile] = useState<File | null>(null);
  const [markDeliveredWithPod, setMarkDeliveredWithPod] = useState(true);
  const [kycType, setKycType] = useState("AADHAAR");
  const [kycEntryType, setKycEntryType] = useState("ID_PROOF");
  const [kycEntryDate, setKycEntryDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data: shipmentResponse, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentService.getShipmentById(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const statusMutation = useMutation({
    mutationFn: () => {
      if (statusValue === "DELIVERY_ATTEMPTED" && !statusSubStatus.trim()) {
        return Promise.reject(
          new Error("NDR / reason code is required when status is Delivery attempted"),
        );
      }
      return shipmentService.updateShipmentStatus(id, {
        status: statusValue,
        version: shipmentResponse?.data.version ?? 1,
        reason: statusReason || undefined,
        location: statusLocation.trim() || undefined,
        subStatus: statusSubStatus.trim() || undefined,
        scannedAt: statusScannedAt
          ? new Date(statusScannedAt).toISOString()
          : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      toast.success("Shipment booking status updated");
      setStatusReason("");
      setStatusLocation("");
      setStatusSubStatus("");
      setStatusScannedAt("");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update shipment booking status"),
  });

  const labelDownloadMutation = useMutation({
    mutationFn: (awbNo: string) =>
      shipmentService.downloadShippingLabel(awbNo, { regenerate: true }),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Shipping label downloaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to download shipping label"),
  });

  const podBlankFormDownloadMutation = useMutation({
    mutationFn: () => shipmentService.downloadPodBlankForm(id),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("DRS form downloaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to download DRS form"),
  });

  const podProofDownloadMutation = useMutation({
    mutationFn: () => shipmentService.downloadUploadedPodProof(id),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("POD downloaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to download POD"),
  });

  const podUploadMutation = useMutation({
    mutationFn: () => {
      if (!podFile) {
        return Promise.reject(new Error("Choose a POD file (PDF or image)"));
      }
      return shipmentService.uploadPodProof(id, podFile, {
        remark: podRemark || undefined,
        markDelivered: markDeliveredWithPod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      toast.success("POD uploaded");
      setPodFile(null);
      setPodRemark("");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to upload POD"),
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
  const appliedCharges = useMemo(() => shipment?.charges ?? [], [shipment?.charges]);
  const kycDocuments = shipment?.kycDocuments ?? [];
  const statuses = useMemo(() => shipment?.statuses ?? [], [shipment?.statuses]);

  const nonFuelCharges = useMemo(
    () => appliedCharges.filter((row) => !isFuelChargeRow(row)),
    [appliedCharges],
  );
  const fuelChargeTotal = useMemo(
    () =>
      appliedCharges
        .filter((row) => isFuelChargeRow(row))
        .reduce((sum, row) => sum + (Number(row.total ?? row.amount) || 0), 0),
    [appliedCharges],
  );
  const ancillaryChargesTotal = useMemo(
    () =>
      nonFuelCharges.reduce(
        (sum, row) => sum + (Number(row.total ?? row.amount) || 0),
        0,
      ),
    [nonFuelCharges],
  );
  const subTotalWithoutFuel = useMemo(() => {
    const baseFreight = Number(shipment?.baseFreight) || 0;
    return baseFreight + ancillaryChargesTotal;
  }, [shipment?.baseFreight, ancillaryChargesTotal]);

  const currentStatus = useMemo(
    () => shipment?.currentStatus || statuses[statuses.length - 1]?.status || "—",
    [statuses, shipment?.currentStatus],
  );

  const hasUploadedPod = useMemo(
    () => statuses.some((s) => Boolean(s.podFilePath?.trim())),
    [statuses],
  );

  useEffect(() => {
    if (shipment?.currentStatus) {
      setStatusValue(shipment.currentStatus);
    }
  }, [shipment?.currentStatus]);

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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => podProofDownloadMutation.mutate()}
            disabled={!hasUploadedPod || podProofDownloadMutation.isPending}
          >
            {podProofDownloadMutation.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="mr-1 h-4 w-4" />
                Download pod
              </>
            )}
          </Button>
          <PermissionGuard permission="transaction.pod.download">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => podBlankFormDownloadMutation.mutate()}
              disabled={podBlankFormDownloadMutation.isPending}
            >
              {podBlankFormDownloadMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Downloading…
                </>
              ) : (
                <>
                  <Download className="mr-1 h-4 w-4" />
                  Download DRS
                </>
              )}
            </Button>
          </PermissionGuard>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => labelDownloadMutation.mutate(shipment.awbNo)}
            disabled={!shipment.awbNo?.trim() || labelDownloadMutation.isPending}
          >
            {labelDownloadMutation.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Downloading…
              </>
            ) : (
              <>
                <Download className="mr-1 h-4 w-4" />
                Shipment Label
              </>
            )}
          </Button>
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
          <p><span className="text-muted-foreground">Payment Type:</span> {formatShipmentPaymentTypeLabel(shipment.paymentType)}</p>
          <p><span className="text-muted-foreground">Currency:</span> INR</p>
          <p><span className="text-muted-foreground">{SHIPMENT_COD_TOPAY_LABEL}:</span> {shipment.isCod ? `Yes (${fallbackText(shipment.codAmount)})` : "No"}</p>
          <PermissionGuard permission={SHIPMENT_CHARGE.read}>
            <p><span className="text-muted-foreground">Base Freight:</span> {fallbackText(shipment.baseFreight)}</p>
            <p><span className="text-muted-foreground">Total Amount:</span> {fallbackText(shipment.totalAmount)}</p>
          </PermissionGuard>
        </FormSection>

        <FormSection title="Weight & Pieces" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Pieces:</span> {fallbackText(shipment.pieces)}</p>
          <p><span className="text-muted-foreground">Declared Weight:</span> {fallbackText(shipment.declaredWeight)}</p>
          <p><span className="text-muted-foreground">Charge Weight:</span> {fallbackText(shipment.chargeWeight)}</p>
          <p><span className="text-muted-foreground">Vendor Vol. Weight:</span> {fallbackText(shipment.vendorTotalVolWeight)}</p>
          <p><span className="text-muted-foreground">Vendor Chg. Weight:</span> {fallbackText(shipment.vendorTotalChargeableWeight)}</p>
          <p><span className="text-muted-foreground">Booking Value:</span> {fallbackText(shipment.shipmentTotalValue)}</p>
          <p><span className="text-muted-foreground">Vendor Pickup:</span> {shipment.vendorPickup ? "Yes" : "No"}</p>
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
            statuses.map((status) => {
              const creator = statusCreatorLabel(status);
              return (
                <div key={status.id} className="rounded-md border border-border bg-muted/20 p-3">
                  <p className="font-medium">{formatShipmentStatusLabel(status.status)}</p>
                  {creator ? (
                    <p className="text-xs text-muted-foreground">by {creator}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{status.remark || "—"}</p>
                </div>
              );
            })
          )}
        </FormSection>

        <PermissionGuard permission={SHIPMENT_CHARGE.read}>
        <FormSection title="Applied Charge" contentClassName="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Base Freight:</span> {fallbackText(shipment.baseFreight)}</p>
          <p><span className="text-muted-foreground">Sub Total (without fuel):</span> {fallbackText(subTotalWithoutFuel)}</p>
          {fuelChargeTotal > 0 ? (
            <p><span className="text-muted-foreground">Fuel:</span> {fallbackText(fuelChargeTotal)}</p>
          ) : null}
          <p><span className="text-muted-foreground">Total Amount:</span> {fallbackText(shipment.totalAmount)}</p>
          <p><span className="text-muted-foreground">GST ({GST_PERCENT}%):</span> {fallbackText(gstOnTotal(shipment.totalAmount))}</p>
          <p><span className="text-muted-foreground">Grand Total:</span> {fallbackText(grandTotalWithGst(shipment.totalAmount))}</p>
          {appliedCharges.length > 0 ? (
            <div className="space-y-1 pt-2">
              {appliedCharges.map((row, index) => (
                <div key={row.id ?? `${chargeRowLabel(row)}-${index}`} className="rounded-md border border-border bg-muted/20 p-2 text-xs">
                  <div className="font-medium">{chargeRowLabel(row)}</div>
                  <div className="text-muted-foreground">
                    Amount: {fallbackText(row.amount)} | Total: {fallbackText(row.total ?? row.amount)}
                    {row.fuelApply ? " | Fuel applied" : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No applied shipment charges on this booking.</p>
          )}
        </FormSection>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FormSection title="Update Status" contentClassName="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentStatus}</span>
          </p>
          <Select value={statusValue || undefined} onValueChange={setStatusValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select status">
                {optionLabelForSelect(statusValue, SHIPMENT_STATUS_OPTIONS)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SHIPMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Reason / remark" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
          <div className="space-y-1">
            <Label htmlFor="status-scanned-at" className="text-xs font-medium">
              Scanned at (optional)
            </Label>
            <Input
              id="status-scanned-at"
              type="datetime-local"
              value={statusScannedAt}
              onChange={(e) => setStatusScannedAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status-location" className="text-xs font-medium">
              Location (optional)
            </Label>
            <Input
              id="status-location"
              placeholder="Hub, city, or PIN area"
              value={statusLocation}
              onChange={(e) => setStatusLocation(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status-sub-status" className="text-xs font-medium">
              {statusValue === "DELIVERY_ATTEMPTED"
                ? "NDR / reason code"
                : "Sub-status (optional)"}
            </Label>
            <Select value={statusSubStatus || undefined} onValueChange={setStatusSubStatus}>
              <SelectTrigger id="status-sub-status">
                <SelectValue
                  placeholder={
                    statusValue === "DELIVERY_ATTEMPTED"
                      ? "Select reason code"
                      : "Select sub-status (optional)"
                  }
                >
                  {statusSubStatus ? statusSubStatus.replace(/_/g, " ") : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SHIPMENT_SUB_STATUS_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => statusMutation.mutate()}
            disabled={
              statusMutation.isPending ||
              !statusValue ||
              (statusValue === "DELIVERY_ATTEMPTED" && !statusSubStatus.trim())
            }
          >
            Update Status
          </Button>
        </FormSection>

        <FormSection title="Proof of delivery (POD)" contentClassName="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Upload a signed or vendor POD scan. Use Download DRS above for the blank delivery receipt form.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => podProofDownloadMutation.mutate()}
            disabled={!hasUploadedPod || podProofDownloadMutation.isPending}
          >
            {podProofDownloadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Downloading…
              </>
            ) : (
              "Download last uploaded POD"
            )}
          </Button>
          {!hasUploadedPod ? (
            <p className="text-xs text-muted-foreground">No POD file has been uploaded for this shipment yet.</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="pod-file">Upload signed / vendor POD</Label>
            <Input
              id="pod-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              onChange={(e) => setPodFile(e.target.files?.[0] ?? null)}
            />
            {podFile ? <p className="text-xs text-muted-foreground">Selected: {podFile.name}</p> : null}
          </div>
          <Input placeholder="Delivery remark (optional)" value={podRemark} onChange={(e) => setPodRemark(e.target.value)} />
          <div className="flex items-start gap-2">
            <Checkbox
              id="pod-mark-delivered"
              checked={markDeliveredWithPod}
              onCheckedChange={(v) => setMarkDeliveredWithPod(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="pod-mark-delivered" className="text-xs font-normal leading-snug cursor-pointer">
              Record shipment as delivered and attach this file as POD (uncheck to only store the file).
            </Label>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => podUploadMutation.mutate()}
            disabled={podUploadMutation.isPending || !podFile}
          >
            {podUploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload POD"
            )}
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
          <p>
            <span className="text-muted-foreground">Forwarding Date:</span>{" "}
            {shipment.forwarding?.forwardingDate
              ? format(new Date(shipment.forwarding.forwardingDate), "dd/MM/yyyy")
              : "—"}
          </p>
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
