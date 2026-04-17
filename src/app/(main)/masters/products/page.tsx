"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Edit, Trash2, RefreshCw, FilePlus, FileUp, Filter, ChevronUp, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { PermissionGuard } from "@/components/auth/permission-guard"

import { productService } from "@/services/masters/product-service"
import { Product } from "@/types/masters/product"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"

function SortArrows() {
    return (
        <span className="ml-1 inline-flex flex-col leading-none opacity-80">
            <ChevronUp className="h-2.5 w-2.5 -mb-1" />
            <ChevronDown className="h-2.5 w-2.5" />
        </span>
    )
}

export default function ProductsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const defaultFilters = { search: "", code: "", name: "", type: "" }
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
    const [draftFilters, setDraftFilters] = useState(defaultFilters)
    const debouncedSearch = useDebounce(appliedFilters.search, 500)

    const [deleteId, setDeleteId] = useState<number | null>(null)
    useEffect(() => {
        if (filtersOpen) setDraftFilters(appliedFilters)
    }, [appliedFilters, filtersOpen])

    const { data, isLoading } = useQuery({
        queryKey: ["products", page, debouncedSearch],
        queryFn: () =>
            productService.getProducts({
                page,
                limit,
                search: debouncedSearch,
                sortBy: "productCode",
                sortOrder: "asc",
            }),
    })

    const [exporting, setExporting] = useState(false)

    async function handleExportCsv() {
        setExporting(true)
        try {
            const { blob, filename } = await productService.exportProducts({
                search: debouncedSearch,
                sortBy: "productCode",
                sortOrder: "asc",
                productCode: debouncedCode || undefined,
                productName: debouncedName || undefined,
                productType: debouncedType || undefined,
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
            toast.success("Products exported")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to export products")
        } finally {
            setExporting(false)
        }
    }

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Product deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete product")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        router.push("/masters/products/create")
    }

    const handleEdit = (product: Product) => {
        router.push(`/masters/products/${product.id}/edit`)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    const total = data?.meta.total ?? 0
    const from = total === 0 ? 0 : (page - 1) * limit + 1
    const to = Math.min(page * limit, total)

    const filteredRows =
        data?.data.filter((product) => {
            if (appliedFilters.code && !(product.productCode || "").toLowerCase().includes(appliedFilters.code.toLowerCase())) return false
            if (appliedFilters.name && !(product.productName || "").toLowerCase().includes(appliedFilters.name.toLowerCase())) return false
            if (appliedFilters.type && !(product.productType || "").toLowerCase().includes(appliedFilters.type.toLowerCase())) return false
            return true
        }) ?? []

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
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Product Filters</DialogTitle>
                                <DialogDescription>Refine the product list from this popup, then apply the filters.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input placeholder="Search" className="h-9 bg-background" value={draftFilters.search} onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))} />
                                <Input placeholder="Product Code" className="h-9 bg-background" value={draftFilters.code} onChange={(e) => setDraftFilters((prev) => ({ ...prev, code: e.target.value }))} />
                                <Input placeholder="Product Name" className="h-9 bg-background" value={draftFilters.name} onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))} />
                                <Input placeholder="Product Type" className="h-9 bg-background" value={draftFilters.type} onChange={(e) => setDraftFilters((prev) => ({ ...prev, type: e.target.value }))} />
                            </div>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                                <Button type="button" onClick={applyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Refresh" onClick={() => queryClient.refetchQueries({ queryKey: ["products"], type: "active" })}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <PermissionGuard permission="master.product.create">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Add" onClick={handleCreate}>
                            <FilePlus className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <PermissionGuard permission="master.product.read">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Export CSV"
                            disabled={exporting}
                            onClick={() => void handleExportCsv()}
                        >
                            <FileUp className="h-4 w-4" />
                        </Button>
                    </PermissionGuard>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        title="Refresh"
                        onClick={() => queryClient.refetchQueries({ queryKey: ["products"], type: "active" })}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <PermissionGuard permission="master.product.create">
                    <Button type="button" className="h-9 rounded-md px-3" onClick={handleCreate} title="Add Product">
                        <FilePlus className="mr-1 h-4 w-4" />
                        Add Product
                    </Button>
                </PermissionGuard>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <Table className="min-w-[640px] border-0">
                    <TableHeader>
                        <TableRow className="border-0 bg-primary hover:bg-primary">
                            <TableHead className="h-11 font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">
                                    Product Code
                                    <SortArrows />
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">
                                    Product Name
                                    <SortArrows />
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary-foreground">
                                <span className="inline-flex items-center">
                                    Product Type
                                    <SortArrows />
                                </span>
                            </TableHead>
                            <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Loading products...
                                </TableCell>
                            </TableRow>
                        ) : filteredRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRows.map((product, index) => (
                                <TableRow
                                    key={product.id}
                                    className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                                >
                                    <TableCell className="font-medium text-foreground">{product.productCode}</TableCell>
                                    <TableCell className="max-w-[280px] text-foreground">
                                        <div className="break-words font-medium">{product.productName}</div>
                                    </TableCell>
                                    <TableCell className="uppercase text-foreground">{product.productType}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <PermissionGuard permission="master.product.update">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                                                    title="Edit"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGuard>
                                            <PermissionGuard permission="master.product.delete">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                                                    title="Delete"
                                                    onClick={() => handleDeleteRequest(product.id)}
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
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                        title="First"
                    >
                        «
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        title="Previous"
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
                        onClick={() => setPage((p) => p + 1)}
                        title="Next"
                    >
                        ›
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 min-w-8 px-2"
                        disabled={!data || page >= (data.meta?.totalPages || 1)}
                        onClick={() => setPage(data?.meta.totalPages ?? 1)}
                        title="Last"
                    >
                        »
                    </Button>
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-[var(--express-danger)] hover:opacity-95"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
