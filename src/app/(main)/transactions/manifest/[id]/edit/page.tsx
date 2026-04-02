"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { ManifestForm } from "@/components/transactions/manifest-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { manifestService } from "@/services/transactions/manifest-service";

export default function EditManifestPage() {
    const params = useParams();
    const id = parseInt(params.id as string, 10);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["manifest", id],
        queryFn: () => manifestService.getManifestById(id),
    });

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
                <p className="text-lg font-medium text-destructive">
                    {error instanceof Error ? error.message : "Failed to load manifest"}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/transactions/manifest">Go Back</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/manifest">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Manifest</h1>
                    <p className="text-muted-foreground">
                        Modify the details of manifest #{data?.data?.manifestNo}
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ManifestForm initialData={data?.data} />
                </CardContent>
            </Card>
        </div>
    );
}
