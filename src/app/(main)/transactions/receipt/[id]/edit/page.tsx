"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { ReceiptForm } from "@/components/transactions/receipt-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EditReceiptPage() {
  const params = useParams();
  const raw = params.id;
  const id = typeof raw === "string" ? Number(raw) : Array.isArray(raw) ? Number(raw[0]) : NaN;

  if (!Number.isFinite(id) || id < 1) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Invalid receipt id.</p>
        <Button variant="link" asChild className="mt-2 px-0">
          <Link href="/transactions/receipt">Back to receipts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions/receipt">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Edit receipt #{id}</h1>
          <p className="text-sm text-muted-foreground">Update totals and receipt lines. Saving replaces all lines.</p>
        </div>
      </div>

      <PermissionGuard
        permission="transaction.receipt.update"
        fallback={
          <p className="text-sm text-muted-foreground">
            You do not have permission to edit receipts (<span className="font-mono">transaction.receipt.update</span>).
          </p>
        }
      >
        <Card>
          <CardContent className="pt-6">
            <ReceiptForm mode="edit" receiptId={id} />
          </CardContent>
        </Card>
      </PermissionGuard>
    </div>
  );
}
