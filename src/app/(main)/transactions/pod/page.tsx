"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Search, Upload, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { podService } from "@/services/transactions/pod-service";
import { PodRow } from "@/types/transactions/pod";
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function PodPage() {
    const [awbInput, setAwbInput] = useState("");
    const [podData, setPodData] = useState<PodRow[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const viewMutation = useMutation({
        mutationFn: async (awbNos: string[]) => {
            return podService.viewPod(awbNos);
        },
        onSuccess: (data) => {
            setPodData(data.data.podRows);
            if (data.data.podRows.length === 0) {
                toast.info("No records found for the given AWBs.");
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to fetch POD data");
        },
    });

    const handleSearch = () => {
        const awbList = awbInput
            .split(/[\n,]+/)
            .map(awb => awb.trim())
            .filter(awb => awb.length > 0);

        if (awbList.length === 0) {
            toast.error("Please enter at least one AWB number");
            return;
        }

        viewMutation.mutate(awbList);
    };

    const downloadMutation = useMutation({
        mutationFn: () => podService.downloadTemplate(),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'POD_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success("Template downloaded successfully");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to download template");
        }
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => podService.uploadExcel(file),
        onSuccess: () => {
            toast.success("Excel uploaded successfully");
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to upload Excel");
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadMutation.mutate(e.target.files[0]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proof of Delivery (POD)</h1>
                    <p className="text-muted-foreground">View POD status and upload bulk updates.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>View POD by AWBs</CardTitle>
                        <CardDescription>Enter AWB numbers separated by commas or new lines.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="e.g. AWB123456, AWB789012"
                            className="min-h-[150px]"
                            value={awbInput}
                            onChange={(e) => setAwbInput(e.target.value)}
                        />
                        <PermissionGuard permission="transaction.pod.read">
                            <Button
                                onClick={handleSearch}
                                className="w-full"
                                disabled={viewMutation.isPending}
                            >
                                {viewMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="mr-2 h-4 w-4" />
                                )}
                                View POD
                            </Button>
                        </PermissionGuard>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle>Bulk Upload / Template</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Use the Excel template to bulk update Proof of Delivery status for multiple shipments at once.
                        </p>
                        <div className="flex gap-4">
                            <PermissionGuard permission="transaction.pod.create">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => downloadMutation.mutate()}
                                    disabled={downloadMutation.isPending}
                                >
                                    {downloadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Download Template
                                </Button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                />

                                <Button
                                    className="flex-1"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadMutation.isPending}
                                >
                                    {uploadMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Upload Excel
                                </Button>
                            </PermissionGuard>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {podData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>AWB No</TableHead>
                                        <TableHead>Delivery Date/Time</TableHead>
                                        <TableHead>Receiver</TableHead>
                                        <TableHead>Status / Remark</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {podData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-gray-50/50">
                                            <TableCell className="font-medium">{row.AWBNo}</TableCell>
                                            <TableCell>
                                                {row.DelvDate ? `${row.DelvDate} ${row.DelvTime}` : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {row.Recivername || "-"}
                                                {row.ReciverTelNo && <div className="text-xs text-gray-500">{row.ReciverTelNo}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    {row.MSG ? (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                            {row.MSG}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No Status</span>
                                                    )}
                                                    {row.Remark && <span className="text-xs text-gray-500">{row.Remark}</span>}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {podData.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                                                No tracking information found for the entered AWBs.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
