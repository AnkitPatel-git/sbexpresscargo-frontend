"use client";

import { useState } from "react";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackingSummaryService } from "@/services/transactions/tracking-summary-service";

export default function TrackingSummariesPage() {
  const [shipmentId, setShipmentId] = useState("");
  const [awbNo, setAwbNo] = useState("");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tracking summaries
        </h1>
        <p className="text-sm text-muted-foreground">
          Bruno list:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            ?page=1&limit=20&shipmentId=1&awbNo=AWB
          </code>
          . Filters are optional; leave blank to call with page/limit only.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="ts-sid">shipmentId (optional)</Label>
          <Input
            id="ts-sid"
            type="number"
            className="w-40"
            placeholder="e.g. 1"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ts-awb">awbNo (optional)</Label>
          <Input
            id="ts-awb"
            className="w-48"
            placeholder="e.g. AWB123"
            value={awbNo}
            onChange={(e) => setAwbNo(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            setShipmentId("");
            setAwbNo("");
          }}
        >
          Clear filters
        </Button>
      </div>

      <JsonApiPanel
        title="List"
        queryKey={[
          "tracking-summary",
          "list",
          1,
          20,
          shipmentId,
          awbNo,
        ]}
        queryFn={() =>
          trackingSummaryService.list({
            page: 1,
            limit: 20,
            ...(shipmentId !== "" && !Number.isNaN(Number(shipmentId))
              ? { shipmentId: Number(shipmentId) }
              : {}),
            ...(awbNo.trim() !== "" ? { awbNo: awbNo.trim() } : {}),
          })
        }
      />
    </div>
  );
}
