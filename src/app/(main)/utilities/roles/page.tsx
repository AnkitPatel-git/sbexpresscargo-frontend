"use client";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { roleService } from "@/services/utilities/role-service";

export default function RolesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Bruno: Utilities → Roles (<code className="rounded bg-muted px-1 py-0.5 text-xs">/utilities/roles</code>
          ).
        </p>
      </div>
      <JsonApiPanel
        title="List roles (page 1, limit 50)"
        queryKey={["utilities", "roles", "list"]}
        queryFn={() => roleService.listRoles({ page: 1, limit: 50 })}
      />
    </div>
  );
}
