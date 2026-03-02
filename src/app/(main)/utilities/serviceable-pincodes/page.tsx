"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react"
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

import { serviceablePincodeService } from "@/services/utilities/serviceable-pincode-service"
import { ServiceablePincode } from "@/types/utilities/serviceable-pincode"
import { ServiceablePincodeDrawer } from "@/components/utilities/serviceable-pincode-drawer"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ServiceablePincodesPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedPincode, setSelectedPincode] = useState<ServiceablePincode | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["serviceable-pincodes", page, debouncedSearch],
        queryFn: () => serviceablePincodeService.getServiceablePincodes({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceablePincodeService.deleteServiceablePincode(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serviceable-pincodes"] })
            toast.success("Serviceable pincode deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete serviceable pincode")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        setSelectedPincode(null)
        setDrawerOpen(true)
    }

    const handleEdit = (pincode: ServiceablePincode) => {
        setSelectedPincode(pincode)
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
                    <h1 className="text-3xl font-bold tracking-tight">Serviceable Pincodes Master</h1>
                    <p className="text-muted-foreground">
                        Manage serviceable pincodes, destinations, and ODA statuses.
                    </p>
                </div>
                <PermissionGuard permission="serviceable_pincode_add">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Pincode
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Serviceable Pincodes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search pincodes..."
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
                                        <TableHead className="w-[120px]">Pin Code</TableHead>
                                        <TableHead className="min-w-[200px]">Pin Code Name</TableHead>
                                        <TableHead>Service Center</TableHead>
                                        <TableHead>Destination</TableHead>
                                        <TableHead className="text-center">Serviceable</TableHead>
                                        <TableHead className="text-center">ODA</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Loading pincodes...
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data && data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No pincodes found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((pincode: ServiceablePincode) => (
                                            <TableRow key={pincode.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-blue-600">{pincode.pinCode}</TableCell>
                                                <TableCell className="font-medium">{pincode.pinCodeName}</TableCell>
                                                <TableCell>{pincode.serviceCenter}</TableCell>
                                                <TableCell>{pincode.destination}</TableCell>
                                                <TableCell className="text-center">
                                                    {pincode.serviceable ? (
                                                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600 mx-auto" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {pincode.oda ? (
                                                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600 mx-auto" />
                                                    )}
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
                                                            <PermissionGuard permission="serviceable_pincode_modify">
                                                                <DropdownMenuItem onClick={() => handleEdit(pincode)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="serviceable_pincode_delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(pincode.id)}
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

            <ServiceablePincodeDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                pincode={selectedPincode}
            />

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the serviceable pincode
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
