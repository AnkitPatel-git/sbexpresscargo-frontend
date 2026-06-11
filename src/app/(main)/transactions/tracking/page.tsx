"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, Clock, CheckCircle2, AlertCircle, RefreshCcw, Download, Info, FilePlus, FileUp, Plus } from "lucide-react";
import { format } from "date-fns";

import { formatShipmentPaymentTypeLabel } from "@/lib/shipment-payment-label";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { trackingService } from "@/services/transactions/tracking-service";
import { TrackingListItem, DeadLetterLog, type ShipmentTrackingStatusRow, type TrackingBulkManualImportResult } from "@/types/transactions/tracking";
import { formatShipmentStatusLabel } from "@/lib/shipment-status-label";
import { ManualUpdateDialog } from "@/components/transactions/manual-update-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header";

function safeFormatDate(iso: string | null | undefined, fmt: string) {
    if (!iso) return "—";
    try {
        return format(new Date(iso), fmt);
    } catch {
        return "—";
    }
}

export default function TrackingPage() {
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // Submitted search term
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [activeView, setActiveView] = useState<'search' | 'logs'>('search');
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkResult, setBulkResult] = useState<TrackingBulkManualImportResult | null>(null);
    const [selectedAwb, setSelectedAwb] = useState<string | null>(null);
    const [listFilters, setListFilters] = useState({ awb: "", origin: "", destination: "", payment: "", status: "" });
    const [logFilters, setLogFilters] = useState({ awb: "", carrier: "", error: "" });
    const [listSortBy, setListSortBy] = useState("bookingDate");
    const [listSortOrder, setListSortOrder] = useState<SortOrder>("desc");
    const [logSortBy, setLogSortBy] = useState("createdAt");
    const [logSortOrder, setLogSortOrder] = useState<SortOrder>("desc");

    const { data: metricsData } = useQuery({
        queryKey: ["trackingMetrics"],
        queryFn: () => trackingService.getMetrics(),
    });

    const { data: listData, isLoading: isListLoading, error: listError } = useQuery({
        queryKey: ["trackingSearch", page, limit, searchTerm, listSortBy, listSortOrder],
        queryFn: () =>
            trackingService.searchTracking({
                page,
                limit,
                search: searchTerm,
                sortBy: listSortBy,
                sortOrder: listSortOrder,
            }),
    });

    // Use detailed query only if searchTerm exactly matches an AWB No (for quick detail view)
    // Here we'll just implement the list/search view for now, as it's the primary way to track.
    const { data: detailData } = useQuery({
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
        queryKey: ["deadLetters", limit, logSortBy, logSortOrder],
        queryFn: () => trackingService.getDeadLetters({ limit, sortBy: logSortBy, sortOrder: logSortOrder }),
        enabled: activeView === 'logs',
    });
    const logFilteredRows =
        deadLettersData?.data.filter((log) => {
            if (logFilters.awb && !(log.awbNo || "").toLowerCase().includes(logFilters.awb.toLowerCase())) return false;
            if (logFilters.carrier && !(log.carrier || "").toLowerCase().includes(logFilters.carrier.toLowerCase())) return false;
            if (logFilters.error && !(log.error || "").toLowerCase().includes(logFilters.error.toLowerCase())) return false;
            return true;
        }) ?? [];

    const bulkMutation = useMutation({
        mutationFn: (file: File) => trackingService.bulkManualFromExcel(file),
        onSuccess: (res) => {
            const d = res.data;
            setBulkResult(d);
            queryClient.invalidateQueries({ queryKey: ["trackingSearch"] });
            queryClient.invalidateQueries({ queryKey: ["trackingDetail"] });
            toast.success(`Bulk tracking: ${d.succeeded} succeeded, ${d.failed} failed (${d.totalRows} rows).`);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Bulk upload failed");
        },
    });

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
            const originLabel = (item.origin ?? item.city ?? "").toLowerCase();
            if (listFilters.origin && !originLabel.includes(listFilters.origin.toLowerCase())) return false;
            if (listFilters.destination && !(item.destination || "").toLowerCase().includes(listFilters.destination.toLowerCase())) return false;
            if (listFilters.payment && !(item.paymentType || "").toLowerCase().includes(listFilters.payment.toLowerCase())) return false;
            if (listFilters.status && !(item.currentStatus || "").toLowerCase().includes(listFilters.status.toLowerCase())) return false;
            return true;
        }) ?? [];

    const listTotal = listData?.meta?.total ?? 0;
    const listFrom = listTotal === 0 ? 0 : (page - 1) * limit + 1;
    const listTo = Math.min(page * limit, listTotal);

    const handleListSort = (field: string) => {
        if (listSortBy === field) {
            setListSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setListSortBy(field);
            setListSortOrder("asc");
        }
        setPage(1);
    };

    const handleLogSort = (field: string) => {
        if (logSortBy === field) {
            setLogSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setLogSortBy(field);
            setLogSortOrder("asc");
        }
    };

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary">
                        <FilePlus className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        title="Bulk tracking from Excel"
                        onClick={() => {
                            setBulkResult(null);
                            setBulkFile(null);
                            setIsBulkDialogOpen(true);
                        }}
                    >
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
                        variant="outline"
                        className="h-9 rounded-md px-3"
                        onClick={() => {
                            setBulkResult(null);
                            setBulkFile(null);
                            setIsBulkDialogOpen(true);
                        }}
                    >
                        <FileUp className="mr-1 h-4 w-4" /> Bulk Excel
                    </Button>
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
                    {detailData?.success && detailData.data && (() => {
                        const d = detailData.data;
                        const timeline: ShipmentTrackingStatusRow[] = d.statusDetails ?? [];
                        const latest = timeline.length > 0 ? timeline[timeline.length - 1] : undefined;
                        const badgeStatus = d.currentStatus ?? latest?.status ?? "UNKNOWN";
                        const badgeSub = latest?.subStatus;
                        return (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center w-full flex-wrap gap-2">
                                    <CardTitle>Shipment Details: {d.awbNo}</CardTitle>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExport(d.awbNo)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Export
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedAwb(d.awbNo);
                                                setIsUpdateModalOpen(true);
                                            }}
                                        >
                                            Update Status
                                        </Button>
                                        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 max-w-[min(100%,22rem)] whitespace-normal text-left">
                                            <span className="font-medium">{formatShipmentStatusLabel(badgeStatus)}</span>
                                            {badgeSub ? (
                                                <span className="mt-0.5 block text-xs opacity-80">
                                                    {formatShipmentStatusLabel(badgeSub)}
                                                </span>
                                            ) : null}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Current status</p>
                                        <p className="font-medium">{formatShipmentStatusLabel(d.currentStatus ?? latest?.status)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Booking date</p>
                                        <p>{d.shipmentDetails.date ? format(new Date(d.shipmentDetails.date), "dd MMM yyyy, HH:mm") : "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Origin — destination</p>
                                        <p>{d.shipmentDetails.origin} — {d.shipmentDetails.destination}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Pieces / weight</p>
                                        <p>{d.shipmentDetails.pcs} / {String(d.shipmentDetails.weight)} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Payment</p>
                                        <p>{d.shipmentDetails.payment}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-3">Tracking history</h3>
                                    <div className="overflow-x-auto rounded-md border border-border">
                                        <Table className="min-w-[960px]">
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>Event time</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Sub-status</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Remark</TableHead>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Service center</TableHead>
                                                    <TableHead>External</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {timeline.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                                            No tracking events yet.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    timeline.map((row, idx) => (
                                                        <TableRow key={row.id ?? idx} className={idx % 2 === 1 ? "bg-muted/30" : ""}>
                                                            <TableCell className="text-muted-foreground">{row.sequence ?? idx + 1}</TableCell>
                                                            <TableCell className="whitespace-nowrap text-sm">
                                                                {safeFormatDate(row.eventAt, "dd MMM yyyy, HH:mm")}
                                                            </TableCell>
                                                            <TableCell className="font-medium">{formatShipmentStatusLabel(row.status)}</TableCell>
                                                            <TableCell className="text-sm">{row.subStatus ? formatShipmentStatusLabel(row.subStatus) : "—"}</TableCell>
                                                            <TableCell className="text-sm max-w-[180px] truncate" title={row.location ?? ""}>{row.location || "—"}</TableCell>
                                                            <TableCell className="text-sm max-w-[220px] truncate" title={row.remarks || row.remark}>{row.remarks || row.remark || "—"}</TableCell>
                                                            <TableCell className="text-sm whitespace-nowrap">
                                                                {row.userName ?? (row.userId != null ? `#${row.userId}` : "—")}
                                                            </TableCell>
                                                            <TableCell className="text-sm max-w-[160px] truncate" title={row.serviceCenterName ?? ""}>
                                                                {row.serviceCenterName || row.serviceCenterCode || "—"}
                                                            </TableCell>
                                                            <TableCell className="text-xs max-w-[140px] truncate" title={row.externalStatus ?? ""}>
                                                                {row.externalStatus || "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        );
                    })()}

                    {/* Render List View */}
                    {!detailData?.success && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Shipments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table className="min-w-[1040px] border-0">
                                        <TableHeader>
                                            <TableRow className="border-0 bg-primary hover:bg-primary">
                                                <TableHead className="h-11 font-semibold text-primary-foreground"><SortableColumnHeader label="AWB No" field="awbNo" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Date" field="bookingDate" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Origin" field="origin" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Destination" field="destination" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Pcs / Wt" field="pieces" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Payment" field="paymentType" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                                <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Status" field="currentStatus" sortBy={listSortBy} sortOrder={listSortOrder} onSort={handleListSort} /></TableHead>
                                            </TableRow>
                                            <TableRow>
                                                <TableHead className="p-2"><Input placeholder="AWB No" className="h-8 border-border bg-background text-xs" value={listFilters.awb} onChange={(e) => setListFilters((f) => ({ ...f, awb: e.target.value }))} /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Date" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Origin" className="h-8 border-border bg-background text-xs" value={listFilters.origin} onChange={(e) => setListFilters((f) => ({ ...f, origin: e.target.value }))} /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Destination" className="h-8 border-border bg-background text-xs" value={listFilters.destination} onChange={(e) => setListFilters((f) => ({ ...f, destination: e.target.value }))} /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Pcs / Wt" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Payment" className="h-8 border-border bg-background text-xs" value={listFilters.payment} onChange={(e) => setListFilters((f) => ({ ...f, payment: e.target.value }))} /></TableHead>
                                                <TableHead className="p-2"><Input placeholder="Status" className="h-8 border-border bg-background text-xs" value={listFilters.status} onChange={(e) => setListFilters((f) => ({ ...f, status: e.target.value }))} /></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isListLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-10">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : listError ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-10 text-red-500">
                                                        Failed to load tracking list
                                                    </TableCell>
                                                </TableRow>
                                            ) : listFilteredRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-10">
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
                                                        <TableCell className="max-w-[200px] truncate" title={item.origin ?? item.city ?? ""}>
                                                            {item.origin ?? item.city ?? "—"}
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px] truncate" title={item.destination ?? ""}>
                                                            {item.destination ?? "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.pieces} / {item.chargeWeight}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{formatShipmentPaymentTypeLabel(item.paymentType)}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="font-normal">
                                                                {formatShipmentStatusLabel(item.currentStatus)}
                                                            </Badge>
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
                                        <TableHead className="h-11 font-semibold text-primary-foreground"><SortableColumnHeader label="AWB No" field="awbNo" sortBy={logSortBy} sortOrder={logSortOrder} onSort={handleLogSort} /></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Carrier" field="carrier" sortBy={logSortBy} sortOrder={logSortOrder} onSort={handleLogSort} /></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Failure Reason" field="error" sortBy={logSortBy} sortOrder={logSortOrder} onSort={handleLogSort} /></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Retries" field="retryCount" sortBy={logSortBy} sortOrder={logSortOrder} onSort={handleLogSort} /></TableHead>
                                        <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Date" field="createdAt" sortBy={logSortBy} sortOrder={logSortOrder} onSort={handleLogSort} /></TableHead>
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

            <Dialog
                open={isBulkDialogOpen}
                onOpenChange={(open) => {
                    setIsBulkDialogOpen(open);
                    if (!open) {
                        setBulkFile(null);
                        setBulkResult(null);
                    }
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Bulk tracking from Excel</DialogTitle>
                        <DialogDescription>
                            One row per AWB. Status must be a valid ShipmentStatusType (e.g. IN_TRANSIT). Sub-status is required when status is DELIVERY_ATTEMPTED.
                            Remove the sample row before uploading.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        const blob = await trackingService.downloadBulkManualTemplate();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = "tracking-bulk-manual-template.xlsx";
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                        toast.success("Template downloaded");
                                    } catch (e: unknown) {
                                        toast.error(e instanceof Error ? e.message : "Download failed");
                                    }
                                }}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download template
                            </Button>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-medium">Excel file (.xlsx)</p>
                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                className="cursor-pointer"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    setBulkFile(f ?? null);
                                    setBulkResult(null);
                                }}
                            />
                        </div>
                        {bulkResult && bulkResult.rows.length > 0 ? (
                            <div className="rounded-md border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-14">Row</TableHead>
                                            <TableHead>AWB</TableHead>
                                            <TableHead className="w-20">Result</TableHead>
                                            <TableHead>Error</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bulkResult.rows.map((r) => (
                                            <TableRow key={`${r.row}-${r.awbNo}`}>
                                                <TableCell>{r.row}</TableCell>
                                                <TableCell className="font-mono text-sm">{r.awbNo || "—"}</TableCell>
                                                <TableCell>
                                                    {r.ok ? (
                                                        <Badge className="bg-green-600">OK</Badge>
                                                    ) : (
                                                        <Badge variant="destructive">Fail</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-md break-words">
                                                    {r.error ?? "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            disabled={!bulkFile || bulkMutation.isPending}
                            onClick={() => {
                                if (bulkFile) bulkMutation.mutate(bulkFile);
                            }}
                        >
                            {bulkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload and apply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedAwb && (
                <ManualUpdateDialog
                    awbNo={selectedAwb}
                    isOpen={isUpdateModalOpen}
                    onClose={() => setIsUpdateModalOpen(false)}
                    initialData={(() => {
                        const rows = detailData?.data?.statusDetails;
                        const latestStatus = rows && rows.length > 0 ? rows[rows.length - 1] : undefined;
                        return latestStatus
                            ? {
                                status: latestStatus.status,
                                remark: latestStatus.remarks || latestStatus.remark || "",
                                serviceCenterId: latestStatus.serviceCenterId ?? undefined,
                                subStatus: latestStatus.subStatus ?? "",
                                location: latestStatus.location ?? "",
                            }
                            : undefined;
                    })()}
                />
            )}
        </div>
    );
}
