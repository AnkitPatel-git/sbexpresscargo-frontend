"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoiceService } from "@/services/document/invoice-service";
import { InvoiceGenerationPayload } from "@/types/document/invoice";

const defaultPayload: InvoiceGenerationPayload = {
  year: new Date().getFullYear().toString(),
  fromDate: "",
  toDate: "",
  productType: "DOMESTIC",
  billingType: "standard",
  registerType: "REGISTERED",
  showAwb: true,
};

export default function InvoiceGenerationPage() {
  const [form, setForm] = useState<InvoiceGenerationPayload>(defaultPayload);
  const [result, setResult] = useState<unknown>(null);

  const previewMutation = useMutation({
    mutationFn: (payload: InvoiceGenerationPayload) => invoiceService.previewInvoices(payload),
    onSuccess: (response) => {
      setResult(response.data);
      toast.success("Invoice preview loaded");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to preview invoices"),
  });

  const generateMutation = useMutation({
    mutationFn: (payload: InvoiceGenerationPayload) => invoiceService.generateInvoices(payload),
    onSuccess: (response) => {
      setResult(response.data);
      toast.success("Invoices generated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to generate invoices"),
  });

  const updateField = (key: keyof InvoiceGenerationPayload, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const sanitizePayload = (): InvoiceGenerationPayload => {
    return {
      ...form,
      customerId: form.customerId ? Number(form.customerId) : undefined,
      serviceCenterId: form.serviceCenterId ? Number(form.serviceCenterId) : undefined,
    };
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <h1 className="text-xl font-semibold">Invoice Generation</h1>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input placeholder="Year (mandatory)" value={form.year} onChange={(e) => updateField("year", e.target.value)} />
        <Input type="date" value={form.fromDate} onChange={(e) => updateField("fromDate", e.target.value)} />
        <Input type="date" value={form.toDate} onChange={(e) => updateField("toDate", e.target.value)} />
        <Input placeholder="Product Type" value={form.productType || ""} onChange={(e) => updateField("productType", e.target.value)} />
        <Input placeholder="Billing Type" value={form.billingType || ""} onChange={(e) => updateField("billingType", e.target.value)} />
        <Input placeholder="Register Type" value={form.registerType || ""} onChange={(e) => updateField("registerType", e.target.value)} />
        <Input
          placeholder="Customer ID"
          inputMode="numeric"
          value={form.customerId ?? ""}
          onChange={(e) => {
            const value = e.target.value.trim();
            updateField("customerId", value ? Number(value) : 0);
          }}
        />
        <Input
          placeholder="Service Center ID"
          inputMode="numeric"
          value={form.serviceCenterId ?? ""}
          onChange={(e) => {
            const value = e.target.value.trim();
            updateField("serviceCenterId", value ? Number(value) : 0);
          }}
        />
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.showAwb}
            onChange={(e) => updateField("showAwb", e.target.checked)}
          />
          Show AWB
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => previewMutation.mutate(sanitizePayload())}
          disabled={previewMutation.isPending || generateMutation.isPending}
        >
          Preview
        </Button>
        <Button
          type="button"
          onClick={() => generateMutation.mutate(sanitizePayload())}
          disabled={previewMutation.isPending || generateMutation.isPending}
        >
          Generate
        </Button>
      </div>

      <div className="rounded-md border border-border bg-background p-3">
        <p className="mb-2 text-sm font-medium">Response</p>
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
