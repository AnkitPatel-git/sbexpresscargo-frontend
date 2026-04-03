"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreditNoteForm } from "@/components/transactions/credit-note-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateCreditNotePage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/transactions/credit-note">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Credit Note</h1>
                    <p className="text-muted-foreground">
                        Create a new credit note for receipt expenses.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <CreditNoteForm />
                </CardContent>
            </Card>
        </div>
    );
}
