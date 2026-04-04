"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Package } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { shipmentService } from "@/services/transactions/shipment-service"
import { Shipment } from "@/types/transactions/shipment"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ShipmentsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["shipments", page, debouncedSearch],
        queryFn: () => shipmentService.getShipments({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => shipmentService.deleteShipment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shipments"] })
            toast.success("Shipment deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete shipment")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/transactions/shipment/create")
    }

    const handleEdit = (shipment: Shipment) => {
        router.push(`/transactions/shipment/${shipment.id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'CREATED': return 'secondary';
            case 'IN_TRANSIT': return 'default';
            case 'DELIVERED': return 'success';
            case 'CANCELLED': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shipment Master</h1>
                    <p className="text-muted-foreground">
                        Manage and track AWB shipments.
                    </p>
                </div>
                <PermissionGuard permission="transaction.shipment.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Shipment
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Shipments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 bg-white sticky top-0 z-10">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by AWB, origin, destination..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead>AWB No</TableHead>
                                    <TableHead>Book Date</TableHead>
                                    <TableHead>Origin</TableHead>
                                    <TableHead>Destination</TableHead>
                                    <TableHead>Pcs / Wt</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Loading shipments...
                                        </TableCell>
                                    </TableRow>
                                ) : data?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No shipments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((shipment) => (
                                        <TableRow key={shipment.id} className="hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="font-medium underline text-primary cursor-pointer">
                                                {shipment.awbNo}
                                            </TableCell>
                                            <TableCell>
                                                {shipment.bookDate ? format(new Date(shipment.bookDate), "dd/MM/yyyy") : 'N/A'}
                                            </TableCell>
                                            <TableCell>{shipment.origin || 'N/A'}</TableCell>
                                            <TableCell>{shipment.destination || 'N/A'}</TableCell>
                                            <TableCell>
                                                {shipment.pieces} pcs / {shipment.actualWeight} kg
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(shipment.currentStatus) as any}>
                                                    {shipment.currentStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <PermissionGuard permission="transaction.shipment.update">
                                                            <DropdownMenuItem onClick={() => handleEdit(shipment)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                        </PermissionGuard>
                                                        <PermissionGuard permission="transaction.shipment.delete">
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDeleteRequest(shipment.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </PermissionGuard>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {page} of {data?.meta.totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!data || page >= (data.meta?.totalPages || 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the shipment
                            record from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
