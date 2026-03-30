"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { exceptionService } from "@/services/masters/exception-service"
import { ExceptionForm } from "@/components/masters/exception-form"
import { Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EditExceptionPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: exceptionResponse, isLoading, error } = useQuery({
        queryKey: ['exception', id],
        queryFn: () => exceptionService.getExceptionById(id),
        enabled: !!id
    })

    if (isLoading) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !exceptionResponse?.data) {
        return (
            <div className="flex h-[450px] flex-col items-center justify-center gap-2">
                <h3 className="text-xl font-semibold">Error loading exception</h3>
                <p className="text-muted-foreground">The exception could not be found or there was an error fetching the data.</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/masters/exception">
                        Back to List
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/exception">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Exception</h1>
                    <p className="text-muted-foreground">
                        Update the exception details for {exceptionResponse.data.name}.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ExceptionForm initialData={exceptionResponse.data} />
                </CardContent>
            </Card>
        </div>
    )
}
