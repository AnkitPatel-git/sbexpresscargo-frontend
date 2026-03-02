"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { fuelSetupService } from "@/services/tax-charges/fuel-setup-service"
import { FuelSetup } from "@/types/tax-charges/fuel-setup"
import { FuelSetupDrawer } from "@/components/tax-charges/fuel-setup-drawer"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function FuelSetupPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedFuelSetup, setSelectedFuelSetup] = useState<FuelSetup | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["fuel-setups", page, debouncedSearch],
        queryFn: () => fuelSetupService.getFuelSetups({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => fuelSetupService.deleteFuelSetup(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fuel-setups"] })
            toast.success("Fuel setup deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete fuel setup")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        setSelectedFuelSetup(null)
        setDrawerOpen(true)
    }

    const handleEdit = (fuelSetup: FuelSetup) => {
        setSelectedFuelSetup(fuelSetup)
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
                    <h1 className="text-3xl font-bold tracking-tight">Fuel Setup</h1>
                    <p className="text-muted-foreground">
                        Manage Fuel Setup rules for customers, vendors, and services.
                    </p>
                </div>
                {/* Adjust permissions below if needed. Currently assuming fuel_setup_add/modify/delete logic matches existing masters. */}
                <PermissionGuard permission="fuel_setup_add">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Fuel Setup
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fuel Setups</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search fuel setups..."
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
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead>From Date</TableHead>
                                        <TableHead>To Date</TableHead>
                                        <TableHead>Percentage (%)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                Loading fuel setups...
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data && data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                No fuel setups found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((fuelSetup: FuelSetup) => (
                                            <TableRow key={fuelSetup.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-blue-600">
                                                    {fuelSetup.customer}
                                                </TableCell>
                                                <TableCell>{fuelSetup.vendor}</TableCell>
                                                <TableCell>{fuelSetup.product}</TableCell>
                                                <TableCell>{fuelSetup.service}</TableCell>
                                                <TableCell>{fuelSetup.destination}</TableCell>
                                                <TableCell>{format(new Date(fuelSetup.fromDate), "dd-MM-yyyy")}</TableCell>
                                                <TableCell>{format(new Date(fuelSetup.toDate), "dd-MM-yyyy")}</TableCell>
                                                <TableCell>{fuelSetup.percentage}</TableCell>
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
                                                            <PermissionGuard permission="fuel_setup_modify">
                                                                <DropdownMenuItem onClick={() => handleEdit(fuelSetup)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="fuel_setup_delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(fuelSetup.id)}
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
                            Page {page} of {data?.totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!data || page >= data.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <FuelSetupDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                fuelSetup={selectedFuelSetup}
            />

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the fuel setup
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
