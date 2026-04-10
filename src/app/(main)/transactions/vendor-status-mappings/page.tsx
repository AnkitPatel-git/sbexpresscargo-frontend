"use client";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { vendorStatusMappingService } from "@/services/transactions/vendor-status-mapping-service";

export default function VendorStatusMappingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Vendor status mappings
        </h1>
        <p className="text-sm text-muted-foreground">
          Bruno: Transaction → Vendor Status Mapping.
        </p>
      </div>
      <JsonApiPanel
        title="List (page 1, limit 20)"
        queryKey={["vendor-status-mappings", "list"]}
        queryFn={() => vendorStatusMappingService.list({ page: 1, limit: 20 })}
      />
    </div>
  );
}
