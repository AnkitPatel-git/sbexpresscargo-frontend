"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CustomerPaymentForm } from "@/components/transactions/customer-payment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateCustomerPaymentPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/customer-payment">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Customer Payment</h1>
                    <p className="text-muted-foreground">
                        Record a new payment transaction from a customer.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <CustomerPaymentForm />
                </CardContent>
            </Card>
        </div>
    );
}
