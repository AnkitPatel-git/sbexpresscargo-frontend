import { ShipperForm } from "@/components/masters/shipper-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function CreateShipperPage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/masters/shipper">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Shipper</h1>
                    <p className="text-muted-foreground">Add a new shipping partner to the master list</p>
                </div>
            </div>

            <ShipperForm />
        </div>
    )
}
