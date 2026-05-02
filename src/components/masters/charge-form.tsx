"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { chargeService } from "@/services/masters/charge-service";
import { stateService } from "@/services/masters/state-service";
import { serviceablePincodeService } from "@/services/utilities/serviceable-pincode-service";
import type {
  Charge,
  ChargeFormData,
  ChargePincodeApplicationMode,
  ChargeStateApplicationMode,
} from "@/types/masters/charge";
import type { State } from "@/types/masters/state";
import type { ServiceablePincode } from "@/types/utilities/serviceable-pincode";
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteEntityList, useSelectContentInfiniteScroll } from "@/hooks/use-infinite-entity-list";

const STATE_SCOPE_OPTIONS: { value: ChargeStateApplicationMode; label: string }[] = [
  { value: "ALL", label: "All states" },
  { value: "INWARD_DELIVERY_STATE", label: "Delivery state (inward)" },
  { value: "OUTWARD_PICKUP_STATE", label: "Pickup state (outward)" },
  { value: "EITHER_STATE_ONCE", label: "Either pickup or delivery (once)" },
];

const PIN_SCOPE_OPTIONS: { value: ChargePincodeApplicationMode; label: string }[] = [
  { value: "ALL", label: "All pincodes" },
  { value: "INWARD_DELIVERY_PINCODE", label: "Delivery pincode (inward)" },
  { value: "OUTWARD_PICKUP_PINCODE", label: "Pickup pincode (outward)" },
  { value: "EITHER_PINCODE_ONCE", label: "Either pickup or delivery pincode (once)" },
];

const chargeSchema = z
  .object({
    code: optionalMasterCode(2),
    name: z.string().min(1, "Name is required"),
    sequence: z.coerce.number().min(1, "Sequence must be at least 1"),
    stateApplicationMode: z.string().min(1),
    pincodeApplicationMode: z.string().min(1),
    stateIds: z.array(z.number().int().positive()),
    pincodeIds: z.array(z.number().int().positive()),
  })
  .superRefine((data, ctx) => {
    if (data.stateApplicationMode !== "ALL" && data.stateIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one state, or set state scope to All",
        path: ["stateIds"],
      });
    }
    if (data.pincodeApplicationMode !== "ALL" && data.pincodeIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one serviceable pincode, or set pincode scope to All",
        path: ["pincodeIds"],
      });
    }
  });

type ChargeFormValues = z.infer<typeof chargeSchema>;

interface ChargeFormProps {
  initialData?: Charge | null;
}

