"use client";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { auditLogService } from "@/services/utilities/audit-log-service";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit logs</h1>
        <p className="text-sm text-muted-foreground">
          Bruno: Utilities → Audit logs (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            /utilities/audit-logs
          </code>
          ).
        </p>
      </div>
      <JsonApiPanel
        title="List (page 1, limit 50)"
        queryKey={["utilities", "audit-logs", "list"]}
        queryFn={() => auditLogService.listAuditLogs({ page: 1, limit: 50 })}
      />
    </div>
  );
}
