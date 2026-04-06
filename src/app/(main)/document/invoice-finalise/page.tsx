"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invoiceService } from "@/services/document/invoice-service";

export default function InvoiceFinalisePage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceData, setInvoiceData] = useState<unknown>(null);

  const { data: lockLog, refetch: refetchLockLog, isLoading: isLockLogLoading } = useQuery({
    queryKey: ["invoice-lock-log"],
    queryFn: () => invoiceService.getInvoiceLockLog(),
  });

  const getByIdMutation = useMutation({
    mutationFn: (id: number) => invoiceService.getInvoiceById(id),
    onSuccess: (response) => setInvoiceData(response.data),
    onError: (error: Error) => toast.error(error.message || "Failed to load invoice"),
  });

  const lockMutation = useMutation({
    mutationFn: (id: number) => invoiceService.lockInvoice(id),
    onSuccess: (response) => {
      setInvoiceData(response.data);
      refetchLockLog();
      toast.success("Invoice locked");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to lock invoice"),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => invoiceService.unlockInvoice(id),
    onSuccess: (response) => {
      setInvoiceData(response.data);
      refetchLockLog();
      toast.success("Invoice unlocked");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to unlock invoice"),
  });

  const selectedInvoiceId = Number(invoiceId);
  const hasValidId = Number.isFinite(selectedInvoiceId) && selectedInvoiceId > 0;

  return (
    <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <h1 className="text-xl font-semibold">Invoice Finalise</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-64"
          inputMode="numeric"
          placeholder="Invoice ID"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
        />
        <Button type="button" variant="outline" disabled={!hasValidId} onClick={() => getByIdMutation.mutate(selectedInvoiceId)}>
          Get Invoice
        </Button>
        <Button type="button" disabled={!hasValidId} onClick={() => lockMutation.mutate(selectedInvoiceId)}>
          Lock Invoice
        </Button>
        <Button type="button" variant="outline" disabled={!hasValidId} onClick={() => unlockMutation.mutate(selectedInvoiceId)}>
          Unlock Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-3">
          <p className="mb-2 text-sm font-medium">Invoice Data</p>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {JSON.stringify(invoiceData, null, 2)}
          </pre>
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Lock/Unlock Log</p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetchLockLog()}>
              Refresh
            </Button>
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {isLockLogLoading ? "Loading..." : JSON.stringify(lockLog?.data ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
