"use client";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { vendorTrackingLogService } from "@/services/transactions/vendor-tracking-log-service";

export default function VendorTrackingLogsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vendor tracking logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Bruno: Transaction → Vendor Tracking Logs.
        </p>
      </div>
      <JsonApiPanel
        title="List (page 1, limit 20)"
        queryKey={["vendor-tracking-logs", "list"]}
        queryFn={() => vendorTrackingLogService.list({ page: 1, limit: 20 })}
      />
    </div>
  );
}
