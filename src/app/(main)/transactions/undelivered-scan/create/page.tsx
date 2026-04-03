"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UndeliveredScanForm } from "@/components/transactions/undelivered-scan-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateUndeliveredScanPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/undelivered-scan">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Undelivered Scan</h1>
                    <p className="text-muted-foreground">
                        Log a new undelivered scan event for AWBs.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <UndeliveredScanForm />
                </CardContent>
            </Card>
        </div>
    );
}
