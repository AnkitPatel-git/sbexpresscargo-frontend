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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { exceptionService } from "@/services/masters/exception-service"
import { ExceptionMaster } from "@/types/masters/exception"
import { ExceptionDrawer } from "@/components/masters/exception-drawer"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ExceptionPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedException, setSelectedException] = useState<ExceptionMaster | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["exceptions", page, debouncedSearch],
        queryFn: () => exceptionService.getExceptions({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => exceptionService.deleteException(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exceptions"] })
            toast.success("Exception deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete exception")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        setSelectedException(null)
        setDrawerOpen(true)
    }

    const handleEdit = (exception: ExceptionMaster) => {
        setSelectedException(exception)
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
                    <h1 className="text-3xl font-bold tracking-tight">Exception Master</h1>
                    <p className="text-muted-foreground">
                        Manage delivery exceptions, statuses, and tracking codes.
                    </p>
                </div>
                <PermissionGuard permission="master.exception.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Exception
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exceptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search exceptions..."
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
                                        <TableHead className="min-w-[200px]">Exception Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-center">Inscan</TableHead>
                                        <TableHead className="text-center">Mobile</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Loading exceptions...
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data && data.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No exceptions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((exception: ExceptionMaster) => (
                                            <TableRow key={exception.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-blue-600">{exception.code}</TableCell>
                                                <TableCell className="font-medium">{exception.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {exception.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {exception.inscan ? (
                                                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600 mx-auto" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {exception.showOnMobileApps ? (
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
                                                            <PermissionGuard permission="master.exception.update">
                                                                <DropdownMenuItem onClick={() => handleEdit(exception)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="master.exception.delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(exception.id)}
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
                            Page {page} of {data?.meta.totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!data || page >= data.meta.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ExceptionDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                exception={selectedException}
            />

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the exception
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
