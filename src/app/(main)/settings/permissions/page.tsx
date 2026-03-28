"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Plus, Search, Trash2, Edit, Loader2 } from "lucide-react"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { permissionService } from "@/services/permission-service"
import { Permission } from "@/types/permission"
import { PermissionDrawer } from "@/components/settings/permissions/permission-drawer"
import { toast } from "sonner"
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
import { useDebounce } from "@/hooks/use-debounce"

export default function PermissionsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)

    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["permissions", page, debouncedSearch],
        queryFn: () => permissionService.getPermissions({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => permissionService.deletePermission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] })
            toast.success("Permission deleted successfully")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete permission")
        }
    })

    const handleCreate = () => {
        setSelectedPermission(null)
        setDrawerOpen(true)
    }

    const handleEdit = (permission: Permission) => {
        setSelectedPermission(permission)
        setDrawerOpen(true)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
        setIsConfirmOpen(true)
    }

    const handleConfirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
            setDeleteId(null)
            setIsConfirmOpen(false)
        }
    }

    const permissions = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Permissions</h2>
                    <p className="text-muted-foreground">
                        Manage system permissions and access levels.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <PermissionGuard permission="master.permission.create">
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Create Permission
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search permissions..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-x-auto">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Name</TableHead>
                            <TableHead className="whitespace-nowrap">Identifier</TableHead>
                            <TableHead className="whitespace-nowrap">Menu / Module</TableHead>
                            <TableHead className="whitespace-nowrap">Description</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading permissions...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : permissions.length > 0 ? (
                            permissions.map((permission) => (
                                <TableRow key={permission.id}>
                                    <TableCell className="font-medium whitespace-normal break-words min-w-[150px]">{permission.name}</TableCell>
                                    <TableCell className="whitespace-normal break-all min-w-[150px]"><code>{permission.identifier}</code></TableCell>
                                    <TableCell className="whitespace-nowrap">{permission.subModule || permission.underMenu}</TableCell>
                                    <TableCell className="whitespace-normal break-words min-w-[250px]">{permission.description}</TableCell>
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
                                                <DropdownMenuItem
                                                    onClick={() => navigator.clipboard.writeText(permission.identifier)}
                                                >
                                                    Copy Identifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <PermissionGuard permission="master.permission.update">
                                                    <DropdownMenuItem onClick={() => handleEdit(permission)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                </PermissionGuard>
                                                <PermissionGuard permission="master.permission.delete">
                                                    <DropdownMenuItem
                                                        className="text-red-600"
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
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => Math.max(old - 1, 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {page} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => (old < totalPages ? old + 1 : old))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            <PermissionDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                permission={selectedPermission}
            />

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the permission
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
