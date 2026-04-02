"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Edit, MoreHorizontal, Plus, Search, Trash, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useDebounce } from "@/hooks/use-debounce";
import { creditNoteService } from "@/services/transactions/credit-note-service";
import { CreditNote } from "@/types/transactions/credit-note";

export default function CreditNoteListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["credit-notes", page, limit, debouncedSearch],
    queryFn: () => creditNoteService.getCreditNotes(page, limit, debouncedSearch),
  });

  const deleteMutation = useMutation({
    mutationFn: creditNoteService.deleteCreditNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      toast.success("Credit note deleted successfully");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete credit note");
      setDeleteId(null);
    },
  });

  const postMutation = useMutation({
    mutationFn: creditNoteService.postCreditNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      toast.success("Credit note posted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to post credit note");
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const handlePost = (id: number) => {
      postMutation.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Notes</h1>
          <p className="text-muted-foreground">Manage receipt expenses and credit notes.</p>
        </div>
        <PermissionGuard permission="transaction.credit-note.create">
          <Button onClick={() => router.push("/transactions/credit-note/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Credit Note
          </Button>
        </PermissionGuard>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search note No or customer..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Note No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice Ref</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Loading credit notes...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-red-500">
                    {error instanceof Error ? error.message : "Failed to load credit notes"}
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    No credit notes found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((note: CreditNote) => (
                  <TableRow key={note.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">{note.noteNo}</TableCell>
                    <TableCell>
                      {note.cnDate ? format(new Date(note.cnDate), "dd MMM yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                        {note.customer?.name || `Customer ID: ${note.customerId}`}
                    </TableCell>
                    <TableCell className="text-gray-500">{note.invoiceRef || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                        {note.grandTotal ? `₹${parseFloat(note.grandTotal).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        note.status === "POSTED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                      }>
                        {note.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {note.status === "DRAFT" && (
                              <>
                                <PermissionGuard permission="transaction.credit-note.update">
                                    <DropdownMenuItem onClick={() => handlePost(note.id)}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Post Note
                                    </DropdownMenuItem>
                                </PermissionGuard>
                                <DropdownMenuSeparator />
                              </>
                          )}
                          <PermissionGuard permission="transaction.credit-note.update">
                            <DropdownMenuItem
                              onClick={() => router.push(`/transactions/credit-note/${note.id}/edit`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="transaction.credit-note.delete">
                            <DropdownMenuItem
                              onClick={() => setDeleteId(note.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
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

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} notes
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the credit note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
