"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Loader2, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

import { permissionService } from "@/services/permission-service"
import { GroupedPermission, Permission } from "@/types/permission"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    )
}

export default function PermissionsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({
        name: "",
        module: "",
        identifier: "",
        description: "",
    })

    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [roleId, setRoleId] = useState("")
    const [permissionId, setPermissionId] = useState("")

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
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete permission")
            setDeleteId(null)
        },
    })

    const { data: groupedData, isLoading: isGroupedLoading } = useQuery({
        queryKey: ["permissions-grouped"],
        queryFn: () => permissionService.getGroupedPermissions(),
    })

    const roleIdNumber = useMemo(() => {
        const parsed = Number(roleId)
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }, [roleId])

    const { data: groupedForRole, isLoading: isRoleGroupedLoading } = useQuery({
        queryKey: ["permissions-grouped-role", roleIdNumber],
        queryFn: () => permissionService.getPermissionsForRole(roleIdNumber as number),
        enabled: roleIdNumber !== null,
    })

    const assignMutation = useMutation({
        mutationFn: ({ roleId, permissionId }: { roleId: number; permissionId: number }) =>
            permissionService.assignPermissionToRole(roleId, permissionId),
        onSuccess: () => {
            toast.success("Permission assigned to role successfully")
            queryClient.invalidateQueries({ queryKey: ["permissions-grouped-role", roleIdNumber] })
            setPermissionId("")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to assign permission")
        },
    })

    const removeMutation = useMutation({
        mutationFn: ({ roleId, permissionId }: { roleId: number; permissionId: number }) =>
            permissionService.removePermissionFromRole(roleId, permissionId),
        onSuccess: () => {
            toast.success("Permission removed from role successfully")
            queryClient.invalidateQueries({ queryKey: ["permissions-grouped-role", roleIdNumber] })
            setPermissionId("")
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to remove permission")
        },
    })

    const handleCreate = () => {
        router.push("/utilities/permissions/create")
    }

    const handleEdit = (id: number) => {
        router.push(`/utilities/permissions/${id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    const triggerRolePermissionAction = (action: "assign" | "remove") => {
        const parsedRoleId = Number(roleId)
        const parsedPermissionId = Number(permissionId)
        if (!Number.isFinite(parsedRoleId) || parsedRoleId <= 0) {
            toast.error("Please enter a valid role id")
            return
        }
        if (!Number.isFinite(parsedPermissionId) || parsedPermissionId <= 0) {
            toast.error("Please enter a valid permission id")
            return
        }

        const payload = { roleId: parsedRoleId, permissionId: parsedPermissionId }
        if (action === "assign") {
            assignMutation.mutate(payload)
            return
        }
        removeMutation.mutate(payload)
    }

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    const filteredRows =
        data?.data.filter((permission) => {
            const moduleValue = (permission.subModule || permission.underMenu || permission.module || "").toLowerCase()
            if (colFilters.name && !permission.name.toLowerCase().includes(colFilters.name.toLowerCase())) return false
            if (colFilters.module && !moduleValue.includes(colFilters.module.toLowerCase())) return false
            if (colFilters.identifier && !permission.identifier.toLowerCase().includes(colFilters.identifier.toLowerCase())) return false
            if (colFilters.description && !(permission.description || "").toLowerCase().includes(colFilters.description.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="settings.permissions.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Import">
                        <FileUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        title="Refresh"
                        onClick={() => queryClient.refetchQueries({ queryKey: ["permissions"], type: "active" })}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <PermissionGuard permission="settings.permissions.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Permission">
                        <Plus className="mr-1 h-4 w-4" />
                        Add Permission
                    </Button>
                </PermissionGuard>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Search:</span>
                <Input
                    placeholder="Search permissions..."
                    className="h-9 w-44 bg-background sm:w-52"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                />
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[980px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Name <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Module / Menu <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Identifier <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Description <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Name" className="h-8 border-border bg-background text-xs" value={colFilters.name} onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Module / Menu" className="h-8 border-border bg-background text-xs" value={colFilters.module} onChange={(e) => setColFilters((f) => ({ ...f, module: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Identifier" className="h-8 border-border bg-background text-xs" value={colFilters.identifier} onChange={(e) => setColFilters((f) => ({ ...f, identifier: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Description" className="h-8 border-border bg-background text-xs" value={colFilters.description} onChange={(e) => setColFilters((f) => ({ ...f, description: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" />Loading permissions...</span>
                                </TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No permissions found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((permission: Permission, index) => (
                                <TableRow key={permission.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{permission.name}</TableCell>
                                    <TableCell className="text-foreground">{permission.subModule || permission.underMenu || permission.module}</TableCell>
                                    <TableCell className="font-mono text-xs text-foreground">{permission.identifier}</TableCell>
                                    <TableCell className="max-w-xs truncate text-foreground">{permission.description}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="settings.permissions.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(permission.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="settings.permissions.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(permission.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">Showing {from} to {to} of {total} entries</p>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)} title="First">«</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} title="Previous">‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} title="Next">›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)} title="Last">»</Button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Grouped Permissions</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => queryClient.refetchQueries({ queryKey: ["permissions-grouped"], type: "active" })}
                        >
                            Refresh
                        </Button>
                    </div>
                    {isGroupedLoading ? (
                        <div className="text-sm text-muted-foreground">Loading grouped permissions...</div>
                    ) : (
                        <div className="max-h-72 space-y-3 overflow-auto pr-1">
                            {(groupedData?.data ?? []).map((group: GroupedPermission) => (
                                <div key={group.underMenu} className="rounded border border-border p-2">
                                    <p className="text-xs font-semibold text-primary">{group.underMenu}</p>
                                    <div className="mt-1 space-y-1">
                                        {group.resources.map((resource) => (
                                            <div key={resource.resourceKey} className="text-xs text-muted-foreground">
                                                <span className="font-medium text-foreground">{resource.resource}</span>
                                                <span> - {resource.actions.map((action) => action.name).join(", ")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-md border border-border bg-background p-4">
                    <h3 className="mb-3 text-sm font-semibold">Role Permission Mapping</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            placeholder="Role ID"
                            inputMode="numeric"
                        />
                        <Input
                            value={permissionId}
                            onChange={(e) => setPermissionId(e.target.value)}
                            placeholder="Permission ID"
                            inputMode="numeric"
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => triggerRolePermissionAction("assign")}
                            disabled={assignMutation.isPending || removeMutation.isPending}
                        >
                            Assign
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => triggerRolePermissionAction("remove")}
                            disabled={assignMutation.isPending || removeMutation.isPending}
                        >
                            Remove
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                if (roleIdNumber !== null) {
                                    queryClient.invalidateQueries({ queryKey: ["permissions-grouped-role", roleIdNumber] })
                                }
                            }}
                        >
                            Refresh Role View
                        </Button>
                    </div>

                    <div className="mt-3 max-h-72 overflow-auto rounded border border-border p-2 text-xs">
                        {roleIdNumber === null ? (
                            <p className="text-muted-foreground">Enter a role id to load grouped permissions for role.</p>
                        ) : isRoleGroupedLoading ? (
                            <p className="text-muted-foreground">Loading role permissions...</p>
                        ) : (
                            <div className="space-y-2">
                                {(groupedForRole?.data ?? []).map((group: GroupedPermission) => (
                                    <div key={group.underMenu}>
                                        <p className="font-semibold text-primary">{group.underMenu}</p>
                                        {group.resources.map((resource) => (
                                            <div key={resource.resourceKey} className="ml-2 mt-1">
                                                <p className="font-medium text-foreground">{resource.resource}</p>
                                                <p className="text-muted-foreground">
                                                    {resource.actions
                                                        .filter((action) => action.granted)
                                                        .map((action) => `${action.name} (#${action.id})`)
                                                        .join(", ") || "No granted actions"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
