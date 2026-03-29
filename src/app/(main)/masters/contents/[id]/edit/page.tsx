"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ContentForm } from "@/components/masters/content-form"
import { contentService } from "@/services/masters/content-service"

export default function EditContentPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: contentResponse, isLoading, error } = useQuery({
        queryKey: ['content', id],
        queryFn: () => contentService.getContentById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !contentResponse) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <p className="text-destructive">Failed to load content details.</p>
                <Button variant="outline" onClick={() => router.push('/masters/contents')}>
                    Back to Contents
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/masters/contents')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Content</h1>
                    <p className="text-muted-foreground">
                        Update the details for Content: {contentResponse.data.contentCode}.
                    </p>
                </div>
            </div>

            <ContentForm initialData={contentResponse.data} />
        </div>
    )
}
