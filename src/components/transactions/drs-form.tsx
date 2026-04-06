"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { drsFormSchema, DrsFormValues, Drs } from "@/types/transactions/drs";
import { drsService } from "@/services/transactions/drs-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { vendorService } from "@/services/masters/vendor-service";
import { areaService } from "@/services/masters/area-service";

interface DrsFormProps {
  initialData?: Drs | null;
}

export function DrsForm({ initialData }: DrsFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const { data: serviceCentersData } = useQuery({
    queryKey: ["service-centers"],
    queryFn: () => serviceCenterService.getServiceCenters(),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => vendorService.getVendors({ limit: 100 }),
  });

  const { data: areasData } = useQuery({
    queryKey: ["areas"],
    queryFn: () => areaService.getAreas({ limit: 100 }),
  });

  const serviceCenterOptions = serviceCentersData?.data?.map(sc => ({
    label: sc.name,
    value: sc.id
  })) || [];

  const vendorOptions = vendorsData?.data?.map((vendor) => ({
    label: vendor.vendorName,
    value: vendor.id
  })) || [];

  const areaOptions = areasData?.data?.map(a => ({
    label: a.areaName,
    value: a.id
  })) || [];

  const form = useForm<DrsFormValues>({
    resolver: zodResolver(drsFormSchema),
    defaultValues: {
      drsNo: initialData?.drsNo || "",
      drsDate: initialData?.drsDate ? initialData.drsDate.split("T")[0] : new Date().toISOString().split("T")[0],
      drsTime: initialData?.drsTime || "10:00",
      courierId: initialData?.courierId || undefined,
      areaId: initialData?.areaId || undefined,
      serviceCenterId: initialData?.serviceCenterId || undefined,
      remark: initialData?.remark || "",
      items: initialData?.items || [{ awbNo: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const mutation = useMutation({
    mutationFn: async (data: DrsFormValues) => {
      if (isEditing && initialData?.id) {
        return drsService.updateDrs(initialData.id, data);
      }
      return drsService.createDrs(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drs"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["drs", initialData.id] });
      }
      toast.success(isEditing ? "DRS updated successfully" : "DRS created successfully");
      router.push("/transactions/drs");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  function onSubmit(values: DrsFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="drsNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DRS No <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="DRS No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="drsDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DRS Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="drsTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DRS Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Combobox
                    options={vendorOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Vendor"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="areaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area</FormLabel>
                <FormControl>
                  <Combobox
                    options={areaOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Area"
                  />
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
                <FormLabel>Service Center</FormLabel>
                <FormControl>
                  <Combobox
                    options={serviceCenterOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Service Center"
                  />
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
                  <Textarea placeholder="Remarks or notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Shipments (Scan)</h3>
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
            onClick={() => router.push("/transactions/drs")}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} DRS
          </Button>
        </div>
      </form>
    </Form>
  );
}
