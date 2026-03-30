import { ExceptionForm } from "@/components/masters/exception-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateExceptionPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/masters/exception">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Exception</h1>
                    <p className="text-muted-foreground">
                        Add a new exception code and type.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <ExceptionForm />
                </CardContent>
            </Card>
        </div>
    )
}
