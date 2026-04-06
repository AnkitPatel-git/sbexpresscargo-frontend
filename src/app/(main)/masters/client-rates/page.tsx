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

import { clientRateService } from "@/services/masters/client-rate-service"
import { ClientRate } from "@/types/masters/client-rate"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function ClientRatesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [colFilters, setColFilters] = useState({ customer: "", product: "", origin: "", destination: "", service: "" })

    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["client-rates", page, debouncedSearch],
        queryFn: () => clientRateService.getClientRates({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => clientRateService.deleteClientRate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-rates"] })
            toast.success("Client rate deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete client rate")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/client-rates/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/client-rates/${id}/edit`)
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
        data?.data.filter((rate) => {
            const customerName = rate.customer?.name || ""
            const productName = rate.product?.productName || ""
            if (colFilters.customer && !customerName.toLowerCase().includes(colFilters.customer.toLowerCase())) return false
            if (colFilters.product && !productName.toLowerCase().includes(colFilters.product.toLowerCase())) return false
            if (colFilters.origin && !(rate.origin || "").toLowerCase().includes(colFilters.origin.toLowerCase())) return false
            if (colFilters.destination && !(rate.destination || "").toLowerCase().includes(colFilters.destination.toLowerCase())) return false
            if (colFilters.service && !(rate.service || "").toLowerCase().includes(colFilters.service.toLowerCase())) return false
            return true
        }) ?? []

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <PermissionGuard permission="master.client_rate.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}><FilePlus className="h-4 w-4" /></Button>
                    </PermissionGuard>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary"><FileUp className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["client-rates"], type: "active" })}><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input placeholder="Search client rates..." className="h-9 w-44 bg-background sm:w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <PermissionGuard permission="master.client_rate.create">
                        <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}><Plus className="mr-1 h-4 w-4" />Add Client Rate</Button>
                    </PermissionGuard>
                </div>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1180px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">Customer <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Product <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Origin <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Destination <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Service <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Rate <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                        <TableRow className="border-b border-border bg-card hover:bg-card">
                            <TableHead className="p-2"><Input placeholder="Customer" className="h-8 border-border bg-background text-xs" value={colFilters.customer} onChange={(e) => setColFilters((f) => ({ ...f, customer: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Product" className="h-8 border-border bg-background text-xs" value={colFilters.product} onChange={(e) => setColFilters((f) => ({ ...f, product: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Origin" className="h-8 border-border bg-background text-xs" value={colFilters.origin} onChange={(e) => setColFilters((f) => ({ ...f, origin: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Destination" className="h-8 border-border bg-background text-xs" value={colFilters.destination} onChange={(e) => setColFilters((f) => ({ ...f, destination: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Service" className="h-8 border-border bg-background text-xs" value={colFilters.service} onChange={(e) => setColFilters((f) => ({ ...f, service: e.target.value }))} /></TableHead>
                            <TableHead className="p-2"><Input placeholder="Rate" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
                            <TableHead className="p-2" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading client rates...</TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No rates found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((rate: ClientRate, index) => (
                                <TableRow key={rate.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{rate.customer?.name || `ID: ${rate.customerId}`}</TableCell>
                                    <TableCell className="font-medium text-foreground">{rate.product?.productName || `ID: ${rate.productId}`}</TableCell>
                                    <TableCell className="text-foreground">{rate.origin}</TableCell>
                                    <TableCell className="text-foreground">{rate.destination}</TableCell>
                                    <TableCell className="text-foreground">{rate.service}</TableCell>
                                    <TableCell className="font-semibold text-foreground">{typeof rate.rateValue === "string" ? parseFloat(rate.rateValue).toFixed(2) : (rate.rateValue?.toFixed(2) || "0.00")}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.client_rate.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(rate.id)}><Edit className="h-4 w-4" /></Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.client_rate.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(rate.id)}><Trash2 className="h-4 w-4" /></Button>
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
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)}>»</Button>
                </div>
            </div>
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the client rate
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
