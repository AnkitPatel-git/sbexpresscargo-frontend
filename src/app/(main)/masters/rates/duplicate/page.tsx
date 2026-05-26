"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DuplicateRateMasterCard } from "@/components/masters/duplicate-rate-master-card";
import { parseRateContractParam, rateMasterListPath } from "@/lib/rate-master-nav";

export default function DuplicateRatePage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Duplicate Rate Master</h1>
          <p className="text-muted-foreground">
            Copy slabs and charges from an existing rate to one customer or to every customer in
            the same customer group.
          </p>
        </div>
      </div>

      <DuplicateRateMasterCard />
    </div>
  );
}
