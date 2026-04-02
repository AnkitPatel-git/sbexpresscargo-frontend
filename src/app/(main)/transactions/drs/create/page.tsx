"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DrsForm } from "@/components/transactions/drs-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateDrsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/drs">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create DRS</h1>
                    <p className="text-muted-foreground">
                        Create a Delivery Run Sheet and assign shipments.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <DrsForm />
                </CardContent>
            </Card>
        </div>
    );
}
