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
    return "per-kg rate only (0–99999 kg)";
  }
  return `0–${fixedMaxKg} kg = flat (rate×${fixedMaxKg}); ${fixedMaxKg + 1}+ kg = per kg`;
}

type BaseRateMatrixExcelProps = {
  rateMasterId?: number;
  onImported: (routeRateSlabs: RateRouteRateSlab[]) => void;
};

export function BaseRateMatrixExcel({ rateMasterId, onImported }: BaseRateMatrixExcelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"template" | "export" | "import" | null>(null);
  const [fixedMaxKgInput, setFixedMaxKgInput] = useState("10");
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
      toast.success("Base rate matrix exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (fixedMaxKg == null) {
      toast.error(
        fixedMaxKgInvalid
          ? "Fixed rate up to (kg) must be a whole number ≥ 0"
          : "Enter fixed rate up to (kg) before uploading (use 0 for per-kg only)",
      );
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
        toast.success(
          `Uploaded ${result.importedPairs} zone pair(s) and saved. (${fixedMaxKgSummary(fixedMaxKg)})`,
        );
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
        <p className="text-sm font-semibold">Excel matrix (zone × zone)</p>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">Where to upload:</span> open the{" "}
          <span className="font-medium text-foreground">Base rate</span> tab (second tab), then use{" "}
          <span className="font-medium text-foreground">Upload Excel</span> below.
          {isEdit
            ? " Upload saves base rates immediately."
            : " On create, upload fills the table below; then save the rate master."}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Each cell is the <span className="font-medium text-foreground">per-kg rate</span>. Set how
          many kg use a flat charge first; enter <span className="font-medium text-foreground">0</span>{" "}
          for per-kg only across all weights.
        </p>
      </div>

      <div className="space-y-2 max-w-xs">
        <Label htmlFor="base-rate-fixed-max-kg">
          Fixed rate up to (kg) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="base-rate-fixed-max-kg"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          required
          value={fixedMaxKgInput}
          onChange={(e) => setFixedMaxKgInput(e.target.value)}
          placeholder="e.g. 10 (0 = per-kg only)"
          aria-invalid={fixedMaxKgInvalid}
        />
        {fixedMaxKgInvalid ? (
          <p className="text-xs text-destructive">Enter a whole number ≥ 0</p>
        ) : fixedMaxKg != null ? (
          <p className="text-xs text-muted-foreground">{fixedMaxKgSummary(fixedMaxKg)}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Required before upload</p>
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
          disabled={busy != null || fixedMaxKg == null}
          onClick={() => fileInputRef.current?.click()}
        >
          {busy === "import" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Excel
        </Button>
      </div>
    </div>
  );
}
