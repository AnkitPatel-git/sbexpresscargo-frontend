"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Check, X, FileUp, RefreshCw, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
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

import { serviceablePincodeService } from "@/services/utilities/serviceable-pincode-service"
import { ServiceablePincode } from "@/types/utilities/serviceable-pincode"
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

export default function ServiceablePincodesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({
        pinCode: "",
        pinCodeName: "",
        destination: "",
    })

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

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const filteredRows =
        data?.data.filter((pincode) => {
            if (colFilters.pinCode && !pincode.pinCode.toLowerCase().includes(colFilters.pinCode.toLowerCase())) return false
            if (colFilters.pinCodeName && !pincode.pinCodeName.toLowerCase().includes(colFilters.pinCodeName.toLowerCase())) return false
            if (colFilters.destination && !(pincode.destination || "").toLowerCase().includes(colFilters.destination.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.area.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Import">
                        <FileUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["serviceable-pincodes"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <PermissionGuard permission="master.area.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Pincode">
                        <Plus className="mr-1 h-4 w-4" /> Add Pincode
                    </Button>
                </PermissionGuard>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Search:</span>
                <Input placeholder="Search pincodes..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1100px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Pin Code <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Pin Code Name <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Service Center <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Destination <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground"><span className="inline-flex items-center">Serviceable <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground"><span className="inline-flex items-center">ODA <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Pin Code" className="h-8 border-border bg-background text-xs" value={colFilters.pinCode} onChange={(e) => setColFilters((f) => ({ ...f, pinCode: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Pin Code Name" className="h-8 border-border bg-background text-xs" value={colFilters.pinCodeName} onChange={(e) => setColFilters((f) => ({ ...f, pinCodeName: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Service Center" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Destination" className="h-8 border-border bg-background text-xs" value={colFilters.destination} onChange={(e) => setColFilters((f) => ({ ...f, destination: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Serviceable" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2"><Input placeholder="ODA" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading pincodes...</TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No pincodes found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((pincode: ServiceablePincode, index) => (
                                <TableRow key={pincode.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{pincode.pinCode}</TableCell>
                                    <TableCell className="font-medium text-foreground">{pincode.pinCodeName}</TableCell>
                                    <TableCell className="text-foreground">
                                        <div className="flex flex-col">
                                            <span>{pincode.serviceCenter?.name || "N/A"}</span>
                                            <span className="text-xs text-muted-foreground">{pincode.serviceCenter?.code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-foreground">{pincode.destination}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {pincode.serviceable ? (
                                                <div className="bg-green-100 p-1 rounded-full"><Check className="h-3 w-3 text-green-600" /></div>
                                            ) : (
                                                <div className="bg-red-100 p-1 rounded-full"><X className="h-3 w-3 text-red-600" /></div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {pincode.oda ? (
                                                <div className="bg-amber-100 p-1 rounded-full"><Check className="h-3 w-3 text-amber-600" /></div>
                                            ) : (
                                                <div className="bg-gray-100 p-1 rounded-full"><X className="h-3 w-3 text-gray-400" /></div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.area.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" title="Edit" onClick={() => handleEdit(pincode.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.area.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" title="Delete" onClick={() => handleDeleteRequest(pincode.id)}>
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
