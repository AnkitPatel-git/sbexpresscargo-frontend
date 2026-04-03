"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, Search } from "lucide-react";

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
import { misroutedScanFormSchema, MisroutedScanFormValues, MisroutedScan } from "@/types/transactions/misrouted-scan";
import { misroutedScanService } from "@/services/transactions/misrouted-scan-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { Combobox } from "@/components/ui/combobox";

interface MisroutedScanFormProps {
  initialData?: MisroutedScan | null;
}

export function MisroutedScanForm({ initialData }: MisroutedScanFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;
  
  const { data: serviceCentersResponse } = useQuery({
    queryKey: ["service-centers-master"],
    queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
  });

  const serviceCenterOptions = serviceCentersResponse?.data.map((sc) => ({
    label: `${sc.name} (${sc.code || sc.id})`,
    value: sc.id,
  })) || [];

  const form = useForm<MisroutedScanFormValues>({
    resolver: zodResolver(misroutedScanFormSchema),
    defaultValues: {
      scanDate: initialData?.scanAt ? initialData.scanAt.split("T")[0] : new Date().toISOString().split("T")[0],
      scanTime: (initialData?.scanAt && !isNaN(new Date(initialData.scanAt).getTime())) 
        ? format(new Date(initialData.scanAt), "HH:mm") 
        : "10:00",
      serviceCenterId: initialData?.serviceCenterId || undefined,
      items: initialData?.items?.map(item => ({
        id: item.id,
        awbNo: item.awbNo,
        shipmentId: item.shipmentId
      })) || [{ awbNo: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const mutation = useMutation({
    mutationFn: async (data: MisroutedScanFormValues) => {
      if (isEditing && initialData?.id) {
        return misroutedScanService.updateMisroutedScan(initialData.id, data);
      }
      return misroutedScanService.createMisroutedScan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["misrouted-scans"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["misrouted-scan", initialData.id] });
      }
      toast.success(isEditing ? "Scan updated successfully" : "Scan created successfully");
      router.push("/transactions/misrouted-scan");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  function onSubmit(values: MisroutedScanFormValues) {
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
              <FormItem className="flex flex-col">
                <FormLabel>Service Center</FormLabel>
                <FormControl>
                  <Combobox
                    options={serviceCenterOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Service Center"
                    searchPlaceholder="Search by name or code..."
                  />
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
            onClick={() => router.push("/transactions/misrouted-scan")}
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
