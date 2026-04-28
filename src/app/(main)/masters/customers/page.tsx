"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, FileDown, FilePlus, Filter } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { customerService } from "@/services/masters/customer-service"
import { serviceCenterService } from "@/services/masters/service-center-service"
import { Customer } from "@/types/masters/customer"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { MasterExcelImportButton } from "@/components/masters/master-excel-import-button"
import { SortableColumnHeader, type SortOrder } from "@/components/ui/sortable-column-header"

type CustomerFilters = {
    search: string
    code: string
    name: string
    mobile: string
    serviceCenterId: string
    status: string
}

const emptyFilters: CustomerFilters = {
    search: "",
    code: "",
    name: "",
    mobile: "",
    serviceCenterId: "all",
    status: "all",
}

export default function CustomersPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState<CustomerFilters>(emptyFilters)
    const [draftFilters, setDraftFilters] = useState<CustomerFilters>(emptyFilters)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [sortBy, setSortBy] = useState("code")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (filtersOpen) {
            setDraftFilters(appliedFilters)
        }
    }, [appliedFilters, filtersOpen])

    const { data: serviceCentersResponse } = useQuery({
        queryKey: ["customer-filters-service-centers"],
        queryFn: () => serviceCenterService.getServiceCenters({ page: 1, limit: 100, sortBy: "code", sortOrder: "asc" }),
    })

    const listParams = {
        page,
        limit,
        search: appliedFilters.search || undefined,
        sortBy,
        sortOrder,
        code: appliedFilters.code || undefined,
        name: appliedFilters.name || undefined,
        mobile: appliedFilters.mobile || undefined,
        serviceCenterId: appliedFilters.serviceCenterId === "all" ? undefined : Number(appliedFilters.serviceCenterId),
        status: appliedFilters.status === "all" ? undefined : appliedFilters.status,
    }

    const { data, isLoading } = useQuery({
        queryKey: ["customers", listParams],
        queryFn: () => customerService.getCustomers(listParams),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await customerService.exportCustomers(listParams)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Customers exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export customers")
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => customerService.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast.success("Customer deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete customer")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push('/masters/customers/create')
    }

    const handleEdit = (id: number) => {
        router.push(`/masters/customers/${id}/edit`)
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
    const rows = data?.data ?? []

    const applyFilters = () => {
        setAppliedFilters(draftFilters)
        setPage(1)
        setFiltersOpen(false)
    }

    const resetFilters = () => {
        setDraftFilters(emptyFilters)
        setAppliedFilters(emptyFilters)
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
                    {isMounted ? (
                        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Customer Filters</DialogTitle>
                                    <DialogDescription>Apply customer filters from this popup and keep the table clean.</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Input placeholder="Search customers..." className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                    <Input placeholder="Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                    <Input placeholder="Customer Name" className="h-9 bg-background" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                                    <Input placeholder="Mobile" className="h-9 bg-background" value={draftFilters.mobile} onChange={(e) => setDraftFilters((prev) => ({ ...prev, mobile: e.target.value }))} />
                                    <div className="sm:col-span-2">
                                        <Select value={draftFilters.serviceCenterId} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, serviceCenterId: value }))}>
                                            <SelectTrigger className="h-9 w-full bg-background">
                                                <SelectValue placeholder="Service Center" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All service centers</SelectItem>
                                                {(serviceCentersResponse?.data ?? []).map((serviceCenter) => (
                                                    <SelectItem key={serviceCenter.id} value={String(serviceCenter.id)}>
                                                        {serviceCenter.code} - {serviceCenter.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Select value={draftFilters.status} onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, status: value }))}>
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
                                    <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                    <Button type="button" onClick={applyFilters}>Apply</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters" disabled>
                            <Filter className="h-4 w-4" />
                        </Button>
                    )}
                    <PermissionGuard permission="master.customer.create">
                        <MasterExcelImportButton master="customers" label="Customers" queryKey={["customers"]} />
                    </PermissionGuard>
                    <PermissionGuard permission="master.customer.read">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Export CSV"
                            disabled={exporting}
                            onClick={() => void handleExportCsv()}
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
                <PermissionGuard permission="master.customer.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={handleCreate}>
                        <FilePlus className="h-4 w-4" />
                        Add Customer
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1080px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground"><SortableColumnHeader label="Code" field="code" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Customer Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Contact Person</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">City</TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Type" field="customerType" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><SortableColumnHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Loading customers...</TableCell></TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No customers found.</TableCell></TableRow>
                        ) : (
                            rows.map((customer: Customer, index) => (
                                <TableRow key={customer.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium text-foreground">{customer.code}</TableCell>
                                    <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                                    <TableCell className="text-foreground">{customer.contactPerson}</TableCell>
                                    <TableCell className="text-foreground">
                                        {customer.serviceablePincode?.cityName || "-"}
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{customer.customerType}</Badge></TableCell>
                                    <TableCell><Badge variant={customer.status === "ACTIVE" ? "success" : "secondary"} className={customer.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>{customer.status}</Badge></TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.customer.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => handleEdit(customer.id)}><Edit className="h-4 w-4" /></Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.customer.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => handleDeleteRequest(customer.id)}><Trash2 className="h-4 w-4" /></Button>
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
                            This action cannot be undone. This will permanently delete the customer
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
