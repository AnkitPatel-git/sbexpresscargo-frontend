"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { ReceiptForm } from "@/components/transactions/receipt-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CreateReceiptPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions/receipt">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">New shipment receipt</h1>
          <p className="text-sm text-muted-foreground">
            Link a shipment (one receipt per shipment), set totals, then add receipt lines (no., date, amount, bank,
            etc.).
          </p>
        </div>
      </div>

      <PermissionGuard
        permission="transaction.receipt.create"
        fallback={
          <p className="text-sm text-muted-foreground">
            You do not have permission to create receipts (<span className="font-mono">transaction.receipt.create</span>
            ).
          </p>
        }
      >
        <Card>
          <CardContent className="pt-6">
            <ReceiptForm mode="create" />
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  );
}
