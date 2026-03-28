"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { countryService } from "@/services/masters/country-service"
import { Country } from "@/types/masters/country"
import { CountryDrawer } from "@/components/masters/country-drawer"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { useDebounce } from "@/hooks/use-debounce"

export default function CountriesPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const [limit] = useState(10)

    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["countries", page, debouncedSearch],
        queryFn: () => countryService.getCountries({ page, limit, search: debouncedSearch }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => countryService.deleteCountry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["countries"] })
            toast.success("Country deleted successfully")
            setDeleteId(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete country")
            setDeleteId(null)
        },
    })

    const handleCreate = () => {
        setSelectedCountry(null)
        setDrawerOpen(true)
    }

    const handleEdit = (country: Country) => {
        setSelectedCountry(country)
        setDrawerOpen(true)
    }

    const handleDeleteRequest = (id: number) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Country Master</h1>
                    <p className="text-muted-foreground">
                        Manage your service countries and international zones.
                    </p>
                </div>
                <PermissionGuard permission="master.country.create">
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Create Country
                    </Button>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Countries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 bg-white sticky top-0 z-10">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search countries..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-[120px]">Code</TableHead>
                                        <TableHead className="min-w-[200px]">Country Name</TableHead>
                                        <TableHead>Weight Unit</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>ISD Code</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Loading countries...
                                            </TableCell>
                                        </TableRow>
                                    ) : data?.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No countries found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.data.map((country) => (
                                            <TableRow key={country.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-blue-600 uppercase">{country.code}</TableCell>
                                                <TableCell className="font-medium">{country.name}</TableCell>
                                                <TableCell className="uppercase">{country.weightUnit}</TableCell>
                                                <TableCell>{country.currency}</TableCell>
                                                <TableCell>{country.isdCode}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <PermissionGuard permission="master.country.update">
                                                                <DropdownMenuItem onClick={() => handleEdit(country)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                            <PermissionGuard permission="master.country.delete">
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleDeleteRequest(country.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                </DropdownMenuItem>
                                                            </PermissionGuard>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {page} of {data?.meta.totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={!data || page >= (data.meta?.totalPages || 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <CountryDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                country={selectedCountry}
            />

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the country
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
