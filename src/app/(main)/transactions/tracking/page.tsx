"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
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
import { TrackingListItem } from "@/types/transactions/tracking";

export default function TrackingPage() {
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // Submitted search term
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tracking</h1>
                <p className="text-muted-foreground">Track shipments and view their progress.</p>
            </div>

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
                        <CardTitle className="flex justify-between items-center">
                            <span>Shipment Details: {detailData.data.awbNo}</span>
                            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                                {detailData.data.statusDetails?.[detailData.data.statusDetails.length - 1]?.status || 'UNKNOWN'}
                            </Badge>
                        </CardTitle>
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
                                            <div className="h-3 w-3 rounded-full bg-blue-600 z-10"></div>
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
                                                <TableCell className="font-medium text-blue-600 hover:underline">
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
        </div>
    );
}
