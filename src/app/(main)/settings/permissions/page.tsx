"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
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

import { permissionService } from "@/services/permission-service"
import { Permission } from "@/types/permission"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function PermissionsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["permissions", page, debouncedSearch],
        queryFn: () => permissionService.getPermissions({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => permissionService.deletePermission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["permissions"] })
            toast.success("Permission deleted successfully")
            setDeleteId(null)
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete permission")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/settings/permissions/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/settings/permissions/${id}/edit`)
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
                    <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
                    <p className="text-muted-foreground">
                        Manage system-wide permissions and access rules.
                    </p>
                </div>
                <PermissionGuard permission="settings.permissions.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Permission
                    </Button>
                </PermissionGuard>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle className="text-xl font-semibold">Permission List</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex items-center p-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search permissions..."
                                className="pl-8 bg-gray-50/50 border-gray-200"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-transparent">
                                    <TableHead className="font-semibold text-gray-700">Name</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Module / Menu</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Identifier</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                Loading permissions...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : data?.data && data.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No permissions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((permission: Permission) => (
                                        <TableRow key={permission.id} className="hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="font-medium text-primary">
                                                {permission.name}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {permission.subModule || permission.underMenu || permission.module}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-500">
                                                {permission.identifier}
                                            </TableCell>
                                            <TableCell className="text-gray-600 max-w-xs truncate">
                                                {permission.description}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuLabel className="text-xs text-gray-400 font-normal">Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(permission.identifier)
                                                                toast.success("Identifier copied to clipboard")
                                                            }}
                                                        >
                                                            Copy Identifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <PermissionGuard permission="settings.permissions.update">
                                                            <DropdownMenuItem onClick={() => handleEdit(permission.id)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                        </PermissionGuard>
                                                        <PermissionGuard permission="settings.permissions.delete">
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                                onClick={() => handleDeleteRequest(permission.id)}
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

                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                        <div className="text-sm text-muted-foreground">
                            Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{data?.meta?.totalPages || 1}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="h-8 px-4"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={!data || page >= (data?.meta?.totalPages || 0)}
                                className="h-8 px-4"
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
                            This action cannot be undone. This will permanently delete the permission rule.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 font-semibold text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
