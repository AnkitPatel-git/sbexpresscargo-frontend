"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit, FilePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { partnerAppService } from "@/services/masters/partner-app-service"
import { PartnerApp } from "@/types/masters/partner-app"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

export default function PartnerAppPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [sortBy, setSortBy] = useState("updatedAt")
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

    const { data, isLoading } = useQuery({
        queryKey: ["partner-apps", page, limit, debouncedSearch, sortBy, sortOrder],
        queryFn: () =>
            partnerAppService.getPartnerApps({
                page,
                limit,
                search: debouncedSearch,
                sortBy,
                sortOrder,
            }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => partnerAppService.deletePartnerApp(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partner-apps"] })
            toast.success("Partner app deleted")
            setDeleteId(null)
        },
        onError: (error: Error) => toast.error(error.message),
    })

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortBy(field)
            setSortOrder("asc")
        }
    }

    const totalPages = data?.meta?.totalPages ?? 1

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Partner Apps</h1>
                    <p className="text-muted-foreground">API credentials and tracking push for customer integrations</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="h-8 w-full sm:w-[240px]"
                    />
                    <PermissionGuard permission="master.partner_app.create">
                        <Button
                            type="button"
                            variant="default"
                            className="h-8 gap-2 px-3 font-semibold"
                            onClick={() => router.push("/masters/partner-apps/create")}
                        >
                            <FilePlus className="h-4 w-4" />
                            Add Partner App
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[960px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Code" field="code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <SortableColumnHeader label="Adapter" field="adapterCode" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Customers</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Client ID</TableHead>
                            <TableHead className="font-semibold text-primary-foreground text-center">
                                <SortableColumnHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="justify-center" />
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading partner apps...
                                    </span>
                                </TableCell>
                            </TableRow>
                        ) : (data?.data?.length ?? 0) === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No partner apps found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((row: PartnerApp, index) => (
                                <TableRow
                                    key={row.id}
                                    className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                                >
                                    <TableCell className="font-medium">{row.code}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.adapterCode}</TableCell>
                                    <TableCell>{row.customers?.length ?? 0}</TableCell>
                                    <TableCell className="font-mono text-xs">{row.clientId}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={row.status === "ACTIVE" ? "success" : "secondary"}>
                                            {row.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.partner_app.update">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => router.push(`/masters/partner-apps/${row.id}/edit`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.partner_app.delete">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDeleteId(row.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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

            {totalPages > 1 && (
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                    </Button>
                    <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            )}

            <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete partner app?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This disables the partner API credentials. Existing shipments are not deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId != null && deleteMutation.mutate(deleteId)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
