"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, FilePlus, Filter } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { cn } from "@/lib/utils"
import { customerGroupService } from "@/services/masters/customer-group-service"
import type { CustomerGroup } from "@/types/masters/customer-group"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

type GroupFilters = { code: string; name: string; status: string }
const defaultFilters: GroupFilters = { code: "", name: "", status: "all" }

export default function CustomerGroupsPage() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState<GroupFilters>(defaultFilters)
    const [draftFilters, setDraftFilters] = useState<GroupFilters>(defaultFilters)
    const [sortBy, setSortBy] = useState("code")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const listParams = {
        page,
        limit,
        sortBy,
        sortOrder,
        code: appliedFilters.code || undefined,
        name: appliedFilters.name || undefined,
        status: appliedFilters.status === "all" ? undefined : appliedFilters.status,
    }

    const { data, isLoading } = useQuery({
        queryKey: ["customer-groups", listParams],
        queryFn: () => customerGroupService.getCustomerGroups(listParams),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerGroupService.deleteCustomerGroup(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-groups"] })
            queryClient.invalidateQueries({ queryKey: ["customer-form", "customer-groups"] })
            queryClient.invalidateQueries({ queryKey: ["customers-list-filter", "customer-groups"] })
            toast.success("Customer group deleted")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete customer group")
            setDeleteId(null)
        },
    })

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const rows = data?.data ?? []

    const applyFilters = () => {
        setAppliedFilters(draftFilters)
        setPage(1)
        setFiltersOpen(false)
    }

    const resetFilters = () => {
        setDraftFilters(defaultFilters)
        setAppliedFilters(defaultFilters)
        setPage(1)
        setFiltersOpen(false)
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
        setPage(1)
    }

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 self-start rounded-md border border-border p-1 sm:self-auto">
                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Customer group filters</DialogTitle>
                                <DialogDescription>Filter groups by code, name, or status.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input
                                    placeholder="Code"
                                    className="h-9 bg-background"
                                    value={draftFilters.code}
                                    onChange={(e) => setDraftFilters((p) => ({ ...p, code: e.target.value }))}
                                />
                                <Input
                                    placeholder="Name"
                                    className="h-9 bg-background"
                                    value={draftFilters.name}
                                    onChange={(e) => setDraftFilters((p) => ({ ...p, name: e.target.value }))}
                                />
                                <Select value={draftFilters.status} onValueChange={(v) => setDraftFilters((p) => ({ ...p, status: v }))}>
                                    <SelectTrigger className="h-9 w-full bg-background">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>
                                    Reset
                                </Button>
                                <Button type="button" onClick={applyFilters}>
                                    Apply
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <PermissionGuard permission="master.customer_group.create">
                    <Button
                        type="button"
                        variant="default"
                        className="h-8 gap-2 px-3 font-semibold"
                        onClick={() => router.push("/masters/customer-groups/create")}
                    >
                        <FilePlus className="h-4 w-4" />
                        Add customer group
                    </Button>
                </PermissionGuard>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[720px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Code" field="code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Loading customer groups...
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No customer groups found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((group: CustomerGroup, index) => (
                                <TableRow key={group.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{group.code}</TableCell>
                                    <TableCell className="font-medium text-foreground">{group.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={group.status === "ACTIVE" ? "success" : "secondary"}>{group.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.customer_group.update">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                                                    onClick={() => router.push(`/masters/customer-groups/${group.id}/edit`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.customer_group.delete">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                                                    onClick={() => setDeleteId(group.id)}
                                                >
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
                <p className="text-sm text-muted-foreground">
                    Showing {from} to {to} of {total} entries
                </p>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>
                        «
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                        ‹
                    </Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={!data || page >= (data.meta?.totalPages || 1)}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        ›
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={!data || page >= (data.meta?.totalPages || 1)}
                        onClick={() => setPage(data?.meta?.totalPages ?? 1)}
                    >
                        »
                    </Button>
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete customer group?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Customers linked to this group will become standalone (group cleared). This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId != null && deleteMutation.mutate(deleteId)}
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
