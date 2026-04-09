"use client";

import { useState } from "react";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { manifestService } from "@/services/transactions/manifest-service";
import { toast } from "sonner";

export default function ManifestOperationsPage() {
  const [serviceCenterId, setServiceCenterId] = useState(1);
  const [manifestId, setManifestId] = useState(1);

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manifest operations
        </h1>
        <p className="text-sm text-muted-foreground">
          Extra manifest endpoints (inscan, view, AWBs, exports) aligned with
          Bruno.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="sc-id">Service center ID (next number)</Label>
          <Input
            id="sc-id"
            type="number"
            min={1}
            className="w-40"
            value={serviceCenterId}
            onChange={(e) => setServiceCenterId(Number(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mf-id">Manifest ID (print / export items)</Label>
          <Input
            id="mf-id"
            type="number"
            min={1}
            className="w-40"
            value={manifestId}
            onChange={(e) => setManifestId(Number(e.target.value) || 1)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            try {
              const blob = await manifestService.exportManifestListCsv();
              download(blob, "manifest-list.csv");
              toast.success("Download started");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Export manifest list (CSV)
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            try {
              const blob = await manifestService.exportManifestItemsCsv(
                manifestId,
              );
              download(blob, `manifest-${manifestId}-items.csv`);
              toast.success("Download started");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Export manifest items (CSV)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JsonApiPanel
          title="List manifest inscans"
          queryKey={["manifest", "inscan", "list"]}
          queryFn={() => manifestService.listManifestInscans(1, 20)}
        />
        <JsonApiPanel
          title="Available AWBs"
          queryKey={["manifest", "available-awbs"]}
          queryFn={() => manifestService.getAvailableAwbs(1, 20)}
        />
        <JsonApiPanel
          title="Next manifest number"
          queryKey={["manifest", "next-number", serviceCenterId]}
          queryFn={() =>
            manifestService.getNextManifestNumber(serviceCenterId)
          }
        />
        <JsonApiPanel
          title="Aggregated manifest view"
          queryKey={["manifest", "view", "aggregated"]}
          queryFn={() => manifestService.getManifestViewAggregated({})}
        />
        <JsonApiPanel
          title="Print payload"
          queryKey={["manifest", "print", manifestId]}
          queryFn={() => manifestService.getManifestPrintPayload(manifestId)}
        />
      </div>
    </div>
  );
}
