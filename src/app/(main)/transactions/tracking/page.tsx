"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, BarChart3, Clock, CheckCircle2, AlertCircle, RefreshCcw, Download, Info } from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { trackingService } from "@/services/transactions/tracking-service";
import { TrackingListItem, DeadLetterLog } from "@/types/transactions/tracking";
import { ManualUpdateDialog } from "@/components/transactions/manual-update-dialog";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function TrackingPage() {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // Submitted search term
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [activeView, setActiveView] = useState<'search' | 'logs'>('search');
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedAwb, setSelectedAwb] = useState<string | null>(null);

    const { data: metricsData } = useQuery({
        queryKey: ["trackingMetrics"],
        queryFn: () => trackingService.getMetrics(),
    });

    const { data: listData, isLoading: isListLoading, error: listError } = useQuery({
        queryKey: ["trackingSearch", page, limit, searchTerm],
        queryFn: () => trackingService.searchTracking(page, limit, searchTerm),
    });

    // Use detailed query only if searchTerm exactly matches an AWB No (for quick detail view)
    // Here we'll just implement the list/search view for now, as it's the primary way to track.
    const { data: detailData, isLoading: isDetailLoading } = useQuery({
        queryKey: ["trackingDetail", searchTerm],
        queryFn: () => trackingService.getTrackingByAwb(searchTerm),
        enabled: searchTerm.length > 5, // Only trigger if it looks like a full AWB
        retry: false, // Don't retry if AWB not found
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(searchInput);
        setPage(1);
    };

    const { data: deadLettersData, isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ["deadLetters", page, limit],
        queryFn: () => trackingService.getDeadLetters(page, limit),
        enabled: activeView === 'logs',
    });

    const retryMutation = useMutation({
        mutationFn: (id: number) => trackingService.retryFailedLogs([id]),
        onSuccess: () => {
            toast.success("Retry initiated successfully");
            refetchLogs();
        },
        onError: (error: any) => {
            toast.error(error.message || "Retry failed");
        },
    });

    const handleExport = async (awbNo?: string) => {
        if (!awbNo) {
            toast.error("No AWB Number available for export");
            return;
        }

        try {
            toast.info("Preparing tracking history export...");
            const blob = await trackingService.downloadHistoryCsv(awbNo);
            
            // Create a link and trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tracking-history-${awbNo}.csv`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success("Export successful");
        } catch (error: any) {
            toast.error(error.message || "Failed to export tracking history");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tracking Dashboard</h1>
                    <p className="text-muted-foreground">Monitor real-time shipment status and carrier performance.</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
                    <Button
                        variant={activeView === 'search' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveView('search')}
                    >
                        Search
                    </Button>
                    <Button
                        variant={activeView === 'logs' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveView('logs')}
                    >
                        Carrier Logs
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                                <h3 className="text-2xl font-bold">{metricsData?.data?.totalShipments || 0}</h3>
                            </div>
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Search className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                                <h3 className="text-2xl font-bold">{metricsData?.data?.inTransit || 0}</h3>
                            </div>
                            <div className="bg-yellow-100 p-2 rounded-full">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                                <h3 className="text-2xl font-bold">{metricsData?.data?.delivered || 0}</h3>
                            </div>
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Exceptions</p>
                                <h3 className="text-2xl font-bold">{metricsData?.data?.exceptions || 0}</h3>
                            </div>
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {activeView === 'search' && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Shipment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="flex gap-4 items-center">
                                <div className="relative flex-1 max-w-lg">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Enter AWB Number or Reference..."
                                        className="pl-10"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                    />
                                </div>
                                <Button type="submit">Search</Button>
                                {searchInput && (
                                    <Button type="button" variant="outline" onClick={() => {
                                        setSearchInput("");
                                        setSearchTerm("");
                                    }}>
                                        Clear
                                    </Button>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Render Detail View if specific AWB found */}
                    {detailData?.success && detailData.data && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center w-full">
                                    <CardTitle>Shipment Details: {detailData.data.awbNo}</CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExport(detailData.data.awbNo)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedAwb(detailData.data.awbNo);
                                                setIsUpdateModalOpen(true);
                                            }}
                                        >
                                            Update Status
                                        </Button>
                                        <Badge variant="outline" className="ml-2 text-blue-700 bg-blue-50 border-blue-200">
                                            {detailData.data.statusDetails?.[detailData.data.statusDetails.length - 1]?.status || 'UNKNOWN'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Booking Date</p>
                                        <p>{detailData.data.shipmentDetails.date ? format(new Date(detailData.data.shipmentDetails.date), "dd MMM yyyy, HH:mm") : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Origin - Destination</p>
                                        <p>{detailData.data.shipmentDetails.origin} - {detailData.data.shipmentDetails.destination}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Pieces / Weight</p>
                                        <p>{detailData.data.shipmentDetails.pcs} / {detailData.data.shipmentDetails.weight} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Payment Type</p>
                                        <p>{detailData.data.shipmentDetails.payment}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-4">Tracking History</h3>
                                    <div className="space-y-4">
                                        {detailData.data.progress?.map((p, idx) => (
                                            <div key={idx} className="flex gap-4 relative">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-3 w-3 rounded-full bg-primary z-10"></div>
                                                    {idx !== detailData.data.progress.length - 1 && (
                                                        <div className="w-0.5 h-full bg-blue-200 absolute top-3"></div>
                                                    )}
                                                </div>
                                                <div className="pb-6">
                                                    <p className="font-semibold">{p.statusDetails}</p>
                                                    <p className="text-sm text-gray-600">{p.remark}</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {format(new Date(p.date), "dd MMM yyyy")} {p.time && `at ${format(new Date(p.time), "HH:mm")}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!detailData.data.progress || detailData.data.progress.length === 0) && (
                                            <p className="text-sm text-gray-500">No tracking history available.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Render List View */}
                    {!detailData?.success && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Shipments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead>AWB No</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Origin / Dest</TableHead>
                                                <TableHead>Pcs / Wt</TableHead>
                                                <TableHead>Payment</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isListLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : listError ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10 text-red-500">
                                                        Failed to load tracking list
                                                    </TableCell>
                                                </TableRow>
                                            ) : listData?.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10">
                                                        No shipments found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                listData?.data.map((item: TrackingListItem) => (
                                                    <TableRow
                                                        key={item.awbNo}
                                                        className="hover:bg-gray-50/50 cursor-pointer"
                                                        onClick={() => {
                                                            setSearchInput(item.awbNo);
                                                            setSearchTerm(item.awbNo);
                                                        }}
                                                    >
                                                        <TableCell className="font-medium text-primary hover:underline">
                                                            {item.awbNo}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.bookingDate ? format(new Date(item.bookingDate), "dd MMM yyyy") : "-"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-gray-500">{item.city || 'Origin'} → </span>
                                                            {item.destination}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.pieces} / {item.chargeWeight}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{item.paymentType}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {listData && listData.meta.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-gray-500">
                                            Page {listData.meta.page} of {listData.meta.totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(listData.meta.totalPages, p + 1))}
                                                disabled={page === listData.meta.totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {activeView === 'logs' && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Carrier Dead-Letter Logs</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => refetchLogs()}>
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>AWB No</TableHead>
                                        <TableHead>Carrier</TableHead>
                                        <TableHead>Failure Reason</TableHead>
                                        <TableHead>Retries</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLogsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                            </TableCell>
                                        </TableRow>
                                    ) : deadLettersData?.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                No failed logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        deadLettersData?.data.map((log: DeadLetterLog) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">{log.awbNo}</TableCell>
                                                <TableCell>{log.carrier}</TableCell>
                                                <TableCell className="max-w-[300px] truncate" title={log.error}>
                                                    {log.error}
                                                </TableCell>
                                                <TableCell>{log.retryCount}</TableCell>
                                                <TableCell>{format(new Date(log.createdAt), "dd MMM, HH:mm")}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => retryMutation.mutate(log.id)}
                                                        disabled={retryMutation.isPending}
                                                    >
                                                        <RefreshCcw className={`h-4 w-4 mr-1 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                                                        Retry
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedAwb && (
                <ManualUpdateDialog
                    awbNo={selectedAwb}
                    isOpen={isUpdateModalOpen}
                    onClose={() => setIsUpdateModalOpen(false)}
                    initialData={(() => {
                        const latestStatus = detailData?.data?.statusDetails?.[detailData.data.statusDetails.length - 1];
                        return latestStatus ? {
                            status: latestStatus.status,
                            remark: latestStatus.remarks,
                            // serviceCenterId is not currently returned in statusDetails, but if it was, we'd map it here
                        } : undefined;
                    })()}
                />
            )}
        </div>
    );
}
