"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { CustomerPaymentForm } from "@/components/transactions/customer-payment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { customerPaymentService } from "@/services/transactions/customer-payment-service";

export default function EditCustomerPaymentPage() {
    const params = useParams();
    const id = parseInt(params.id as string, 10);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["customer-payment", id],
        queryFn: () => customerPaymentService.getCustomerPaymentById(id),
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
                    {error instanceof Error ? error.message : "Failed to load payment"}
                </p>
                <Button variant="outline" asChild>
                    <Link href="/transactions/customer-payment">Go Back</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/customer-payment">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Customer Payment</h1>
                    <p className="text-muted-foreground">
                        Update the details of payment #{id}
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <CustomerPaymentForm initialData={data?.data} />
                </CardContent>
            </Card>
        </div>
    );
}
