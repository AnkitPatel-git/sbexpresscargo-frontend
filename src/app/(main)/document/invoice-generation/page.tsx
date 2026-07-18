"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { MASTER_READ, hasMasterLookupForPortalTransaction } from "@/lib/portal-permissions";
import { optionLabelForSelect } from "@/lib/select-closed-label";
import { customerService } from "@/services/masters/customer-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { invoiceService } from "@/services/document/invoice-service";
import type {
  InvoiceGenerateResult,
  InvoiceGenerationPayload,
  InvoicePreviewResult,
} from "@/types/document/invoice";

function currentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = now.getMonth() >= 3 ? year : year - 1;
  const end = start + 1;
  return `${String(start).slice(-2)}-${String(end).slice(-2)}`;
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const defaultPayload: InvoiceGenerationPayload = {
  year: currentFinancialYear(),
  fromDate: "",
  toDate: "",
  showAwb: true,
};

type ResultMode = "preview" | "generate" | null;

export default function InvoiceGenerationPage() {
  const { hasPermission, isLoading: authLoading } = useAuth();
  const [form, setForm] = useState<InvoiceGenerationPayload>(defaultPayload);
  const [customerSearch, setCustomerSearch] = useState("");
  const [preview, setPreview] = useState<InvoicePreviewResult | null>(null);
  const [generated, setGenerated] = useState<InvoiceGenerateResult | null>(null);
  const [resultMode, setResultMode] = useState<ResultMode>(null);

  const canReadCustomers = hasMasterLookupForPortalTransaction(
    hasPermission,
    MASTER_READ.customer,
  );
  const canReadServiceCenters = hasMasterLookupForPortalTransaction(
    hasPermission,
    MASTER_READ.serviceCenter,
  );

  const { data: customerData, isFetching: customersLoading } = useQuery({
    queryKey: ["invoice-gen-customers", customerSearch],
    queryFn: () =>
      customerService.getCustomers({
        page: 1,
        limit: 50,
        search: customerSearch,
        sortBy: "code",
        sortOrder: "asc",
      }),
    enabled: !authLoading && canReadCustomers,
  });

  const { data: serviceCenterData } = useQuery({
    queryKey: ["invoice-gen-service-centers"],
    queryFn: () =>
      serviceCenterService.getServiceCenters({
        page: 1,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
      }),
    enabled: !authLoading && canReadServiceCenters,
  });

  const customerOptions = useMemo(
    () =>
      (customerData?.data ?? []).map((customer) => ({
        value: String(customer.id),
        label: customer.code ? `${customer.code} - ${customer.name}` : customer.name,
      })),
    [customerData?.data],
  );

  const serviceCenterOptions = useMemo(
    () =>
      (serviceCenterData?.data ?? []).map((center) => ({
        value: String(center.id),
        label: center.code ? `${center.code} - ${center.name}` : center.name,
      })),
    [serviceCenterData?.data],
  );

  const previewMutation = useMutation({
    mutationFn: (payload: InvoiceGenerationPayload) => invoiceService.previewInvoices(payload),
    onSuccess: (response) => {
      setGenerated(null);
      setPreview(response.data as InvoicePreviewResult);
      setResultMode("preview");
      toast.success("Invoice preview ready");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to preview invoices"),
  });

  const generateMutation = useMutation({
    mutationFn: (payload: InvoiceGenerationPayload) => invoiceService.generateInvoices(payload),
    onSuccess: (response) => {
      const data = response.data as InvoiceGenerateResult;
      setPreview(null);
      setGenerated(data);
      setResultMode("generate");
      if (data.createdInvoiceId) {
        toast.success(`Invoice ${data.invoiceNo ?? data.createdInvoiceId} generated`);
      } else if (data.shipmentCount === 0) {
        toast.message("No eligible shipments found for this period");
      } else {
        toast.success("Invoice generation completed");
      }
    },
    onError: (error: Error) => toast.error(error.message || "Failed to generate invoices"),
  });

  const updateField = <K extends keyof InvoiceGenerationPayload>(
    key: K,
    value: InvoiceGenerationPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const sanitizePayload = (): InvoiceGenerationPayload | null => {
    if (!form.year.trim()) {
      toast.error("Financial year is required");
      return null;
    }
    if (!form.fromDate || !form.toDate) {
      toast.error("From date and to date are required");
      return null;
    }
    if (!form.customerId) {
      toast.error("Select a customer");
      return null;
    }
    return {
      year: form.year.trim(),
      fromDate: form.fromDate,
      toDate: form.toDate,
      customerId: Number(form.customerId),
      serviceCenterId: form.serviceCenterId ? Number(form.serviceCenterId) : undefined,
      showAwb: form.showAwb,
    };
  };

  const runPreview = () => {
    const payload = sanitizePayload();
    if (!payload) return;
    previewMutation.mutate(payload);
  };

  const runGenerate = () => {
    const payload = sanitizePayload();
    if (!payload) return;
    generateMutation.mutate(payload);
  };

  const busy = previewMutation.isPending || generateMutation.isPending;
  const summaryTotals =
    resultMode === "preview" && preview
      ? {
          awbCount: preview.awbCount,
          baseAmount: preview.totalAmount,
          fuelAmount: preview.fuelAmount,
          cgst: preview.cgst,
          sgst: preview.sgst,
          igst: preview.igst,
          grandTotal: preview.grandTotal,
        }
      : resultMode === "generate" && generated
        ? {
            awbCount: generated.totals.awbCount,
            baseAmount: generated.totals.baseAmount,
            fuelAmount: generated.totals.fuelAmount,
            cgst: generated.totals.cgst,
            sgst: generated.totals.sgst,
            igst: generated.totals.igst,
            grandTotal: generated.totals.grandTotal,
          }
        : null;

  return (
    <PermissionGuard
      permission="invoice.core.create"
      fallback={
        <div className="rounded-lg border border-border/80 bg-card p-6 text-sm text-muted-foreground">
          You do not have permission to generate invoices.
        </div>
      }
    >
      <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
        <div>
          <h1 className="text-xl font-semibold">Invoice Generation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview and generate a draft invoice for uninvoiced AWBs by{" "}
            <span className="font-medium text-foreground">book date</span> for the
            selected customer and period.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-year">Financial year</Label>
            <Input
              id="invoice-year"
              placeholder="e.g. 25-26"
              value={form.year}
              onChange={(e) => updateField("year", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-from">From date</Label>
            <Input
              id="invoice-from"
              type="date"
              value={form.fromDate}
              onChange={(e) => updateField("fromDate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-to">To date</Label>
            <Input
              id="invoice-to"
              type="date"
              value={form.toDate}
              onChange={(e) => updateField("toDate", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Combobox
              options={customerOptions}
              value={form.customerId ? String(form.customerId) : ""}
              onChange={(value) =>
                updateField("customerId", value ? Number(value) : undefined)
              }
              placeholder="Select customer"
              searchPlaceholder="Search customer..."
              searchValue={customerSearch}
              onSearchValueChange={setCustomerSearch}
              isSearching={customersLoading}
              emptyMessage="No customers found"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Service center</Label>
            <Select
              value={form.serviceCenterId ? String(form.serviceCenterId) : "ALL"}
              onValueChange={(value) =>
                updateField(
                  "serviceCenterId",
                  value === "ALL" ? undefined : Number(value),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All service centers">
                  {form.serviceCenterId
                    ? optionLabelForSelect(String(form.serviceCenterId), serviceCenterOptions)
                    : "All service centers"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All service centers</SelectItem>
                {serviceCenterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-border"
                checked={!!form.showAwb}
                onChange={(e) => updateField("showAwb", e.target.checked)}
              />
              Include AWB list in preview
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={runPreview} disabled={busy}>
            {previewMutation.isPending ? "Previewing..." : "Preview"}
          </Button>
          <Button type="button" onClick={runGenerate} disabled={busy}>
            {generateMutation.isPending ? "Generating..." : "Generate invoice"}
          </Button>
        </div>

        {summaryTotals && (
          <div className="space-y-3 rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {resultMode === "preview" ? "Preview summary" : "Generated invoice"}
                </p>
                {resultMode === "generate" && generated?.createdInvoiceId ? (
                  <p className="text-sm text-muted-foreground">
                    Invoice No:{" "}
                    <span className="font-medium text-foreground">
                      {generated.invoiceNo ?? generated.createdInvoiceId}
                    </span>
                    {" · "}
                    ID {generated.createdInvoiceId}
                    {" · "}
                    {generated.shipmentCount} shipment
                    {generated.shipmentCount === 1 ? "" : "s"} linked
                  </p>
                ) : resultMode === "generate" ? (
                  <p className="text-sm text-muted-foreground">
                    No new invoice was created (no eligible shipments or already exists for this period).
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Totals for uninvoiced shipments in the selected period.
                  </p>
                )}
              </div>
              {resultMode === "generate" && generated?.createdInvoiceId ? (
                <div className="flex flex-wrap gap-2">
                  <Button asChild type="button" variant="outline" size="sm">
                    <Link href="/document/invoice-print">Open invoice print</Link>
                  </Button>
                  <Button asChild type="button" size="sm">
                    <Link href="/document/invoice-finalise">Finalise / lock</Link>
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              {[
                { label: "AWB count", value: String(summaryTotals.awbCount) },
                { label: "Base amount", value: formatMoney(summaryTotals.baseAmount) },
                { label: "Fuel", value: formatMoney(summaryTotals.fuelAmount) },
                { label: "CGST", value: formatMoney(summaryTotals.cgst) },
                { label: "SGST", value: formatMoney(summaryTotals.sgst) },
                { label: "IGST", value: formatMoney(summaryTotals.igst) },
                { label: "Grand total", value: formatMoney(summaryTotals.grandTotal) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-border/70 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold tabular-nums">{item.value}</p>
                </div>
              ))}
            </div>

            {resultMode === "preview" && preview?.awbLines && preview.awbLines.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground">#</TableHead>
                      <TableHead className="text-primary-foreground">AWB No</TableHead>
                      <TableHead className="text-primary-foreground">Book date</TableHead>
                      <TableHead className="text-primary-foreground">Shipment ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.awbLines.map((line, index) => (
                      <TableRow key={line.shipmentId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {line.awbNo ?? "—"}
                        </TableCell>
                        <TableCell>
                          {line.bookDate
                            ? formatDateTime(line.bookDate).split(",")[0]
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/transactions/shipment/${line.shipmentId}`}
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {line.shipmentId}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
