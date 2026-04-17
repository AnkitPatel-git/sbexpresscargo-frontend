"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { RateForm } from "@/components/masters/rate-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { rateService } from "@/services/masters/rate-service";

export default function EditRatePage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["rate-master", id],
    queryFn: () => rateService.getRateMasterById(id),
    enabled: Number.isFinite(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !response?.success) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="font-medium text-destructive">Failed to load rate master data.</p>
        <Button variant="outline" asChild>
          <Link href="/masters/rates">Back to List</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/masters/rates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Rate Master</h1>
          <p className="text-muted-foreground">Update the rate master and its nested rates.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RateForm initialData={response.data} />
        </CardContent>
      </Card>
    </div>
  );
}
