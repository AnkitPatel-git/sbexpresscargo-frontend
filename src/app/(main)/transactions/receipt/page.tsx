"use client";

import { JsonApiPanel } from "@/components/api-console/json-api-panel";
import { receiptService } from "@/services/transactions/receipt-service";

export default function ReceiptsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
        <p className="text-sm text-muted-foreground">
          Transaction receipts API (Bruno: Transaction → Receipt).
        </p>
      </div>
      <JsonApiPanel
        title="List receipts (page 1, limit 20)"
        queryKey={["transaction", "receipt", "list", 1, 20]}
        queryFn={() => receiptService.listReceipts({ page: 1, limit: 20 })}
      />
    </div>
  );
}
