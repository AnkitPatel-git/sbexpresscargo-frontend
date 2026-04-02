"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { customerPaymentFormSchema, CustomerPaymentFormValues, CustomerPayment } from "@/types/transactions/customer-payment";
import { customerPaymentService } from "@/services/transactions/customer-payment-service";

interface CustomerPaymentFormProps {
  initialData?: CustomerPayment | null;
}

export function CustomerPaymentForm({ initialData }: CustomerPaymentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  const [file, setFile] = useState<File | undefined>();

  const form = useForm<CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentFormSchema),
    defaultValues: {
      date: initialData?.date ? initialData.date.split("T")[0] : new Date().toISOString().split("T")[0],
      paidDate: initialData?.paidDate ? initialData.paidDate.split("T")[0] : new Date().toISOString().split("T")[0],
      amount: initialData?.amount || "",
      customerId: initialData?.customerId || 1, // Defaulting to 1 for demo based on Bruno API example
      remark: initialData?.remark || "",
      approved: initialData?.approved || false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerPaymentFormValues) => {
      if (isEditing && initialData?.id) {
        return customerPaymentService.updateCustomerPayment(initialData.id, data, file);
      }
      return customerPaymentService.createCustomerPayment(data, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["customer-payment", initialData.id] });
      }
      toast.success(isEditing ? "Customer payment updated successfully" : "Customer payment created successfully");
      router.push("/transactions/customer-payment");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  function onSubmit(values: CustomerPaymentFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer ID <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paidDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Remark</FormLabel>
                <FormControl>
                  <Textarea placeholder="Payment remarks" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2 md:col-span-2">
            <FormLabel>Receipt / Image File</FormLabel>
            <Input
                type="file"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                    }
                }}
            />
            {initialData?.fileName && (
                <p className="text-sm text-gray-500">Current file: {initialData.fileName}</p>
            )}
          </div>

          <FormField
            control={form.control}
            name="approved"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Approved</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/transactions/customer-payment")}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Payment
          </Button>
        </div>
      </form>
    </Form>
  );
}
