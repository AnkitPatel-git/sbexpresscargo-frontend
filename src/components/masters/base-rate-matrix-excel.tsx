"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

type BaseRateMatrixExcelProps = {
  rateMasterId?: number;
  onImported: (routeRateSlabs: RateRouteRateSlab[]) => void;
};

export function BaseRateMatrixExcel({ rateMasterId, onImported }: BaseRateMatrixExcelProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"template" | "export" | "import" | null>(null);
  const isEdit = rateMasterId != null;

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
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      toast.error("Only .xlsx or .xls files are allowed");
      return;
    }
    setBusy("import");
    try {
      if (isEdit) {
        const result = await rateService.importBaseRateMatrix(rateMasterId, file);
        onImported(result.rateMaster.routeRateSlabs ?? []);
        await queryClient.invalidateQueries({ queryKey: ["rate-master", rateMasterId] });
        toast.success(
          `Uploaded ${result.importedPairs} zone pair(s) and saved. (0–10 kg = flat rate×10; 11+ kg = per kg.)`,
        );
      } else {
        const result = await rateService.parseBaseRateMatrix(file);
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
          disabled={busy != null}
          onClick={() => fileInputRef.current?.click()}
        >
          {busy === "import" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Excel
        </Button>
      </div>
    </div>
  );
}
