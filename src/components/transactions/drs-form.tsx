"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
} from "@/components/ui/form";
import {
  FloatingFormItem,
  FLOATING_INNER_CONTROL,
  FLOATING_INNER_TEXTAREA,
} from "@/components/ui/floating-form-item";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AreaFloatingAsyncSelect,
  ServiceCenterOptionalFloatingAsyncSelect,
  VendorFloatingAsyncSelect,
} from "@/components/masters/floating-master-async-selects";
import { drsFormSchema, DrsFormValues, Drs } from "@/types/transactions/drs";
import { drsService } from "@/services/transactions/drs-service";
import type { Area } from "@/types/masters/area";
import type { ServiceCenter } from "@/types/masters/service-center";
import type { Vendor } from "@/types/masters/vendor";

interface DrsFormProps {
  initialData?: Drs | null;
}

export function DrsForm({ initialData }: DrsFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const extraVendor = useMemo(
    () => (initialData?.courier ? ([initialData.courier] as unknown as Vendor[]) : undefined),
    [initialData?.courier],
  );
  const extraArea = useMemo(
    () => (initialData?.area ? ([initialData.area] as unknown as Area[]) : undefined),
    [initialData?.area],
  );
  const extraServiceCenter = useMemo(
    () => (initialData?.serviceCenter ? ([initialData.serviceCenter] as unknown as ServiceCenter[]) : undefined),
    [initialData?.serviceCenter],
  );

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
    mutationFn: async (data: DrsFormValues) => drsService.createDrs(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drs"] });
      toast.success(isEditing ? "DRS copied successfully" : "DRS created successfully");
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
              <FloatingFormItem required label={<>DRS No</>}>
                <FormControl>
                  <Input placeholder="DRS No" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="drsDate"
            render={({ field }) => (
              <FloatingFormItem required label={<>DRS Date</>}>
                <FormControl>
                  <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="drsTime"
            render={({ field }) => (
              <FloatingFormItem label="DRS Time">
                <FormControl>
                  <Input type="time" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courierId"
            render={({ field }) => (
              <FloatingFormItem label="Vendor">
                <FormControl>
                  <VendorFloatingAsyncSelect
                    triggerRef={field.ref}
                    allowClear
                    value={field.value}
                    onChange={field.onChange}
                    queryKeyScope={isEditing && initialData ? `drs-${initialData.id}` : "drs-new"}
                    extraVendors={extraVendor}
                  />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="areaId"
            render={({ field }) => (
              <FloatingFormItem label="Area">
                <FormControl>
                  <AreaFloatingAsyncSelect
                    triggerRef={field.ref}
                    allowClear
                    value={field.value}
                    onChange={field.onChange}
                    queryKeyScope={isEditing && initialData ? `drs-${initialData.id}` : "drs-new"}
                    extraAreas={extraArea}
                  />
                </FormControl>
              </FloatingFormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serviceCenterId"
            render={({ field }) => (
              <FloatingFormItem label="Service Center">
                <FormControl>
                  <ServiceCenterOptionalFloatingAsyncSelect
                    triggerRef={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    queryKeyScope={isEditing && initialData ? `drs-${initialData.id}` : "drs-new"}
                    extraCenters={extraServiceCenter}
                  />
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
                  <Textarea placeholder="Remarks or notes" {...field} className={FLOATING_INNER_TEXTAREA} />
                </FormControl>
              </FloatingFormItem>
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
                    <FloatingFormItem required label="AWB No" itemClassName="flex-1">
                      <FormControl>
                        <Input placeholder="Scan or type AWB No" {...field} className={FLOATING_INNER_CONTROL} />
                      </FormControl>
                    </FloatingFormItem>
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
                No items added. Click &quot;Add Scan&quot; to begin.
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
