"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react"
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

import { vendorService } from "@/services/masters/vendor-service"
import { Vendor } from "@/types/masters/vendor"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function VendorPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["vendors", page, debouncedSearch],
        queryFn: () => vendorService.getVendors({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorService.deleteVendor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendors"] })
            toast.success("Vendor deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete vendor")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/vendor/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/vendor/${id}/edit`)
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
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Vendor Master</h1>
                    <p className="text-slate-500">
                        Manage vendors, their contact details, and account statuses.
                    </p>
                </div>
                <PermissionGuard permission="master.vendor.create">
                    <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Create Vendor
                    </Button>
                </PermissionGuard>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4">
                    <CardTitle className="text-slate-800 text-lg font-semibold">Vendors</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex items-center p-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search vendors..."
                                className="pl-8 border-slate-200 focus:ring-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 transition-colors">
                                        <TableHead className="w-[120px] font-semibold text-slate-700 pl-4">Code</TableHead>
                                        <TableHead className="min-w-[200px] font-semibold text-slate-700">Vendor Name</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Contact Person</TableHead>
                                        <TableHead className="font-semibold text-slate-700">City</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700 pr-4">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading vendors...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data && data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-slate-500 italic">
                                                No vendors found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((vendor: Vendor) => (
                                            <TableRow key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium text-primary pl-4">{vendor.vendorCode}</TableCell>
                                                <TableCell className="font-medium text-slate-800">{vendor.vendorName}</TableCell>
                                                <TableCell className="text-slate-600">{vendor.contactPerson}</TableCell>
                                                <TableCell className="text-slate-600">{vendor.city}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={
                                                        vendor.status === 'ACTIVE'
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 px-3"
                                                            : "bg-slate-50 text-slate-600 border-slate-100 px-3"
                                                    } variant="outline">
                                                        {vendor.status === 'ACTIVE' ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-primary">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <PermissionGuard permission="master.vendor.update">
                                                                <DropdownMenuItem onClick={() => handleEdit(vendor.id)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="master.vendor.delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600"
                                                                    onClick={() => handleDeleteRequest(vendor.id)}
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

                    <div className="flex items-center justify-between p-4 border-t border-slate-100">
                        <div className="text-sm text-slate-500 font-medium">
                            Showing page {page} of {data?.meta?.totalPages || 1}
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-200 text-slate-600 hover:bg-slate-50 h-8 font-medium"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-200 text-slate-600 hover:bg-slate-50 h-8 font-medium"
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={!data || page >= (data.meta?.totalPages || 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            This action cannot be undone. This will permanently delete the vendor record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            Delete Record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
