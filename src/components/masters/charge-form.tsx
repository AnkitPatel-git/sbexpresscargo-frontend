"use client";

import { useForm, Resolver, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { FloatingFormItem, FLOATING_INNER_CONTROL } from "@/components/ui/floating-form-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { chargeService } from "@/services/masters/charge-service";
import type { Charge, ChargeFormData } from "@/types/masters/charge";
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema";

const chargeSchema = z.object({
  code: optionalMasterCode(2),
  name: z.string().min(1, "Name is required"),
  applyFuel: z.boolean(),
  sequence: z.coerce.number().min(1, "Sequence must be at least 1"),
});

type ChargeFormValues = z.infer<typeof chargeSchema>;

interface ChargeFormProps {
  initialData?: Charge | null;
}

export function ChargeForm({ initialData }: ChargeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema) as Resolver<ChargeFormValues>,
    defaultValues: {
      code: "",
      name: "",
      applyFuel: true,
      sequence: 1,
    },
    values: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          applyFuel: initialData.applyFuel,
          sequence: initialData.sequence,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (data: ChargeFormValues) => {
      const payload = omitEmptyCodeFields(data, ["code"]) as ChargeFormValues;
      const trimmedName = payload.name.trim();
      const codeTrimmed = typeof payload.code === "string" ? payload.code.trim() : "";
      const body: ChargeFormData = {
        name: trimmedName,
        applyFuel: payload.applyFuel,
        sequence: payload.sequence,
      };
      if (codeTrimmed.length > 0) {
        body.code = codeTrimmed;
      }
      if (isEdit && initialData) {
        return chargeService.updateCharge(initialData.id, {
          ...body,
          code: codeTrimmed.length > 0 ? codeTrimmed : initialData.code,
          version: initialData.version ?? 1,
        });
      }
      return chargeService.createCharge(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      if (isEdit && initialData) {
        queryClient.invalidateQueries({ queryKey: ["charge", initialData.id] });
      }
      toast.success(`Charge ${isEdit ? "updated" : "created"} successfully`);
      router.push("/masters/charge");
    },
    onError: (error: Error) => {
      toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} charge`);
    },
  });

  function onSubmit(data: ChargeFormValues) {
    mutation.mutate(data);
  }

  const onInvalid = (errors: FieldErrors<ChargeFormValues>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, error]) => `${field}: ${error?.message ?? "Invalid value"}`)
      .join(", ");
    toast.error(errorMessages || "Please check the form");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FloatingFormItem label="Charge Code (optional)">
                <FormControl>
                  <Input placeholder="Blank = auto-generate" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FloatingFormItem label="Charge Name">
                <FormControl>
                  <Input placeholder="e.g. Freight Charge" {...field} className={FLOATING_INNER_CONTROL} />
                </FormControl>
              </FloatingFormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sequence"
            render={({ field }) => (
              <FloatingFormItem label="Sequence">
                <FormControl>
                  <Input
                    type="number"
                    className={FLOATING_INNER_CONTROL}
                    {...field}
                    value={field.value === undefined || field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                  />
                </FormControl>
              </FloatingFormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applyFuel"
            render={({ field }) => (
              <FloatingFormItem label="Apply Fuel">
                <div className="flex min-h-[1.75rem] items-center justify-end py-0.5">
                  <FormControl>
                    <Checkbox checked={field.value ?? false} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                  </FormControl>
                </div>
              </FloatingFormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
          <Button type="button" variant="expressDanger" onClick={() => router.push("/masters/charge")}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Charge" : "Create Charge"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
