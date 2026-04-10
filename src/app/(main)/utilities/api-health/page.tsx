"use client";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { appService } from "@/services/app-service";

export default function ApiHealthPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API health</h1>
        <p className="text-sm text-muted-foreground">
          Bruno App → GET{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {"{{baseUrl}}/"}
          </code>
        </p>
      </div>
      <JsonApiPanel
        title="GET / (root under API prefix)"
        queryKey={["app", "health"]}
        queryFn={() => appService.getHealth()}
      />
    </div>
  );
}
