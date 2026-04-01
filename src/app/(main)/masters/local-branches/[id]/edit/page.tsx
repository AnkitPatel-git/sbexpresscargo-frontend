"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { localBranchService } from "@/services/masters/local-branch-service"
import { LocalBranchForm } from "@/components/masters/local-branch-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EditLocalBranchPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)

    const { data: branchResponse, isLoading, error } = useQuery({
        queryKey: ['local-branch', id],
        queryFn: () => localBranchService.getLocalBranchById(id),
        enabled: !!id,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !branchResponse?.success) {
        return (
            <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg">
                <p>Failed to load local branch. It may have been deleted or doesn't exist.</p>
                <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/masters/local-branches')}
                >
                    Back to List
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/masters/local-branches')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Local Branch</h1>
                    <p className="text-muted-foreground">
                        Update the details for Branch: {branchResponse.data.name}.
                    </p>
                </div>
            </div>

            <LocalBranchForm key={id} initialData={branchResponse.data} />
        </div>
    )
}
