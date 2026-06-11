"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rateService } from "@/services/masters/rate-service";
import type { RateRouteRateSlab, RateRouteSlabPayload } from "@/types/masters/rate";

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ParsedSlabPayload = RateRouteSlabPayload & {
  fromZone?: { id: number; code: string; name: string };
  toZone?: { id: number; code: string; name: string };
};

function payloadsToSlabRows(slabs: ParsedSlabPayload[]): RateRouteRateSlab[] {
  return slabs.map((slab, index) => ({
    id: -(index + 1),
    rateMasterId: 0,
    fromZoneId: slab.fromZoneId,
    toZoneId: slab.toZoneId,
    minimumAmount: slab.minimumAmount ?? undefined,
    weightSlabs: slab.weightSlabs.map((w, wi) => ({
      ...w,
      id: -(index * 10 + wi + 1),
    })),
    fromZone: slab.fromZone,
    toZone: slab.toZone,
  }));
}

function parseFixedMaxKgInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < 0) return null;
  return num;
}

function fixedMaxKgSummary(fixedMaxKg: number): string {
  if (fixedMaxKg === 0) {
    return "BaseRate matrix: per-kg only (0–99999 kg)";
  }
  return `BaseRate matrix: 0–${fixedMaxKg} kg flat (rate×${fixedMaxKg}); ${fixedMaxKg + 1}+ kg per kg`;
}

type BaseRateMatrixExcelProps = {
  rateMasterId?: number;
  onImported: (routeRateSlabs: RateRouteRateSlab[]) => void;
};

export function BaseRateMatrixExcel({ rateMasterId, onImported }: BaseRateMatrixExcelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"template" | "export" | "import" | null>(null);
  const [fixedMaxKgInput, setFixedMaxKgInput] = useState("");
  const isEdit = rateMasterId != null;

  const fixedMaxKg = parseFixedMaxKgInput(fixedMaxKgInput);
  const fixedMaxKgInvalid = fixedMaxKgInput.trim() !== "" && fixedMaxKg == null;

  async function downloadTemplate() {
    setBusy("template");
    try {
      const { blob, filename } = await rateService.downloadBaseRateMatrixTemplate();
      triggerBlobDownload(blob, filename);
      toast.success("Template downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  async function downloadCurrentMatrix() {
    if (rateMasterId == null) return;
    setBusy("export");
    try {
      const { blob, filename } = await rateService.exportBaseRateMatrix(rateMasterId);
      triggerBlobDownload(blob, filename);
      toast.success("Base rate Excel exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (fixedMaxKgInvalid) {
      toast.error("Fixed rate up to (kg) must be a whole number ≥ 0, or leave blank when using the Slabs sheet");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      toast.error("Only .xlsx or .xls files are allowed");
      return;
    }
    setBusy("import");
    try {
      if (isEdit) {
        const result = await rateService.importBaseRateMatrix(rateMasterId, file, fixedMaxKg);
        onImported(result.rateMaster.routeRateSlabs ?? []);
        await queryClient.invalidateQueries({ queryKey: ["rate-master", rateMasterId] });
        toast.success(`Uploaded ${result.importedPairs} zone pair(s) and saved.`);
      } else {
        const result = await rateService.parseBaseRateMatrix(file, fixedMaxKg);
        onImported(payloadsToSlabRows(result.rateSlabs));
        toast.success(
          `Loaded ${result.importedPairs} zone pair(s) into the form. Click Create Rate Master to save.`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-muted/30 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">Excel upload (zone base rates)</p>
        <p className="text-sm text-muted-foreground mt-1">
          Download the template — it has three sheets: <span className="font-medium text-foreground">Instructions</span>,{" "}
          <span className="font-medium text-foreground">Slabs</span> (recommended), and legacy{" "}
          <span className="font-medium text-foreground">BaseRate</span> matrix.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">Slabs sheet:</span> one row per weight band with{" "}
          <span className="font-medium text-foreground">Pricing Mode</span> (FLAT, PER_KG, FLAT_G, PER_500G) and optional{" "}
          <span className="font-medium text-foreground">Min Amount</span> per zone pair. Use grams in min/max for FLAT_G and
          PER_500G.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">BaseRate sheet:</span> simple zone×zone per-kg matrix — requires{" "}
          <span className="font-medium text-foreground">Fixed rate up to (kg)</span> below when uploading matrix-only files.
        </p>
      </div>

      <div className="space-y-2 max-w-md">
        <Label htmlFor="base-rate-fixed-max-kg">Fixed rate up to (kg) — BaseRate matrix only</Label>
        <Input
          id="base-rate-fixed-max-kg"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={fixedMaxKgInput}
          onChange={(e) => setFixedMaxKgInput(e.target.value)}
          placeholder="Leave blank when using Slabs sheet; e.g. 10 for matrix"
          aria-invalid={fixedMaxKgInvalid}
        />
        {fixedMaxKgInvalid ? (
          <p className="text-xs text-destructive">Enter a whole number ≥ 0, or leave blank</p>
        ) : fixedMaxKg != null ? (
          <p className="text-xs text-muted-foreground">{fixedMaxKgSummary(fixedMaxKg)}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Optional if your file uses the Slabs sheet</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy != null}
          onClick={() => void downloadTemplate()}
        >
          {busy === "template" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download template
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy != null}
            onClick={() => void downloadCurrentMatrix()}
          >
            {busy === "export" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export current rates
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => void handleFileChange(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={busy != null || fixedMaxKgInvalid}
          onClick={() => fileInputRef.current?.click()}
        >
          {busy === "import" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Excel
        </Button>
      </div>
    </div>
  );
}
