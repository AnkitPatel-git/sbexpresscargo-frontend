"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { creditNoteFormSchema, CreditNoteFormValues, CreditNote } from "@/types/transactions/credit-note";
import { creditNoteService } from "@/services/transactions/credit-note-service";

interface CreditNoteFormProps {
  initialData?: CreditNote | null;
}

export function CreditNoteForm({ initialData }: CreditNoteFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<CreditNoteFormValues>({
    resolver: zodResolver(creditNoteFormSchema),
    defaultValues: {
      noteNo: initialData?.noteNo || "",
      creditNoteNo: initialData?.creditNoteNo || undefined,
      cnDate: initialData?.cnDate ? initialData.cnDate.split("T")[0] : new Date().toISOString().split("T")[0],
      customerId: initialData?.customerId || 1, // Defaulting for demo
      invoiceRef: initialData?.invoiceRef || "",
      narration: initialData?.narration || "",
      gst: initialData?.gst || false,
      amount: initialData?.amount ? parseFloat(initialData.amount) : undefined,
      igst: initialData?.igst ? parseFloat(initialData.igst) : undefined,
      sgst: initialData?.sgst ? parseFloat(initialData.sgst) : undefined,
      cgst: initialData?.cgst ? parseFloat(initialData.cgst) : undefined,
      totalAmount: initialData?.totalAmount ? parseFloat(initialData.totalAmount) : undefined,
      grandTotal: initialData?.grandTotal ? parseFloat(initialData.grandTotal) : undefined,
      serviceCenterId: initialData?.serviceCenterId || undefined,
      items: initialData?.items?.map(item => ({
        ...item,
        amount: item.amount ? parseFloat(item.amount.toString()) : undefined,
        igst: item.igst ? parseFloat(item.igst.toString()) : undefined,
        sgst: item.sgst ? parseFloat(item.sgst.toString()) : undefined,
        cgst: item.cgst ? parseFloat(item.cgst.toString()) : undefined,
        total: item.total ? parseFloat(item.total.toString()) : undefined,
      })) || [{ awbNo: "", amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const mutation = useMutation({
    mutationFn: async (data: CreditNoteFormValues) => {
      if (isEditing && initialData?.id) {
        return creditNoteService.updateCreditNote(initialData.id, data);
      }
      return creditNoteService.createCreditNote(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-notes"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["credit-note", initialData.id] });
      }
      toast.success(isEditing ? "Credit note updated successfully" : "Credit note created successfully");
      router.push("/transactions/credit-note");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  function onSubmit(values: CreditNoteFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="noteNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note No <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Note No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cnDate"
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
            name="invoiceRef"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Reference</FormLabel>
                <FormControl>
                  <Input placeholder="Invoice Ref" {...field} />
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
                <FormLabel>Base Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grandTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grand Total</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="narration"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Narration</FormLabel>
                <FormControl>
                  <Textarea placeholder="Narration or reason" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gst"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm md:col-span-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Includes GST</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Items (AWBs)</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ awbNo: "", amount: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap gap-4 items-end border p-4 rounded-md bg-gray-50/50">
                <FormField
                  control={form.control}
                  name={`items.${index}.awbNo`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[200px]">
                      <FormLabel>AWB No</FormLabel>
                      <FormControl>
                        <Input placeholder="AWB No" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.remark`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[200px]">
                      <FormLabel>Remark</FormLabel>
                      <FormControl>
                        <Input placeholder="Remark" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-100 mb-0.5"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-4 text-gray-500 border rounded-md border-dashed">
                No items added. Click "Add Item" to begin.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/transactions/credit-note")}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Credit Note
          </Button>
        </div>
      </form>
    </Form>
  );
}
