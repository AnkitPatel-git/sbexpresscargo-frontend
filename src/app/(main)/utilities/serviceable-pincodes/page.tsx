"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Check, X } from "lucide-react"
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

import { serviceablePincodeService } from "@/services/utilities/serviceable-pincode-service"
import { ServiceablePincode } from "@/types/utilities/serviceable-pincode"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ServiceablePincodesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

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
        router.push("/utilities/serviceable-pincodes/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/utilities/serviceable-pincodes/${id}/edit`)
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
                <PermissionGuard permission="master.area.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Pincode
                    </Button>
                </PermissionGuard>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle className="text-xl font-semibold">Serviceable Pincodes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex items-center p-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search pincodes..."
                                className="pl-8 bg-gray-50/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50">
                                    <TableHead className="w-[120px] font-semibold">Pin Code</TableHead>
                                    <TableHead className="min-w-[200px] font-semibold">Pin Code Name</TableHead>
                                    <TableHead className="font-semibold">Service Center</TableHead>
                                    <TableHead className="font-semibold">Destination</TableHead>
                                    <TableHead className="text-center font-semibold">Serviceable</TableHead>
                                    <TableHead className="text-center font-semibold">ODA</TableHead>
                                    <TableHead className="text-right font-semibold pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                Loading pincodes...
                                            </div>
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
                                        <TableRow key={pincode.id} className="hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="font-medium text-primary">{pincode.pinCode}</TableCell>
                                            <TableCell className="font-medium">{pincode.pinCodeName}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{pincode.serviceCenter?.name || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{pincode.serviceCenter?.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{pincode.destination}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    {pincode.serviceable ? (
                                                        <div className="bg-green-100 p-1 rounded-full">
                                                            <Check className="h-3 w-3 text-green-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-red-100 p-1 rounded-full">
                                                            <X className="h-3 w-3 text-red-600" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center">
                                                    {pincode.oda ? (
                                                        <div className="bg-amber-100 p-1 rounded-full">
                                                            <Check className="h-3 w-3 text-amber-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gray-100 p-1 rounded-full">
                                                            <X className="h-3 w-3 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <PermissionGuard permission="master.area.update">
                                                            <DropdownMenuItem onClick={() => handleEdit(pincode.id)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                        </PermissionGuard>
                                                        <PermissionGuard permission="master.area.delete">
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
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

                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/30">
                        <div className="text-sm text-muted-foreground font-medium">
                            Showing page {page} of {data?.meta?.totalPages || 1}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="h-8"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(prev + 1, 1))}
                                disabled={!data || page >= (data?.meta?.totalPages || 0)}
                                className="h-8"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 font-semibold"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
