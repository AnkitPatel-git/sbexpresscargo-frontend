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
import { undeliveredScanFormSchema, UndeliveredScanFormValues, UndeliveredScan } from "@/types/transactions/undelivered-scan";
import { undeliveredScanService } from "@/services/transactions/undelivered-scan-service";

interface UndeliveredScanFormProps {
  initialData?: UndeliveredScan | null;
}

export function UndeliveredScanForm({ initialData }: UndeliveredScanFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<UndeliveredScanFormValues>({
    resolver: zodResolver(undeliveredScanFormSchema),
    defaultValues: {
      scanDate: initialData?.scanAt ? initialData.scanAt.split("T")[0] : new Date().toISOString().split("T")[0],
      scanTime: initialData?.scanAt ? new Date(initialData.scanAt).toISOString().split("T")[1].substring(0, 5) : "10:00",
      serviceCenterId: initialData?.serviceCenterId || undefined,
      items: initialData?.items || [{ awbNo: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const mutation = useMutation({
    mutationFn: async (data: UndeliveredScanFormValues) => {
      if (isEditing && initialData?.id) {
        return undeliveredScanService.updateUndeliveredScan(initialData.id, data);
      }
      return undeliveredScanService.createUndeliveredScan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["undelivered-scans"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["undelivered-scan", initialData.id] });
      }
      toast.success(isEditing ? "Scan updated successfully" : "Scan created successfully");
      router.push("/transactions/undelivered-scan");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  function onSubmit(values: UndeliveredScanFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="scanDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scan Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scanTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scan Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceCenterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Center ID</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Scanned AWBs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ awbNo: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scan
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end border p-4 rounded-md">
                <FormField
                  control={form.control}
                  name={`items.${index}.awbNo`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>AWB No</FormLabel>
                      <FormControl>
                        <Input placeholder="Scan or type AWB No" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-4 text-gray-500 border rounded-md border-dashed">
                No items added. Click "Add Scan" to begin.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/transactions/undelivered-scan")}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Scan
          </Button>
        </div>
      </form>
    </Form>
  );
}
