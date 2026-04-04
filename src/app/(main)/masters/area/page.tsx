"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { areaService } from "@/services/masters/area-service"
import { Area } from "@/types/masters/area"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function AreaPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["areas", page, debouncedSearch],
        queryFn: () => areaService.getAreas({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => areaService.deleteArea(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["areas"] })
            toast.success("Area deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete area")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/area/create")
    }

    const handleEdit = (area: Area) => {
        router.push(`/masters/area/${area.id}/edit`)
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
                    <h1 className="text-3xl font-bold tracking-tight">Area Master</h1>
                    <p className="text-muted-foreground">
                        Manage areas, service centers, and destinations.
                    </p>
                </div>
                <PermissionGuard permission="master.area.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Area
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Areas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search areas..."
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
                                        <TableHead className="min-w-[150px]">Area Name</TableHead>
                                        <TableHead className="min-w-[150px]">Service Center</TableHead>
                                        <TableHead className="min-w-[150px]">Destination</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Loading areas...
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data && data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No areas found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((area: Area) => (
                                            <TableRow key={area.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-primary">{area.areaName}</TableCell>
                                                <TableCell>{typeof area.serviceCenter === 'object' ? area.serviceCenter.name : area.serviceCenter || area.serviceCenterId}</TableCell>
                                                <TableCell>{area.destination}</TableCell>
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
                                                            <PermissionGuard permission="master.area.update">
                                                                <DropdownMenuItem onClick={() => handleEdit(area)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="master.area.delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(area.id)}
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
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {page} of {data?.meta?.totalPages || 1}
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

            {/* Drawer removed in favor of route-based creation/editing */}

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the area
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
