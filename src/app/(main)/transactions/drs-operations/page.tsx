"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { drsService } from "@/services/transactions/drs-service";
import { toast } from "sonner";

export default function DrsOperationsPage() {
  const [startId, setStartId] = useState(1);

  const exportMutation = useMutation({
    mutationFn: () => drsService.exportDrsCsv(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "drs-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export started");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startMutation = useMutation({
    mutationFn: (id: number) => drsService.startDrs(id),
    onSuccess: () => toast.success("DRS started"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">DRS operations</h1>
        <p className="text-sm text-muted-foreground">
          Start, export, and list (Bruno: Transaction → DRS).
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="drs-start-id">DRS ID (start)</Label>
          <Input
            id="drs-start-id"
            type="number"
            min={1}
            className="w-36"
            value={startId}
            onChange={(e) => setStartId(Number(e.target.value) || 1)}
          />
        </div>
        <Button
          type="button"
          onClick={() => startMutation.mutate(startId)}
          disabled={startMutation.isPending}
        >
          Start DRS
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          Export DRS (CSV)
        </Button>
      </div>

      {startMutation.data !== undefined && (
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted p-3 text-xs">
          {JSON.stringify(startMutation.data, null, 2)}
        </pre>
      )}

      <JsonApiPanel
        title="List DRS (page 1, limit 20)"
        queryKey={["drs", "list", "ops"]}
        queryFn={() => drsService.getDrs(1, 20)}
      />
    </div>
  );
}
