"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormSection } from "@/components/ui/form-section"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { partnerAppService } from "@/services/masters/partner-app-service"
import { PartnerStatusMapping } from "@/types/masters/partner-app"

interface PartnerAppStatusMappingTableProps {
    partnerAppId: number
    mappings: PartnerStatusMapping[]
}

export function PartnerAppStatusMappingTable({
    partnerAppId,
    mappings,
}: PartnerAppStatusMappingTableProps) {
    const queryClient = useQueryClient()
    const [rows, setRows] = useState<PartnerStatusMapping[]>(mappings)

    useEffect(() => {
        setRows(mappings)
    }, [mappings])

    const mutation = useMutation({
        mutationFn: () =>
            partnerAppService.replaceStatusMappings(
                partnerAppId,
                rows.map((row) => ({
                    internalStatus: row.internalStatus,
                    scan: row.scan,
                    scanCode: row.scanCode,
                    scanType: row.scanType,
                })),
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partner-app", partnerAppId] })
            toast.success("Status mappings saved")
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const updateRow = (index: number, field: keyof PartnerStatusMapping, value: string) => {
        setRows((prev) =>
            prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        )
    }

    if (rows.length === 0) {
        return null
    }

    return (
        <FormSection title="Status mapping">
            <p className="mb-3 text-sm text-muted-foreground">
                Maps our shipment statuses to partner scan codes used in tracking pushes.
            </p>
            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Internal status</TableHead>
                            <TableHead>Scan</TableHead>
                            <TableHead>Scan code</TableHead>
                            <TableHead>Scan type</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={row.internalStatus}>
                                <TableCell className="font-mono text-xs">{row.internalStatus}</TableCell>
                                <TableCell>
                                    <Input
                                        value={row.scan}
                                        onChange={(e) => updateRow(index, "scan", e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={row.scanCode}
                                        onChange={(e) => updateRow(index, "scanCode", e.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={row.scanType}
                                        onChange={(e) => updateRow(index, "scanType", e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-3 flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate()}
                >
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save mappings
                </Button>
            </div>
        </FormSection>
    )
}
