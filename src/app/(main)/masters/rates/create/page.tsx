"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DuplicateRateMasterCard } from "@/components/masters/duplicate-rate-master-card";
import { RateForm } from "@/components/masters/rate-form";
import { parseRateContractParam, rateMasterListPath } from "@/lib/rate-master-nav";

export default function CreateRatePage() {
  const searchParams = useSearchParams();
  const contract = parseRateContractParam(searchParams.get("contract"));
  const backHref = rateMasterListPath(contract);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Rate Master</h1>
          <p className="text-muted-foreground">Add a new rate master and its nested rates.</p>
        </div>
      </div>

      <DuplicateRateMasterCard />

      <Card>
        <CardContent className="pt-6">
          <RateForm key={contract} />
        </CardContent>
      </Card>
    </div>
  );
}
