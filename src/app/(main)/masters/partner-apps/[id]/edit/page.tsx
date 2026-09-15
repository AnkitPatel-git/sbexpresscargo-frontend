"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { PartnerAppForm } from "@/components/masters/partner-app-form"
import { PartnerAppStatusMappingTable } from "@/components/masters/partner-app-status-mapping"
import { partnerAppService } from "@/services/masters/partner-app-service"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function EditPartnerAppPage() {
    const params = useParams()
    const id = Number(params.id)

    const { data: appResponse, isLoading } = useQuery({
        queryKey: ["partner-app", id],
        queryFn: () => partnerAppService.getPartnerAppById(id),
        enabled: Number.isFinite(id),
    })
    const { data: apiLogs } = useQuery({
        queryKey: ["partner-app-api-logs", id],
        queryFn: () => partnerAppService.getApiLogs(id, { page: 1, limit: 20 }),
        enabled: Number.isFinite(id),
    })
    const { data: pushLogs } = useQuery({
        queryKey: ["partner-app-push-logs", id],
        queryFn: () => partnerAppService.getPushLogs(id, { page: 1, limit: 20 }),
        enabled: Number.isFinite(id),
    })

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const app = appResponse?.data

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/masters/partner-apps">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Partner App</h1>
                    <p className="text-muted-foreground">Update customers, webhook, and credentials</p>
                </div>
            </div>

            <PartnerAppForm initialData={app} />

            {app && (
                <PartnerAppStatusMappingTable
                    partnerAppId={app.id}
                    mappings={app.statusMappings ?? []}
                />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <h2 className="mb-2 text-lg font-semibold">Inbound API logs</h2>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>Endpoint</TableHead>
                                    <TableHead>Ref</TableHead>
                                    <TableHead>Result</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(apiLogs?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground">No inbound logs yet.</TableCell>
                                    </TableRow>
                                ) : (
                                    apiLogs?.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap text-xs">{row.createdAt}</TableCell>
                                            <TableCell className="text-xs">{row.endpoint}</TableCell>
                                            <TableCell className="text-xs">{row.referenceNo ?? row.customerCode ?? "—"}</TableCell>
                                            <TableCell className="text-xs">{row.success ? "OK" : row.errorMessage ?? "Failed"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <div>
                    <h2 className="mb-2 text-lg font-semibold">Tracking push logs</h2>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>AWB</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(pushLogs?.data ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground">No push logs yet.</TableCell>
                                    </TableRow>
                                ) : (
                                    pushLogs?.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="whitespace-nowrap text-xs">{row.createdAt}</TableCell>
                                            <TableCell className="text-xs">{row.shipment?.awbNo ?? "—"}</TableCell>
                                            <TableCell className="text-xs">{row.status} ({row.attempts})</TableCell>
                                            <TableCell className="max-w-[220px] truncate text-xs">{row.lastError ?? "—"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
