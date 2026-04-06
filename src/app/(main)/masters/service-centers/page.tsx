"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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
import { cn } from "@/lib/utils"

import { serviceCenterService } from "@/services/masters/service-center-service"
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

export default function ServiceCentersPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({
        code: "",
        name: "",
        subName: "",
        city: "",
        state: "",
        telephone: "",
    })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["service-centers", page, debouncedSearch],
        queryFn: () => serviceCenterService.getServiceCenters({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => serviceCenterService.deleteServiceCenter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service-centers"] })
            toast.success("Service center deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete service center")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/service-centers/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/service-centers/${id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const filteredRows =
        data?.data.filter((sc) => {
            if (colFilters.code && !(sc.code || "").toLowerCase().includes(colFilters.code.toLowerCase())) return false
            if (colFilters.name && !(sc.name || "").toLowerCase().includes(colFilters.name.toLowerCase())) return false
            if (colFilters.subName && !(sc.subName || "").toLowerCase().includes(colFilters.subName.toLowerCase())) return false
            if (colFilters.city && !(sc.destination || "").toLowerCase().includes(colFilters.city.toLowerCase())) return false
            if (colFilters.state && !(sc.state || "").toLowerCase().includes(colFilters.state.toLowerCase())) return false
            if (colFilters.telephone && !(sc.telephone || "").toLowerCase().includes(colFilters.telephone.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.service_center.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Import">
                        <FileUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["service-centers"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <PermissionGuard permission="master.service_center.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Service Center">
                        <Plus className="mr-1 h-4 w-4" /> Add Service Center
                    </Button>
                </PermissionGuard>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Search:</span>
                <Input placeholder="Search service centers..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1150px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Code <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">SC Name <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Sub Name <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">City <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">State <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Telephone <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Code" className="h-8 border-border bg-background text-xs" value={colFilters.code} onChange={(e) => setColFilters((f) => ({ ...f, code: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="SC Name" className="h-8 border-border bg-background text-xs" value={colFilters.name} onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Sub Name" className="h-8 border-border bg-background text-xs" value={colFilters.subName} onChange={(e) => setColFilters((f) => ({ ...f, subName: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="City" className="h-8 border-border bg-background text-xs" value={colFilters.city} onChange={(e) => setColFilters((f) => ({ ...f, city: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="State" className="h-8 border-border bg-background text-xs" value={colFilters.state} onChange={(e) => setColFilters((f) => ({ ...f, state: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Telephone" className="h-8 border-border bg-background text-xs" value={colFilters.telephone} onChange={(e) => setColFilters((f) => ({ ...f, telephone: e.target.value }))} /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading service centers...</TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No service centers found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((sc, index) => (
                                <TableRow key={sc.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{sc.code}</TableCell>
                                    <TableCell className="font-medium text-foreground">{sc.name}</TableCell>
                                    <TableCell className="text-foreground">{sc.subName}</TableCell>
                                    <TableCell className="text-foreground">{sc.destination}</TableCell>
                                    <TableCell className="text-foreground">{sc.state}</TableCell>
                                    <TableCell className="text-foreground">{sc.telephone}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.service_center.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(sc.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.service_center.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(sc.id)}>
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
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data?.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} title="Next">›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)} title="Last">»</Button>
                </div>
            </div>
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the service center
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
