import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RateForm } from "@/components/masters/rate-form";

export default function CreateRatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/masters/rates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Rate Master</h1>
          <p className="text-muted-foreground">Add a new rate master and its nested rates.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RateForm />
        </CardContent>
      </Card>
    </div>
  );
}
