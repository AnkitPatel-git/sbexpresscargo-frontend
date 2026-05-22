"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CityForm } from "@/components/masters/city-form"

export default function CreateCityPage() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Link href="/masters/cities" className="inline-flex items-center text-sm text-[var(--express-link)] hover:underline">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to City Master
                </Link>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-4 lg:p-5">
                <h1 className="mb-4 text-lg font-semibold text-foreground">Add City</h1>
                <CityForm />
            </div>
        </div>
    )
}
