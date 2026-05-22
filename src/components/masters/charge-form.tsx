"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { IntegerInput } from "@/components/ui/integer-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { optionLabelForSelect } from "@/lib/select-closed-label";
import { chargeService } from "@/services/masters/charge-service";
import { stateService } from "@/services/masters/state-service";
import { cityService } from "@/services/masters/city-service";
import type {
  Charge,
  ChargeFormData,
  ChargeCityApplicationMode,
  ChargeStateApplicationMode,
} from "@/types/masters/charge";
import type { State } from "@/types/masters/state";
import type { City } from "@/types/masters/city";
import { omitEmptyCodeFields, optionalMasterCode } from "@/lib/master-code-schema";
import { useDebounce } from "@/hooks/use-debounce";
import { useInfiniteEntityList, useSelectContentInfiniteScroll } from "@/hooks/use-infinite-entity-list";

const STATE_SCOPE_OPTIONS: { value: ChargeStateApplicationMode; label: string }[] = [
  { value: "ALL", label: "All states" },
  { value: "INWARD_DELIVERY_STATE", label: "Delivery state (inward)" },
  { value: "OUTWARD_PICKUP_STATE", label: "Pickup state (outward)" },
  { value: "EITHER_STATE_ONCE", label: "Either pickup or delivery (once)" },
];

const CITY_SCOPE_OPTIONS: { value: ChargeCityApplicationMode; label: string }[] = [
  { value: "ALL", label: "All cities" },
  { value: "INWARD_DELIVERY_CITY", label: "Delivery city (inward)" },
  { value: "OUTWARD_PICKUP_CITY", label: "Pickup city (outward)" },
  { value: "EITHER_CITY_ONCE", label: "Either pickup or delivery city (once)" },
];

const chargeSchema = z
  .object({
    code: optionalMasterCode(2),
    name: z.string().min(1, "Name is required"),
    sequence: z.coerce.number().min(1, "Sequence must be at least 1"),
    stateApplicationMode: z.string().min(1),
    cityApplicationMode: z.string().min(1),
    stateIds: z.array(z.number().int().positive()),
    cityIds: z.array(z.number().int().positive()),
  })
  .superRefine((data, ctx) => {
    if (data.stateApplicationMode !== "ALL" && data.stateIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one state, or set state scope to All",
        path: ["stateIds"],
      });
    }
    if (data.cityApplicationMode !== "ALL" && data.cityIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one city, or set city scope to All",
        path: ["cityIds"],
      });
    }
  });

type ChargeFormValues = z.infer<typeof chargeSchema>;

interface ChargeFormProps {
  initialData?: Charge | null;
}

