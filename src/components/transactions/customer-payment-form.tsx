"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
} from "@/components/ui/form";
import {
  FloatingFormItem,
  FLOATING_INNER_COMBO,
  FLOATING_INNER_CONTROL,
  FLOATING_INNER_TEXTAREA,
  OutlinedFieldShell,
} from "@/components/ui/floating-form-item";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { customerPaymentFormSchema, CustomerPaymentFormValues, CustomerPayment } from "@/types/transactions/customer-payment";
import { customerPaymentService } from "@/services/transactions/customer-payment-service";
import { customerService } from "@/services/masters/customer-service";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

interface CustomerPaymentFormProps {
  initialData?: CustomerPayment | null;
}

export function CustomerPaymentForm({ initialData }: CustomerPaymentFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  const [file, setFile] = useState<File | undefined>();

  const { data: customersResponse } = useQuery({
    queryKey: ["customers-master"],
    queryFn: () => customerService.getCustomers({ limit: 100 }),
  });

  const customerOptions = customersResponse?.data.map((c) => ({
    label: `${c.name} (${c.code || c.id})`,
    value: c.id,
  })) || [];

  const form = useForm<CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentFormSchema),
    defaultValues: {
      date: initialData?.date ? initialData.date.split("T")[0] : new Date().toISOString().split("T")[0],
      paidDate: initialData?.paidDate ? initialData.paidDate.split("T")[0] : new Date().toISOString().split("T")[0],
      amount: initialData?.amount || "",
      customerId: initialData?.customerId || undefined,
      invoiceNo: initialData?.invoiceNo || "",
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
              <FloatingFormItem required label={<>Customer</>}>
                <FormControl>
                  <Combobox
                    options={customerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Customer"
                    searchPlaceholder="Search by name or code..."
                    className={FLOATING_INNER_COMBO}
                  />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FloatingFormItem required label={<>Amount</>}>
                <FormControl>
                  <Input type="number" step="0.01" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FloatingFormItem required label={<>Date</>}>
                <FormControl>
                  <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNo"
            render={({ field }) => (
              <FloatingFormItem required label={<>Invoice No</>}>
                <FormControl>
                  <Input placeholder="INV-0001" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paidDate"
            render={({ field }) => (
              <FloatingFormItem required label={<>Paid Date</>}>
                <FormControl>
                  <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FloatingFormItem label="Remark" itemClassName="md:col-span-2">
                <FormControl>
                  <Textarea placeholder="Payment remarks" {...field} className={FLOATING_INNER_TEXTAREA} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <div className="md:col-span-2 space-y-1">
            <OutlinedFieldShell label="Receipt / Image File">
              <Input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  }
                }}
                className={cn(FLOATING_INNER_CONTROL, "cursor-pointer file:mr-2")}
              />
            </OutlinedFieldShell>
            {initialData?.fileName && (
              <p className="text-sm text-muted-foreground">Current file: {initialData.fileName}</p>
            )}
          </div>

          <FormField
            control={form.control}
            name="approved"
            render={({ field }) => (
              <FloatingFormItem label="Approved" itemClassName="md:col-span-2">
                <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FloatingFormItem>
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
