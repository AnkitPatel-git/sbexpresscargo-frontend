"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Link as LinkIcon, Check, X } from "lucide-react"
import { toast } from "sonner"

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

import { serviceMapService } from "@/services/masters/service-map-service"
import { vendorService } from "@/services/masters/vendor-service"
import { ServiceMap } from "@/types/masters/service-map"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ServiceMapPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data: vendorsData } = useQuery({
        queryKey: ["vendors-list"],
        queryFn: () => vendorService.getVendors({ limit: 100 }),
    })

    const { data, isLoading } = useQuery({
        queryKey: ["service-maps", page, debouncedSearch],
        queryFn: () => serviceMapService.getServiceMaps({ page, limit, search: debouncedSearch }),
    })

    const getVendorName = (id: number) => {
        return vendorsData?.data?.find((v: any) => v.id === id)?.vendorName || `ID: ${id}`;
    };

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceMapService.deleteServiceMap(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service-maps"] })
            toast.success("Service Map deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete service map")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/service-map/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/service-map/${id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Service Map Master</h1>
                    <p className="text-muted-foreground">
                        Manage vendor services, mapping, and weight restrictions.
                    </p>
                </div>
                <PermissionGuard permission="master.service_map.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Service Map
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Maps</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search service maps..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="min-w-[150px]">Vendor</TableHead>
                                        <TableHead>Service Type</TableHead>
                                        <TableHead>Billing Vendor</TableHead>
                                        <TableHead>Weight (Min-Max)</TableHead>
                                        <TableHead className="text-center">Single Pc</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Loading service maps...
                                             </TableCell>
                                        </TableRow>
                                    ) : data?.data && data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No service maps found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((serviceMap: ServiceMap) => (
                                            <TableRow key={serviceMap.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-blue-600">
                                                    <div className="flex items-center">
                                                        {getVendorName(serviceMap.vendorId)}
                                                        {serviceMap.vendorLink && (
                                                            <a href={serviceMap.vendorLink} target="_blank" rel="noopener noreferrer" className="ml-2">
                                                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {serviceMap.serviceType}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{getVendorName(serviceMap.billingVendorId)}</TableCell>
                                                <TableCell>{serviceMap.minWeight} - {serviceMap.maxWeight} kg</TableCell>
                                                <TableCell className="text-center">
                                                    {serviceMap.isSinglePiece ? (
                                                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600 mx-auto" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={serviceMap.status === "ACTIVE" ? "success" : "secondary"} className={
                                                        serviceMap.status === "ACTIVE"
                                                            ? "bg-green-100 text-green-800 border-green-200"
                                                            : "bg-gray-100 text-gray-800 border-gray-200"
                                                    }>
                                                        {serviceMap.status}
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
                                                            <PermissionGuard permission="master.service_map.update">
                                                                <DropdownMenuItem onClick={() => handleEdit(serviceMap.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="master.service_map.delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(serviceMap.id)}
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
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev: number) => Math.max(prev - 1, 1))}
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
                            onClick={() => setPage((prev: number) => prev + 1)}
                            disabled={!data || page >= data.meta.totalPages}
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
                            This action cannot be undone. This will permanently delete the service map
                            from our servers.
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
