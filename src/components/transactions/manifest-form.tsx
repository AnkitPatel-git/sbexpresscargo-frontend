"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { manifestFormSchema, ManifestFormValues, Manifest } from "@/types/transactions/manifest";
import { manifestService } from "@/services/transactions/manifest-service";
import { shipmentService } from "@/services/transactions/shipment-service";

interface ManifestFormProps {
  initialData?: Manifest | null;
}

export function ManifestForm({ initialData }: ManifestFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const { data: shipmentsData } = useQuery({
    queryKey: ["shipments-list"],
    queryFn: () => shipmentService.getShipments({ limit: 100 }),
  });

  const shipmentOptions = shipmentsData?.data?.map(s => ({
    label: s.awbNo,
    value: s.id
  })) || [];

  const form = useForm<ManifestFormValues>({
    resolver: zodResolver(manifestFormSchema),
    defaultValues: {
      manifestNo: initialData?.manifestNo || "",
      masterAwbNo: initialData?.masterAwbNo || "",
      manifestDate: initialData?.manifestAt ? initialData.manifestAt.split("T")[0] : new Date().toISOString().split("T")[0],
      manifestTime: initialData?.manifestAt ? new Date(initialData.manifestAt).toISOString().split("T")[1].substring(0, 5) : "10:00",
      location: initialData?.location || "",
      serviceCenterId: initialData?.serviceCenterId || undefined,
      connectStation: initialData?.connectStation || "",
      vendorId: initialData?.vendorId || undefined,
      productId: initialData?.productId || undefined,
      format: initialData?.format || "standard",
      singleLine: initialData?.singleLine || false,
      pdfType: initialData?.pdfType || "A4",
      accountNo: initialData?.accountNo || "",
      department: initialData?.department || "",
      shipmentIds: initialData?.items?.map(it => it.id).filter(id => id !== undefined) as number[] || [],
      items: initialData?.items || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  const mutation = useMutation({
    mutationFn: async (data: ManifestFormValues) => {
      if (isEditing && initialData?.id) {
        return manifestService.updateManifest(initialData.id, data);
      }
      return manifestService.createManifest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manifests"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["manifest", initialData.id] });
      }
      toast.success(isEditing ? "Manifest updated successfully" : "Manifest created successfully");
      router.push("/transactions/manifest");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  function onSubmit(values: ManifestFormValues) {
    // Combine date and time into a full ISO 8601 string
    const manifestAt = new Date(`${values.manifestDate}T${values.manifestTime || "10:00"}:00`).toISOString();
    
    // @ts-ignore - The API expects ISO string for manifestDate in this case
    const payload = {
      ...values,
      manifestDate: manifestAt,
      shipmentIds: values.shipmentIds.map(id => Number(id)).filter(id => id >= 1)
    };

    if (payload.shipmentIds.length === 0) {
        toast.error("Please select at least one shipment");
        return;
    }

    mutation.mutate(payload as any);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shipmentIds"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Shipment IDs <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <MultiSelect
                    options={shipmentOptions}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Select shipments..."
                    searchPlaceholder="Search AWB..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manifestNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manifest No <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Manifest No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="masterAwbNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Master AWB No</FormLabel>
                <FormControl>
                  <Input placeholder="Master AWB No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manifestDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manifest Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manifestTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manifest Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="connectStation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connect Station</FormLabel>
                <FormControl>
                  <Input placeholder="Connect Station" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pdfType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PDF Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PDF type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account No</FormLabel>
                <FormControl>
                  <Input placeholder="Account No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Department" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="singleLine"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Single Line</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ bagNo: "", awbNo: "", pieces: 1, chargeWeight: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end border p-4 rounded-md">
                <FormField
                  control={form.control}
                  name={`items.${index}.bagNo`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Bag No</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.awbNo`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>AWB No</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.pieces`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>Pieces</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.chargeWeight`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-100"
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
            onClick={() => router.push("/transactions/manifest")}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Manifest
          </Button>
        </div>
      </form>
    </Form>
  );
}
