import { ServiceMapForm } from "@/components/masters/service-map-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreateServiceMapPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/service-map">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Service Map</h1>
                    <p className="text-muted-foreground">
                        Add a new service map to define vendor routing.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ServiceMapForm />
                </CardContent>
            </Card>
        </div>
    );
}
