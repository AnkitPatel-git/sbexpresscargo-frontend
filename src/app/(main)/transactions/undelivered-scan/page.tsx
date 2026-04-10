"use client";

import { useMutation } from "@tanstack/react-query";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { Button } from "@/components/ui/button";
import { undeliveredScanService } from "@/services/transactions/undelivered-scan-service";
import { toast } from "sonner";

export default function UndeliveredScanPage() {
  const exportMutation = useMutation({
    mutationFn: () => undeliveredScanService.exportCsv(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "undelivered-scans.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export started");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Undelivered scan
          </h1>
          <p className="text-sm text-muted-foreground">
            Bruno: Transaction → Undelivered Scan.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          Export CSV
        </Button>
      </div>
      <JsonApiPanel
        title="List (page 1, limit 20)"
        queryKey={["undelivered-scan", "list"]}
        queryFn={() => undeliveredScanService.list(1, 20)}
      />
    </div>
  );
}
