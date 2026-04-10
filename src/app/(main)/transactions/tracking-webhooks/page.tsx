"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackingService } from "@/services/transactions/tracking-service";
import { toast } from "sonner";

const DEFAULT_SINGLE = `{
  "awbNo": "AWB123456",
  "vendorId": 1,
  "externalStatus": "OUT_FOR_DELIVERY",
  "eventId": "evt-unique-001",
  "sequence": 4,
  "location": "DELHI",
  "remarks": "Out for delivery",
  "eventTime": "2026-03-18T10:00:00.000Z",
  "rawData": { "scanCode": "OFD", "hub": "DEL-01" }
}`;

const DEFAULT_BULK = `{
  "events": [
    {
      "awbNo": "AWB123456",
      "vendorId": 1,
      "externalStatus": "PICKED_UP",
      "eventId": "bd-bulk-001",
      "sequence": 2,
      "location": "MUMBAI",
      "remarks": "Picked from shipper",
      "eventTime": "2026-03-18T08:00:00.000Z",
      "rawData": { "vehicle": "VH-01" }
    }
  ]
}`;

export default function TrackingWebhooksPage() {
  const [singleJson, setSingleJson] = useState(DEFAULT_SINGLE);
  const [bulkJson, setBulkJson] = useState(DEFAULT_BULK);
  const [singleResult, setSingleResult] = useState<unknown>(null);
  const [bulkResult, setBulkResult] = useState<unknown>(null);

  const singleMutation = useMutation({
    mutationFn: async () => {
      let body: unknown;
      try {
        body = JSON.parse(singleJson) as unknown;
      } catch {
        throw new Error("Invalid JSON (single)");
      }
      return trackingService.postVendorWebhook(body);
    },
    onSuccess: (data) => {
      setSingleResult(data);
      toast.success("Single webhook OK");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      let body: unknown;
      try {
        body = JSON.parse(bulkJson) as unknown;
      } catch {
        throw new Error("Invalid JSON (bulk)");
      }
      return trackingService.postVendorWebhookBulk(body);
    },
    onSuccess: (data) => {
      setBulkResult(data);
      toast.success("Bulk webhook OK");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tracking vendor webhooks (test)
        </h1>
        <p className="text-sm text-muted-foreground">
          Bruno: POST{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            /transaction/tracking/webhook
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            /webhook/bulk
          </code>
          . Often public in production; this UI is for sandbox testing.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Label>Single event JSON</Label>
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            value={singleJson}
            onChange={(e) => setSingleJson(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => singleMutation.mutate()}
            disabled={singleMutation.isPending}
          >
            POST /webhook
          </Button>
          {singleResult != null && (
            <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(singleResult, null, 2)}
            </pre>
          )}
        </div>

        <div className="space-y-3">
          <Label>Bulk events JSON</Label>
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => bulkMutation.mutate()}
            disabled={bulkMutation.isPending}
          >
            POST /webhook/bulk
          </Button>
          {bulkResult != null && (
            <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(bulkResult, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
