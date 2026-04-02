"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Edit, MoreHorizontal, Plus, Search, Trash, CheckCircle2, XCircle, FileText } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useDebounce } from "@/hooks/use-debounce";
import { customerPaymentService } from "@/services/transactions/customer-payment-service";
import { CustomerPayment } from "@/types/transactions/customer-payment";

export default function CustomerPaymentListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-payments", page, limit, debouncedSearch],
    queryFn: () => customerPaymentService.getCustomerPayments(page, limit, debouncedSearch),
  });

  const deleteMutation = useMutation({
    mutationFn: customerPaymentService.deleteCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      toast.success("Payment deleted successfully");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete payment");
      setDeleteId(null);
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Payments</h1>
          <p className="text-muted-foreground">Manage and track customer payment transactions.</p>
        </div>
        <PermissionGuard permission="transaction.customer-payment.create">
          <Button onClick={() => router.push("/transactions/customer-payment/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Payment
          </Button>
        </PermissionGuard>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search payments..."
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
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date / Paid Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-red-500">
                    {error instanceof Error ? error.message : "Failed to load payments"}
                  </TableCell>
                </TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((payment: CustomerPayment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">
                        {payment.customer?.name || `Customer ID: ${payment.customerId}`}
                    </TableCell>
                    <TableCell className="font-semibold text-green-700">₹{parseFloat(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{payment.date ? format(new Date(payment.date), "dd MMM yyyy") : "-"}</div>
                      <div className="text-xs text-gray-500">Paid: {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy") : "-"}</div>
                    </TableCell>
                    <TableCell>
                      {payment.approved ? (
                        <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4 mr-1"/> Approved</span>
                      ) : (
                        <span className="flex items-center text-amber-600 text-sm font-medium"><XCircle className="w-4 h-4 mr-1"/> Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                        {payment.fileName ? (
                            <div className="flex items-center text-blue-600 text-sm">
                                <FileText className="w-4 h-4 mr-1"/> {payment.fileName}
                            </div>
                        ) : (
                            <span className="text-gray-400 text-sm">No File</span>
                        )}
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
                          <PermissionGuard permission="transaction.customer-payment.update">
                            <DropdownMenuItem
                              onClick={() => router.push(`/transactions/customer-payment/${payment.id}/edit`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="transaction.customer-payment.delete">
                            <DropdownMenuItem
                              onClick={() => setDeleteId(payment.id)}
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
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} payments
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
              This action cannot be undone. This will permanently delete the payment record.
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
