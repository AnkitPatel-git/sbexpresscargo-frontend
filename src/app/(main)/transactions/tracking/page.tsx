"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Clock, CheckCircle2, AlertCircle, RefreshCcw, Download, Info, ChevronUp, ChevronDown, FilePlus, FileUp, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    );
}

export default function TrackingPage() {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // Submitted search term
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [activeView, setActiveView] = useState<'search' | 'logs'>('search');
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedAwb, setSelectedAwb] = useState<string | null>(null);
    const [listFilters, setListFilters] = useState({ awb: "", origin: "", destination: "", payment: "" });
    const [logFilters, setLogFilters] = useState({ awb: "", carrier: "", error: "" });

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
        queryKey: ["deadLetters", limit],
        queryFn: () => trackingService.getDeadLetters(limit),
        enabled: activeView === 'logs',
    });
    const logFilteredRows =
        deadLettersData?.data.filter((log) => {
            if (logFilters.awb && !(log.awbNo || "").toLowerCase().includes(logFilters.awb.toLowerCase())) return false;
            if (logFilters.carrier && !(log.carrier || "").toLowerCase().includes(logFilters.carrier.toLowerCase())) return false;
            if (logFilters.error && !(log.error || "").toLowerCase().includes(logFilters.error.toLowerCase())) return false;
            return true;
        }) ?? [];

    const retryMutation = useMutation({
        mutationFn: () => trackingService.retryFailedLogs(1),
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

    const listFilteredRows =
        listData?.data.filter((item) => {
            if (listFilters.awb && !(item.awbNo || "").toLowerCase().includes(listFilters.awb.toLowerCase())) return false;
            if (listFilters.origin && !(item.city || "").toLowerCase().includes(listFilters.origin.toLowerCase())) return false;
            if (listFilters.destination && !(item.destination || "").toLowerCase().includes(listFilters.destination.toLowerCase())) return false;
            if (listFilters.payment && !(item.paymentType || "").toLowerCase().includes(listFilters.payment.toLowerCase())) return false;
            return true;
        }) ?? [];

    const listTotal = listData?.meta?.total ?? 0;
    const listFrom = listTotal === 0 ? 0 : (page - 1) * limit + 1;
    const listTo = Math.min(page * limit, listTotal);

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <FilePlus className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <FileUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => activeView === "logs" ? refetchLogs() : undefined}
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-2 rounded-md bg-gray-100 p-1">
                        <Button variant={activeView === 'search' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('search')}>Search</Button>
                        <Button variant={activeView === 'logs' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveView('logs')}>Carrier Logs</Button>
                    </div>
                    <Button
                        type="button"
                        className="h-9 rounded-md px-3"
                        onClick={() => {
                            const awb = detailData?.data?.awbNo || searchInput || selectedAwb;
                            if (!awb) {
                                toast.info("Search and open an AWB to add tracking update.");
                                return;
                            }
                            setSelectedAwb(awb);
                            setIsUpdateModalOpen(true);
                        }}
                    >
                        <Plus className="mr-1 h-4 w-4" /> Add Tracking Update
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
                                    <Table className="min-w-[920px] border-0">
                                        <TableHeader>
                                            <TableRow className="border-0 bg-primary hover:bg-primary">
                                                <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">AWB No <SortArrows /></span></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Date <SortArrows /></span></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Origin / Dest <SortArrows /></span></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Pcs / Wt <SortArrows /></span></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Payment <SortArrows /></span></TableHead>
                                            </TableRow>
                                            <TableRow>
                                                <TableHead className="p-2"><Input placeholder="AWB No" className="h-8 border-border bg-background text-xs" value={listFilters.awb} onChange={(e) => setListFilters((f) => ({ ...f, awb: e.target.value }))} /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Date" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Origin / Dest" className="h-8 border-border bg-background text-xs" value={listFilters.destination} onChange={(e) => setListFilters((f) => ({ ...f, destination: e.target.value }))} /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Pcs / Wt" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Payment" className="h-8 border-border bg-background text-xs" value={listFilters.payment} onChange={(e) => setListFilters((f) => ({ ...f, payment: e.target.value }))} /></TableHead>
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
                                            ) : listFilteredRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-10">
                                                        No shipments found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                listFilteredRows.map((item: TrackingListItem, index) => (
                                                    <TableRow
                                                        key={item.awbNo}
                                                        className={cn("cursor-pointer border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
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
                                            Showing {listFrom} to {listTo} of {listTotal} entries
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 min-w-8 px-2"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                ‹
                                            </Button>
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 min-w-8 px-2"
                                                onClick={() => setPage(p => Math.min(listData.meta.totalPages, p + 1))}
                                                disabled={page === listData.meta.totalPages}
                                            >
                                                ›
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" onClick={() => setPage(listData.meta.totalPages)} disabled={page === listData.meta.totalPages}>»</Button>
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
                            <Table className="min-w-[980px] border-0">
                                <TableHeader>
                                    <TableRow className="border-0 bg-primary hover:bg-primary">
                                        <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">AWB No <SortArrows /></span></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Carrier <SortArrows /></span></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Failure Reason <SortArrows /></span></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Retries <SortArrows /></span></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Date <SortArrows /></span></TableHead>
                                        <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                                    </TableRow>
                                    <TableRow>
                                        <TableHead className="p-2"><Input placeholder="AWB No" className="h-8 border-border bg-background text-xs" value={logFilters.awb} onChange={(e) => setLogFilters((f) => ({ ...f, awb: e.target.value }))} /></TableHead>
                                        <TableHead className="p-2"><Input placeholder="Carrier" className="h-8 border-border bg-background text-xs" value={logFilters.carrier} onChange={(e) => setLogFilters((f) => ({ ...f, carrier: e.target.value }))} /></TableHead>
                                        <TableHead className="p-2"><Input placeholder="Failure Reason" className="h-8 border-border bg-background text-xs" value={logFilters.error} onChange={(e) => setLogFilters((f) => ({ ...f, error: e.target.value }))} /></TableHead>
                                        <TableHead className="p-2"><Input placeholder="Retries" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                                        <TableHead className="p-2"><Input placeholder="Date" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                                        <TableHead className="p-2" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLogsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                            </TableCell>
                                        </TableRow>
                                    ) : logFilteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                                <Info className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                No failed logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logFilteredRows.map((log: DeadLetterLog, index) => (
                                            <TableRow key={log.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                                <TableCell className="font-medium">{log.awbNo}</TableCell>
                                                <TableCell>{log.carrier}</TableCell>
                                                <TableCell className="max-w-[300px] truncate" title={log.error}>
                                                    {log.error}
                                                </TableCell>
                                                <TableCell>{log.retryCount}</TableCell>
                                                <TableCell>{format(new Date(log.createdAt), "dd MMM, HH:mm")}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-primary hover:bg-primary/10"
                                                        onClick={() => retryMutation.mutate()}
                                                        disabled={retryMutation.isPending}
                                                    >
                                                        <RefreshCcw className={`h-4 w-4 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
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
