"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { serviceCenterService } from "@/services/masters/service-center-service"
import { ServiceCenter } from "@/types/masters/service-center"
import { ServiceCenterDrawer } from "@/components/masters/service-center-drawer"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ServiceCentersPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedSC, setSelectedSC] = useState<ServiceCenter | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["service-centers", page, debouncedSearch],
        queryFn: () => serviceCenterService.getServiceCenters({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceCenterService.deleteServiceCenter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service-centers"] })
            toast.success("Service center deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete service center")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        setSelectedSC(null)
        setDrawerOpen(true)
    }

    const handleEdit = (sc: ServiceCenter) => {
        setSelectedSC(sc)
        setDrawerOpen(true)
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
                    <h1 className="text-3xl font-bold tracking-tight">Service Center Master</h1>
                    <p className="text-muted-foreground">
                        Manage regional service centers, their locations, and contact info.
                    </p>
                </div>
                <PermissionGuard permission="master.service_center.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create SC
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Service Centers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search service centers..."
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
                                        <TableHead className="w-[120px]">Code</TableHead>
                                        <TableHead className="min-w-[200px]">SC Name</TableHead>
                                        <TableHead>Sub Name</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Telephone</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Loading service centers...
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No service centers found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((sc) => (
                                            <TableRow key={sc.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-blue-600">{sc.code}</TableCell>
                                                <TableCell className="font-medium">{sc.name}</TableCell>
                                                <TableCell>{sc.subName}</TableCell>
                                                <TableCell>{sc.destination}</TableCell>
                                                <TableCell>{sc.state}</TableCell>
                                                <TableCell>{sc.telephone}</TableCell>
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
                                                            <PermissionGuard permission="master.service_center.update">
                                                                <DropdownMenuItem onClick={() => handleEdit(sc)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="master.service_center.delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(sc.id)}
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

            <ServiceCenterDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                serviceCenter={selectedSC}
            />

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service center
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
