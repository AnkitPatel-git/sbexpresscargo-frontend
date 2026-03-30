"use client"

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ChargeForm } from "@/components/masters/charge-form";
import { Card, CardContent } from "@/components/ui/card";
import { chargeService } from "@/services/masters/charge-service";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditChargePage() {
    const params = useParams();
    const id = Number(params.id);

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['charge', id],
        queryFn: () => chargeService.getChargeById(id),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !response?.success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-destructive font-medium">Failed to load charge data.</p>
                <Button variant="outline" asChild>
                    <Link href="/masters/charge">Back to List</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/charge">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Charge</h1>
                    <p className="text-muted-foreground">
                        Update the charge details in the system.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ChargeForm initialData={response.data} />
                </CardContent>
            </Card>
        </div>
    );
}