function pincodeOptionLabel(p: ServiceablePincode): string {
  const parts = [p.pinCode, p.areaName, p.cityName].filter(Boolean);
  return parts.join(" · ");
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
      sequence: 1,
      stateApplicationMode: "ALL",
      pincodeApplicationMode: "ALL",
      stateIds: [],
      pincodeIds: [],
    },
    values: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          sequence: initialData.sequence,
          stateApplicationMode: initialData.stateApplicationMode ?? "ALL",
          pincodeApplicationMode: initialData.pincodeApplicationMode ?? "ALL",
          stateIds: initialData.applicableStates?.map((r) => r.stateId) ?? [],
          pincodeIds: initialData.applicablePincodes?.map((r) => r.pinCodeId) ?? [],
        }
      : undefined,
  });

  const stateMode = form.watch("stateApplicationMode");
  const pinMode = form.watch("pincodeApplicationMode");
  const selectedStateIds = form.watch("stateIds");
  const selectedPincodeIds = form.watch("pincodeIds");

  const [stateSearch, setStateSearch] = useState("");
  const [pincodeSearch, setPincodeSearch] = useState("");
  const debouncedStateSearch = useDebounce(stateSearch.trim(), 300);
  const debouncedPincodeSearch = useDebounce(pincodeSearch.trim(), 300);

  useEffect(() => {
    if (stateMode === "ALL") {
      form.setValue("stateIds", []);
      setStateSearch("");
    }
  }, [stateMode, form]);

  useEffect(() => {
    if (pinMode === "ALL") {
      form.setValue("pincodeIds", []);
      setPincodeSearch("");
    }
  }, [pinMode, form]);

  const stateInfinite = useInfiniteEntityList<State>({
    queryKey: ["charge-form-states", debouncedStateSearch],
    pageSize: 10,
    enabled: stateMode !== "ALL",
    fetchPage: (page) =>
      stateService.getStates({
        page,
        limit: 10,
        ...(debouncedStateSearch ? { search: debouncedStateSearch } : {}),
        sortBy: "stateName",
        sortOrder: "asc",
      }),
  });

  const pincodeInfinite = useInfiniteEntityList<ServiceablePincode>({
    queryKey: ["charge-form-serviceable-pincodes", debouncedPincodeSearch],
    pageSize: 10,
    enabled: pinMode !== "ALL",
    fetchPage: (page) =>
      serviceablePincodeService.getServiceablePincodes({
        page,
        limit: 10,
        search: debouncedPincodeSearch,
        sortBy: "pinCode",
        sortOrder: "asc",
      }),
  });

  const onStateListScroll = useSelectContentInfiniteScroll({
    hasNextPage: stateInfinite.hasNextPage,
    isFetchingNextPage: stateInfinite.isFetchingNextPage,
    fetchNextPage: () => {
      void stateInfinite.fetchNextPage();
    },
  });

  const onPincodeListScroll = useSelectContentInfiniteScroll({
    hasNextPage: pincodeInfinite.hasNextPage,
    isFetchingNextPage: pincodeInfinite.isFetchingNextPage,
    fetchNextPage: () => {
      void pincodeInfinite.fetchNextPage();
    },
  });

  const stateOptions = useMemo(() => {
    const loaded = new Map<number, { value: number; label: string }>();
    for (const s of stateInfinite.rows) {
      loaded.set(s.id, { value: s.id, label: s.stateName || `State ${s.id}` });
    }
    for (const id of selectedStateIds) {
      if (!loaded.has(id)) {
        loaded.set(id, { value: id, label: `State #${id}` });
      }
    }
    return Array.from(loaded.values());
  }, [stateInfinite.rows, selectedStateIds]);

  const pincodeOptions = useMemo(() => {
    const loaded = new Map<number, { value: number; label: string }>();
    for (const p of pincodeInfinite.rows) {
      loaded.set(p.id, { value: p.id, label: pincodeOptionLabel(p) });
    }
    for (const id of selectedPincodeIds) {
      if (!loaded.has(id)) {
        loaded.set(id, { value: id, label: `Pincode #${id}` });
      }
    }
    return Array.from(loaded.values());
  }, [pincodeInfinite.rows, selectedPincodeIds]);

  const mutation = useMutation({
    mutationFn: (data: ChargeFormValues) => {
      const payload = omitEmptyCodeFields(data, ["code"]) as ChargeFormValues;
      const trimmedName = payload.name.trim();
      const codeTrimmed = typeof payload.code === "string" ? payload.code.trim() : "";
      const body: ChargeFormData = {
        name: trimmedName,
        sequence: payload.sequence,
        stateApplicationMode: payload.stateApplicationMode as ChargeStateApplicationMode,
        pincodeApplicationMode: payload.pincodeApplicationMode as ChargePincodeApplicationMode,
        stateIds: payload.stateApplicationMode === "ALL" ? [] : payload.stateIds,
        pincodeIds: payload.pincodeApplicationMode === "ALL" ? [] : payload.pincodeIds,
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

  const stateListFooter =
    stateInfinite.isFetchingNextPage ? (
      <div className="px-2 py-2 text-center text-xs text-muted-foreground">Loading more…</div>
    ) : null;

  const pincodeListFooter =
    pincodeInfinite.isFetchingNextPage ? (
      <div className="px-2 py-2 text-center text-xs text-muted-foreground">Loading more…</div>
    ) : null;

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
              <FloatingFormItem required label="Charge Name">
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
              <FloatingFormItem required label="Sequence">
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
            name="stateApplicationMode"
            render={({ field }) => (
              <FloatingFormItem required label="State scope">
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={FLOATING_INNER_CONTROL}>
                      <SelectValue placeholder="State application" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_SCOPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FloatingFormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincodeApplicationMode"
            render={({ field }) => (
              <FloatingFormItem required label="Pincode scope">
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={FLOATING_INNER_CONTROL}>
                      <SelectValue placeholder="Pincode application" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIN_SCOPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FloatingFormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="stateIds"
            render={({ field }) => (
              <FloatingFormItem label="States (when scoped)">
                <FormControl>
                  {stateMode === "ALL" ? (
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      Not used when state scope is &quot;All states&quot;.
                    </p>
                  ) : (
                    <MultiSelect
                      enableClientFilter={false}
                      options={stateOptions}
                      selected={field.value}
                      onChange={(next) => field.onChange(next as number[])}
                      placeholder="Select states…"
                      searchPlaceholder="Search states…"
                      emptyMessage={
                        stateInfinite.isInitialLoading ? "Loading…" : "No states match. Try another search."
                      }
                      onSearchChange={setStateSearch}
                      onListScroll={onStateListScroll}
                      listFooter={stateListFooter}
                      onOpenChange={(open) => {
                        if (!open) setStateSearch("");
                      }}
                    />
                  )}
                </FormControl>
              </FloatingFormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincodeIds"
            render={({ field }) => (
              <FloatingFormItem label="Serviceable pincodes (when scoped)">
                <FormControl>
                  {pinMode === "ALL" ? (
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      Not used when pincode scope is &quot;All pincodes&quot;.
                    </p>
                  ) : (
                    <MultiSelect
                      enableClientFilter={false}
                      options={pincodeOptions}
                      selected={field.value}
                      onChange={(next) => field.onChange(next as number[])}
                      placeholder="Select pincodes…"
                      searchPlaceholder="Search pincode / area / city…"
                      emptyMessage={
                        pincodeInfinite.isInitialLoading ? "Loading…" : "No pincodes match. Try another search."
                      }
                      onSearchChange={setPincodeSearch}
                      onListScroll={onPincodeListScroll}
                      listFooter={pincodeListFooter}
                      onOpenChange={(open) => {
                        if (!open) setPincodeSearch("");
                      }}
                    />
                  )}
                </FormControl>
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
