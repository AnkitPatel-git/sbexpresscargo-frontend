"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Edit, FilePlus, Filter, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PermissionGuard } from "@/components/auth/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { customerService } from "@/services/masters/customer-service"
import { serviceMapService } from "@/services/masters/service-map-service"
import { vendorConfigService } from "@/services/masters/vendor-config-service"
import { vendorService } from "@/services/masters/vendor-service"
import { VendorConfig } from "@/types/masters/vendor-config"

export default function VendorConfigPage() {
    const router = useRouter()
    const queryClient = useQueryClient()

    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const defaultFilters = {
        search: "",
        vendorId: "all",
        serviceMapId: "all",
        customerId: "all",
        environment: "all",
        isActive: "all",
    }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["vendor-configs", page, limit, debouncedSearch, appliedFilters.vendorId, appliedFilters.serviceMapId, appliedFilters.customerId, appliedFilters.environment, appliedFilters.isActive],
        queryFn: () =>
            vendorConfigService.getVendorConfigs({
                page,
                limit,
                search: debouncedSearch,
                vendorId: appliedFilters.vendorId === "all" ? undefined : Number(appliedFilters.vendorId),
                serviceMapId: appliedFilters.serviceMapId === "all" ? undefined : Number(appliedFilters.serviceMapId),
                customerId: appliedFilters.customerId === "all" ? undefined : Number(appliedFilters.customerId),
                environment: appliedFilters.environment === "all" ? undefined : appliedFilters.environment,
                isActive:
                    appliedFilters.isActive === "all"
                        ? undefined
                        : appliedFilters.isActive === "true",
            }),
    })

    const { data: vendorsResponse } = useQuery({
        queryKey: ["vendor-config-page-vendors"],
        queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: "vendorName", sortOrder: "asc" }),
    })

    const { data: customersResponse } = useQuery({
        queryKey: ["vendor-config-page-customers"],
        queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
    })

    const { data: serviceMapsResponse } = useQuery({
        queryKey: ["vendor-config-page-service-maps"],
        queryFn: () => serviceMapService.getServiceMaps({ page: 1, limit: 100, sortBy: "vendor", sortOrder: "asc" }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => vendorConfigService.deleteVendorConfig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-configs"] })
            toast.success("Vendor config deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete vendor config")
            setDeleteId(null)
        },
    })

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    const handleCreate = () => router.push("/masters/vendor-config/create")
    const handleEdit = (id: number) => router.push(`/masters/vendor-config/${id}/edit`)
    const confirmDelete = () => {
        if (deleteId != null) deleteMutation.mutate(deleteId)
    }
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

    return (
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
                    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Filters">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Vendor Config Filters</DialogTitle>
                                <DialogDescription>Filter vendor configs from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search configs..." className="h-9 bg-background sm:col-span-2" value={draftFilters.search} onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} />
                                <Select value={draftFilters.vendorId} onValueChange={(value) => setDraftFilters((current) => ({ ...current, vendorId: value }))}>
                                    <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue placeholder="Vendor" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All vendors</SelectItem>
                                        {vendorsResponse?.data?.map((vendor) => (
                                            <SelectItem key={vendor.id} value={String(vendor.id)}>
                                                {vendor.vendorName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={draftFilters.serviceMapId} onValueChange={(value) => setDraftFilters((current) => ({ ...current, serviceMapId: value }))}>
                                    <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue placeholder="Service map" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All service maps</SelectItem>
                                        {serviceMapsResponse?.data?.map((serviceMap) => (
                                            <SelectItem key={serviceMap.id} value={String(serviceMap.id)}>
                                                {serviceMap.vendor?.vendorName ? `${serviceMap.vendor.vendorName} - ${serviceMap.serviceType}` : `${serviceMap.serviceType} - ${serviceMap.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={draftFilters.customerId} onValueChange={(value) => setDraftFilters((current) => ({ ...current, customerId: value }))}>
                                    <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue placeholder="Customer" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All customers</SelectItem>
                                        {customersResponse?.data?.map((customer) => (
                                            <SelectItem key={customer.id} value={String(customer.id)}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={draftFilters.environment} onValueChange={(value) => setDraftFilters((current) => ({ ...current, environment: value }))}>
                                    <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue placeholder="Environment" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All environments</SelectItem>
                                        <SelectItem value="SANDBOX">Sandbox</SelectItem>
                                        <SelectItem value="PRODUCTION">Production</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={draftFilters.isActive} onValueChange={(value) => setDraftFilters((current) => ({ ...current, isActive: value }))}>
                                    <SelectTrigger className="h-9 border-border bg-background text-xs"><SelectValue placeholder="Active" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => queryClient.refetchQueries({ queryKey: ["vendor-configs"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <PermissionGuard permission="master.vendor_config.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                </div>
                <PermissionGuard permission="master.vendor_config.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate}>
                        <FilePlus className="mr-1 h-4 w-4" />
                        Add Config
                    </Button>
                </PermissionGuard>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[1160px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">
                                Vendor <ChevronUp className="ml-1 inline h-3 w-3" /><ChevronDown className="-ml-1 inline h-3 w-3" />
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Service Map</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Customer</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Environment</TableHead>
                            <TableHead className="font-semibold text-primary-foreground">Base URL</TableHead>
                            <TableHead className="font-semibold text-primary-foreground text-center">Active</TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>

                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading vendor configs...
                                    </span>
                                </TableCell>
                            </TableRow>
                        ) : (data?.data?.length ?? 0) === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No vendor configs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data.map((vendorConfig: VendorConfig, index) => (
                                <TableRow
                                    key={vendorConfig.id}
                                    className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                                >
                                    <TableCell className="font-medium text-foreground">
                                        {vendorConfig.vendor?.vendorName || "-"}
                                    </TableCell>
                                    <TableCell className="text-foreground">
                                        {vendorConfig.serviceMap
                                            ? `${vendorConfig.serviceMap.serviceType}${vendorConfig.serviceMap.vendorLink ? ` - ${vendorConfig.serviceMap.vendorLink}` : ""}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-foreground">{vendorConfig.customer?.name || "-"}</TableCell>
                                    <TableCell className="text-foreground">{vendorConfig.environment}</TableCell>
                                    <TableCell className="max-w-[220px] truncate text-xs text-foreground">
                                        {vendorConfig.baseUrl || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={vendorConfig.isActive ? "success" : "secondary"}>
                                            {vendorConfig.isActive ? "Yes" : "No"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.vendor_config.update">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                                                    onClick={() => handleEdit(vendorConfig.id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.vendor_config.delete">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                                                    onClick={() => setDeleteId(vendorConfig.id)}
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
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    >
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
                        onClick={() => setPage((current) => current + 1)}
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
                <AlertDialogContent className="max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            This action cannot be undone. This will permanently delete the vendor config record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel className="border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="border-none bg-red-600 text-white hover:bg-red-700">
                            Delete Record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
