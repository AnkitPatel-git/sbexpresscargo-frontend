"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Filter, FilePlus, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"

import { cityService } from "@/services/masters/city-service"
import { City } from "@/types/masters/city"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { MasterExcelImportButton } from "@/components/masters/master-excel-import-button"
import { useDebounce } from "@/hooks/use-debounce"

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    )
}

export default function CitiesPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [filtersOpen, setFiltersOpen] = useState(false)
    const defaultFilters = { search: "", cityName: "", country: "", state: "" }
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["cities", page, debouncedSearch],
        queryFn: () => cityService.getCities({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => cityService.deleteCity(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cities"] })
            toast.success("City deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete city")
            setDeleteId(null)
        },
    })

    const total = data?.meta?.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)
    const filteredRows =
        data?.data.filter((city: City) => {
            if (appliedFilters.cityName && !city.cityName.toLowerCase().includes(appliedFilters.cityName.toLowerCase())) return false
            if (appliedFilters.country && !(city.country?.name || "").toLowerCase().includes(appliedFilters.country.toLowerCase())) return false
            if (appliedFilters.state && !(city.state?.stateName || "").toLowerCase().includes(appliedFilters.state.toLowerCase())) return false
            return true
        }) ?? []

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
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>City Filters</DialogTitle>
                                <DialogDescription>Refine the city list, then apply.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((p) => ({ ...p, search: e.target.value }))} />
                                <Input placeholder="City Name" className="h-9 bg-background" value={draftFilters.cityName} onChange={(e) => setDraftFilters((p) => ({ ...p, cityName: e.target.value }))} />
                                <Input placeholder="Country" className="h-9 bg-background" value={draftFilters.country} onChange={(e) => setDraftFilters((p) => ({ ...p, country: e.target.value }))} />
                                <Input placeholder="State" className="h-9 bg-background" value={draftFilters.state} onChange={(e) => setDraftFilters((p) => ({ ...p, state: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={() => { setDraftFilters(defaultFilters); setAppliedFilters(defaultFilters); setPage(1); setFiltersOpen(false) }}>Reset</Button>
                                <Button type="button" onClick={() => { setAppliedFilters(draftFilters); setPage(1); setFiltersOpen(false) }}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <PermissionGuard permission="master.city.create">
                        <MasterExcelImportButton master="cities" label="Cities" queryKey={["cities"]} />
                    </PermissionGuard>
                </div>
                <PermissionGuard permission="master.city.create">
                    <Button type="button" variant="default" className="h-8 gap-2 px-3 font-semibold" onClick={() => router.push("/masters/cities/create")}>
                        <FilePlus className="h-4 w-4" />
                        Add City
                    </Button>
                </PermissionGuard>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[760px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">City <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">State <SortArrows /></span></TableHead>
                            <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Country <SortArrows /></span></TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading cities...</TableCell></TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No cities found.</TableCell></TableRow>
                        ) : (
                            filteredRows.map((city: City, index) => (
                                <TableRow key={city.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                                    <TableCell className="font-medium">{city.cityName}</TableCell>
                                    <TableCell>{city.state?.stateName || "-"}</TableCell>
                                    <TableCell>{city.country?.name || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.city.update">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10" onClick={() => router.push(`/masters/cities/${city.id}/edit`)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.city.delete">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10" onClick={() => setDeleteId(city.id)}>
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
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>‹</Button>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data?.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>›</Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={!data || page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(data?.meta?.totalPages ?? 1)}>»</Button>
                </div>
            </div>
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete city?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cities linked to serviceable pincodes cannot be deleted. This action soft-deletes the city otherwise.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
