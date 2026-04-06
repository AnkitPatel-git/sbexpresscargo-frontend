"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  FilePlus,
  FileText,
  FileUp,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useDebounce } from "@/hooks/use-debounce";
import { customerPaymentService } from "@/services/transactions/customer-payment-service";
import { CustomerPayment } from "@/types/transactions/customer-payment";
import { cn } from "@/lib/utils";

function SortArrows() {
  return (
    <span className="ml-1 inline-flex flex-col leading-none opacity-80">
      <ChevronUp className="h-2.5 w-2.5 -mb-1" />
      <ChevronDown className="h-2.5 w-2.5" />
    </span>
  );
}

export default function CustomerPaymentListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [colFilters, setColFilters] = useState({
    customer: "",
    amount: "",
    status: "",
  });

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

  const downloadMutation = useMutation({
    mutationFn: (payment: CustomerPayment) => customerPaymentService.getCustomerPaymentFile(payment.id),
    onSuccess: (blob, payment) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', payment.fileName || `payment_${payment.id}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("File downloaded successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to download file");
    }
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const filteredRows =
    data?.data.filter((payment) => {
      const customerName = payment.customer?.name || `Customer ID: ${payment.customerId}`;
      if (colFilters.customer && !customerName.toLowerCase().includes(colFilters.customer.toLowerCase())) return false;
      if (colFilters.amount && !String(payment.amount).includes(colFilters.amount)) return false;
      const status = payment.approved ? "approved" : "pending";
      if (colFilters.status && !status.includes(colFilters.status.toLowerCase())) return false;
      return true;
    }) ?? [];

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)] lg:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border p-1">
          <PermissionGuard permission="transaction.customer-payment.create">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              title="Add"
              onClick={() => router.push("/transactions/customer-payment/create")}
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Import">
            <FileUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary"
            title="Refresh"
            onClick={() => queryClient.refetchQueries({ queryKey: ["customer-payments"], type: "active" })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            placeholder="Search payments..."
            className="h-9 w-44 bg-background sm:w-52"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <PermissionGuard permission="transaction.customer-payment.create">
            <Button type="button" className="h-9 rounded-md px-3" onClick={() => router.push("/transactions/customer-payment/create")}>
              <Plus className="mr-1 h-4 w-4" /> Add Customer Payment
            </Button>
          </PermissionGuard>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[980px] border-0">
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="h-11 font-semibold text-primary-foreground"><span className="inline-flex items-center">Customer <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Amount <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Date / Paid Date <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">Status <SortArrows /></span></TableHead>
              <TableHead className="font-semibold text-primary-foreground"><span className="inline-flex items-center">File <SortArrows /></span></TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
            <TableRow className="border-b border-border bg-card hover:bg-card">
              <TableHead className="p-2">
                <Input
                  placeholder="Customer"
                  className="h-8 border-border bg-background text-xs"
                  value={colFilters.customer}
                  onChange={(e) => setColFilters((f) => ({ ...f, customer: e.target.value }))}
                />
              </TableHead>
              <TableHead className="p-2">
                <Input
                  placeholder="Amount"
                  className="h-8 border-border bg-background text-xs"
                  value={colFilters.amount}
                  onChange={(e) => setColFilters((f) => ({ ...f, amount: e.target.value }))}
                />
              </TableHead>
              <TableHead className="p-2"><Input placeholder="Date / Paid Date" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
              <TableHead className="p-2">
                <Input
                  placeholder="Status"
                  className="h-8 border-border bg-background text-xs"
                  value={colFilters.status}
                  onChange={(e) => setColFilters((f) => ({ ...f, status: e.target.value }))}
                />
              </TableHead>
              <TableHead className="p-2"><Input placeholder="File" className="h-8 border-border bg-background text-xs" disabled /></TableHead>
              <TableHead className="p-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                  {error instanceof Error ? error.message : "Failed to load payments"}
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((payment: CustomerPayment, index) => (
                <TableRow key={payment.id} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell className="font-medium text-foreground">{payment.customer?.name || `Customer ID: ${payment.customerId}`}</TableCell>
                  <TableCell className="font-semibold text-green-700">₹{parseFloat(payment.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{payment.date ? format(new Date(payment.date), "dd MMM yyyy") : "-"}</div>
                    <div className="text-xs text-gray-500">Paid: {payment.paidDate ? format(new Date(payment.paidDate), "dd MMM yyyy") : "-"}</div>
                  </TableCell>
                  <TableCell>
                    {payment.approved ? (
                      <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle2 className="mr-1 h-4 w-4" /> Approved</span>
                    ) : (
                      <span className="flex items-center text-amber-600 text-sm font-medium"><XCircle className="mr-1 h-4 w-4" /> Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.fileName ? (
                      <button
                        onClick={() => downloadMutation.mutate(payment)}
                        className="flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                        disabled={downloadMutation.isPending}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        <span className="max-w-[150px] truncate">{payment.fileName}</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm italic">No Attachment</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <PermissionGuard permission="transaction.customer-payment.update">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-link)] hover:bg-[var(--express-link)]/10"
                          onClick={() => router.push(`/transactions/customer-payment/${payment.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGuard>
                      {payment.fileName && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => downloadMutation.mutate(payment)}
                          disabled={downloadMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <PermissionGuard permission="transaction.customer-payment.delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--express-danger)] hover:bg-[var(--express-danger)]/10"
                          onClick={() => setDeleteId(payment.id)}
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
        <p className="text-sm text-muted-foreground">Showing {from} to {to} of {total} entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
          <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</Button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{page}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => setPage((p) => Math.min(data?.totalPages || p, p + 1))}
            disabled={!data || page >= data.totalPages}
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => setPage(data?.totalPages ?? 1)}
            disabled={!data || page >= data.totalPages}
          >
            »
          </Button>
        </div>
      </div>

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