function cityOptionLabel(c: City): string {
  const stateName = c.state?.stateName;
  return stateName ? `${c.cityName} · ${stateName}` : c.cityName;
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
      cityApplicationMode: "ALL",
      stateIds: [],
      cityIds: [],
    },
    values: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          sequence: initialData.sequence,
          stateApplicationMode: initialData.stateApplicationMode ?? "ALL",
          cityApplicationMode: initialData.cityApplicationMode ?? "ALL",
          stateIds: initialData.applicableStates?.map((r) => r.stateId) ?? [],
          cityIds: initialData.applicableCities?.map((r) => r.cityId) ?? [],
        }
      : undefined,
  });

  const stateMode = form.watch("stateApplicationMode");
  const cityMode = form.watch("cityApplicationMode");
  const selectedStateIds = form.watch("stateIds");
  const selectedCityIds = form.watch("cityIds");

  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const debouncedStateSearch = useDebounce(stateSearch.trim(), 300);
  const debouncedCitySearch = useDebounce(citySearch.trim(), 300);

  const prevStateMode = useRef(stateMode);
  const prevCityMode = useRef(cityMode);

  useEffect(() => {
    if (prevStateMode.current !== "ALL" && stateMode === "ALL") {
      form.setValue("stateIds", []);
      setStateSearch("");
    }
    prevStateMode.current = stateMode;
  }, [stateMode, form]);

  useEffect(() => {
    if (prevCityMode.current !== "ALL" && cityMode === "ALL") {
      form.setValue("cityIds", []);
      setCitySearch("");
    }
    prevCityMode.current = cityMode;
  }, [cityMode, form]);

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

  const cityInfinite = useInfiniteEntityList<City>({
    queryKey: ["charge-form-cities", debouncedCitySearch],
    pageSize: 10,
    enabled: cityMode !== "ALL",
    fetchPage: (page) =>
      cityService.getCities({
        page,
        limit: 10,
        ...(debouncedCitySearch ? { search: debouncedCitySearch } : {}),
        sortBy: "cityName",
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

  const onCityListScroll = useSelectContentInfiniteScroll({
    hasNextPage: cityInfinite.hasNextPage,
    isFetchingNextPage: cityInfinite.isFetchingNextPage,
    fetchNextPage: () => {
      void cityInfinite.fetchNextPage();
    },
  });

  const stateOptions = useMemo(() => {
    const loaded = new Map<number, { value: number; label: string }>();
    for (const row of initialData?.applicableStates ?? []) {
      const name = row.state?.stateName;
      if (name) loaded.set(row.stateId, { value: row.stateId, label: name });
    }
    for (const s of stateInfinite.rows) {
      loaded.set(s.id, { value: s.id, label: s.stateName || `State ${s.id}` });
    }
    for (const id of selectedStateIds) {
      if (!loaded.has(id)) {
        loaded.set(id, { value: id, label: `State #${id}` });
      }
    }
    return Array.from(loaded.values());
  }, [initialData?.applicableStates, stateInfinite.rows, selectedStateIds]);

  const cityOptions = useMemo(() => {
    const loaded = new Map<number, { value: number; label: string }>();
    for (const row of initialData?.applicableCities ?? []) {
      if (row.city) {
        loaded.set(row.cityId, { value: row.cityId, label: cityOptionLabel(row.city) });
      }
    }
    for (const c of cityInfinite.rows) {
      loaded.set(c.id, { value: c.id, label: cityOptionLabel(c) });
    }
    for (const id of selectedCityIds) {
      if (!loaded.has(id)) {
        loaded.set(id, { value: id, label: `City #${id}` });
      }
    }
    return Array.from(loaded.values());
  }, [initialData?.applicableCities, cityInfinite.rows, selectedCityIds]);

  const mutation = useMutation({
    mutationFn: (data: ChargeFormValues) => {
      const payload = omitEmptyCodeFields(data, ["code"]) as ChargeFormValues;
      const trimmedName = payload.name.trim();
      const codeTrimmed = typeof payload.code === "string" ? payload.code.trim() : "";
      const body: ChargeFormData = {
        name: trimmedName,
        sequence: payload.sequence,
        stateApplicationMode: payload.stateApplicationMode as ChargeStateApplicationMode,
        cityApplicationMode: payload.cityApplicationMode as ChargeCityApplicationMode,
        stateIds: payload.stateApplicationMode === "ALL" ? [] : payload.stateIds,
        cityIds: payload.cityApplicationMode === "ALL" ? [] : payload.cityIds,
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

  const cityListFooter =
    cityInfinite.isFetchingNextPage ? (
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
                  <IntegerInput
                    className={FLOATING_INNER_CONTROL}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onValueChange={field.onChange}
                    min={0}
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
                  <Select key={`stateApp-${field.value}`} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={FLOATING_INNER_CONTROL}>
                      <SelectValue placeholder="State application">
                        {optionLabelForSelect(field.value, STATE_SCOPE_OPTIONS)}
                      </SelectValue>
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
            name="cityApplicationMode"
            render={({ field }) => (
              <FloatingFormItem required label="City scope">
                <FormControl>
                  <Select key={`cityApp-${field.value}`} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={FLOATING_INNER_CONTROL}>
                      <SelectValue placeholder="City application">
                        {optionLabelForSelect(field.value, CITY_SCOPE_OPTIONS)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_SCOPE_OPTIONS.map((opt) => (
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
            name="cityIds"
            render={({ field }) => (
              <FloatingFormItem label="Cities (when scoped)">
                <FormControl>
                  {cityMode === "ALL" ? (
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      Not used when city scope is &quot;All cities&quot;.
                    </p>
                  ) : (
                    <MultiSelect
                      enableClientFilter={false}
                      options={cityOptions}
                      selected={field.value}
                      onChange={(next) => field.onChange(next as number[])}
                      placeholder="Select cities…"
                      searchPlaceholder="Search cities…"
                      emptyMessage={
                        cityInfinite.isInitialLoading ? "Loading…" : "No cities match. Try another search."
                      }
                      onSearchChange={setCitySearch}
                      onListScroll={onCityListScroll}
                      listFooter={cityListFooter}
                      onOpenChange={(open) => {
                        if (!open) setCitySearch("");
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
