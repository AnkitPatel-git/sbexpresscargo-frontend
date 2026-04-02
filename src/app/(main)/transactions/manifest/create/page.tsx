import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ManifestForm } from "@/components/transactions/manifest-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateManifestPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/manifest">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Manifest</h1>
                    <p className="text-muted-foreground">
                        Add a new manifest to the system.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ManifestForm />
                </CardContent>
            </Card>
        </div>
    );
}
