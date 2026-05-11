"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select";
import { useDebounce } from "@/hooks/use-debounce";
import { bankService } from "@/services/masters/bank-service";
import type { Bank } from "@/types/masters/bank";
import { shipmentService } from "@/services/transactions/shipment-service";
import { receiptService } from "@/services/transactions/receipt-service";
import type { ReceiptCreatePayload, ReceiptLinePayload } from "@/types/transactions/receipt";

export type ReceiptFormLine = {
  receiptNo: string;
  receiptDate: string;
  amount: string;
  receiptType: string;
  referenceNo: string;
  bankId: string;
  userId: string;
};

function emptyLine(): ReceiptFormLine {
  return {
    receiptNo: "",
    receiptDate: new Date().toISOString().split("T")[0],
    amount: "",
    receiptType: "",
    referenceNo: "",
    bankId: "",
    userId: "",
  };
}

function numOrUndef(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function lineToPayload(line: ReceiptFormLine): ReceiptLinePayload | null {
  const has =
    line.receiptNo.trim() ||
    line.receiptDate.trim() ||
    line.amount.trim() ||
    line.receiptType.trim() ||
    line.referenceNo.trim() ||
    line.bankId.trim() ||
    line.userId.trim();
  if (!has) return null;
  return {
    receiptNo: line.receiptNo.trim() || undefined,
    receiptDate: line.receiptDate.trim() || undefined,
    amount: numOrUndef(line.amount),
    receiptType: line.receiptType.trim() || undefined,
    referenceNo: line.referenceNo.trim() || undefined,
    bankId: line.bankId ? Number(line.bankId) : undefined,
    userId: line.userId ? Number(line.userId) : undefined,
  };
}

function decStr(v: unknown): string {
  if (v == null || v === "") return "";
  return String(v);
}

/** Minimal `Bank` row so `DbAsyncSelect` can show a line’s bank when it is not in the first page. */
function receiptLineBankToExtra(b: { id: number; bankName: string }): Bank {
  return {
    id: b.id,
    bankCode: "",
    bankName: b.bankName,
    status: "ACTIVE",
    createdAt: "",
    updatedAt: "",
    createdById: null,
    updatedById: null,
    deletedAt: null,
    deletedById: null,
  };
}

interface ReceiptFormProps {
  mode: "create" | "edit";
  receiptId?: number;
}

export function ReceiptForm({ mode, receiptId }: ReceiptFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shipmentId, setShipmentId] = useState<number | null>(null);
  const [awbSearch, setAwbSearch] = useState("");
  const debouncedAwb = useDebounce(awbSearch, 400);
  const [amount, setAmount] = useState("");
  const [totalRcp, setTotalRcp] = useState("");
  const [balance, setBalance] = useState("");
  const [lines, setLines] = useState<ReceiptFormLine[]>([emptyLine()]);

  const { data: existing, isLoading: loadingReceipt } = useQuery({
    queryKey: ["transaction-receipt", receiptId],
    queryFn: () => receiptService.getReceiptById(receiptId!),
    enabled: mode === "edit" && receiptId != null,
  });

  const { data: shipmentsRes } = useQuery({
    queryKey: ["receipt-form-shipments", debouncedAwb],
    queryFn: () =>
      shipmentService.getShipments({
        page: 1,
        limit: 25,
        awbNo: debouncedAwb.trim() || undefined,
        sortBy: "id",
        sortOrder: "desc",
      }),
    enabled: mode === "create" && debouncedAwb.trim().length >= 1,
  });

  const shipmentOptions = useMemo(
    () =>
      (shipmentsRes?.data ?? []).map((s) => ({
        value: String(s.id),
        label: `${s.awbNo} · #${s.id}`,
      })),
    [shipmentsRes],
  );

  useEffect(() => {
    if (!existing) return;
    setShipmentId(existing.shipmentId);
    setAmount(decStr(existing.amount));
    setTotalRcp(decStr(existing.totalRcp));
    setBalance(decStr(existing.balance));
    if (existing.lines?.length) {
      setLines(
        existing.lines.map((l) => ({
          receiptNo: l.receiptNo ?? "",
          receiptDate: l.receiptDate ? String(l.receiptDate).split("T")[0] : "",
          amount: decStr(l.amount),
          receiptType: l.receiptType ?? "",
          referenceNo: l.referenceNo ?? "",
          bankId: l.bankId != null ? String(l.bankId) : "",
          userId: l.userId != null ? String(l.userId) : "",
        })),
      );
    } else {
      setLines([emptyLine()]);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === "create" && (shipmentId == null || shipmentId < 1)) {
        throw new Error("Select a shipment (search by AWB)");
      }
      if (mode === "edit" && (shipmentId == null || shipmentId < 1)) {
        throw new Error("Invalid shipment");
      }
      const linePayloads = lines.map(lineToPayload).filter(Boolean) as ReceiptLinePayload[];
      const a = numOrUndef(amount);
      const t = numOrUndef(totalRcp);
      const b = numOrUndef(balance);
      const body: ReceiptCreatePayload = {
        shipmentId: shipmentId!,
        lines: linePayloads,
      };
      if (a !== undefined) body.amount = a;
      if (t !== undefined) body.totalRcp = t;
      if (b !== undefined) body.balance = b;
      if (mode === "create") {
        return receiptService.createReceipt(body);
      }
      return receiptService.updateReceipt(receiptId!, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transaction-receipts"] });
      if (receiptId != null) {
        void queryClient.invalidateQueries({ queryKey: ["transaction-receipt", receiptId] });
      }
      toast.success(mode === "create" ? "Receipt created" : "Receipt updated");
      router.push("/transactions/receipt");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Save failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const updateLine = (index: number, patch: Partial<ReceiptFormLine>) => {
    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  if (mode === "edit" && loadingReceipt) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === "create" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label>Shipment (search AWB)</Label>
            <Combobox
              className="w-full"
              placeholder="Type AWB to search…"
              searchPlaceholder="AWB no"
              emptyMessage={debouncedAwb.trim().length < 1 ? "Type at least 1 character" : "No shipments found"}
              value={shipmentId != null ? String(shipmentId) : ""}
              onChange={(v) => setShipmentId(v !== "" && v != null ? Number(v) : null)}
              searchValue={awbSearch}
              onSearchValueChange={setAwbSearch}
              options={shipmentOptions}
            />
          </div>
        ) : (
          <div className="space-y-2 sm:col-span-2">
            <Label>Shipment</Label>
            <Input
              readOnly
              value={
                existing?.shipment?.awbNo
                  ? `${existing.shipment.awbNo} (#${existing.shipmentId})`
                  : existing
                    ? `Shipment #${existing.shipmentId}`
                    : ""
              }
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Amount</Label>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label>Total RCP</Label>
          <Input
            inputMode="decimal"
            value={totalRcp}
            onChange={(e) => setTotalRcp(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Balance</Label>
          <Input
            inputMode="decimal"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Receipt lines</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Add line
          </Button>
        </div>

        <div className="space-y-4 rounded-md border border-border p-3">
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Receipt no</Label>
                <Input value={line.receiptNo} onChange={(e) => updateLine(index, { receiptNo: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Receipt date</Label>
                <Input
                  type="date"
                  value={line.receiptDate}
                  onChange={(e) => updateLine(index, { receiptDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <Input
                  inputMode="decimal"
                  value={line.amount}
                  onChange={(e) => updateLine(index, { amount: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Input
                  value={line.receiptType}
                  onChange={(e) => updateLine(index, { receiptType: e.target.value })}
                  placeholder="e.g. CASH"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reference no</Label>
                <Input
                  value={line.referenceNo}
                  onChange={(e) => updateLine(index, { referenceNo: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Bank</Label>
                <DbAsyncSelect<Bank>
                  queryKey={["receipt-form", "banks", index]}
                  fetchPage={(page, search) =>
                    bankService.getBanks({
                      page,
                      limit: DB_ASYNC_SELECT_PAGE_SIZE,
                      sortBy: "bankName",
                      sortOrder: "asc",
                      search: search || undefined,
                    })
                  }
                  getItemLabel={(b) => b.bankName}
                  extraItems={
                    existing?.lines?.[index]?.bank
                      ? [receiptLineBankToExtra(existing.lines[index].bank!)]
                      : undefined
                  }
                  clearOption={{ value: "0", label: "None" }}
                  value={line.bankId ? line.bankId : "0"}
                  onValueChange={(v) => updateLine(index, { bankId: v === "0" ? "" : v })}
                  placeholder="Select bank"
                  searchPlaceholder="Search banks…"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">User id (optional)</Label>
                  <Input
                    inputMode="numeric"
                    value={line.userId}
                    onChange={(e) => updateLine(index, { userId: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  title="Remove line"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create receipt" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/transactions/receipt")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
