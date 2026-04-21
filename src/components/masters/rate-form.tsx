"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { FieldErrors, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingFormItem, FLOATING_INNER_CONTROL, FLOATING_INNER_SELECT_TRIGGER } from "@/components/ui/floating-form-item";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { chargeService } from "@/services/masters/charge-service";
import { customerService } from "@/services/masters/customer-service";
import { productService } from "@/services/masters/product-service";
import { rateService } from "@/services/masters/rate-service";
import { zoneService } from "@/services/masters/zone-service";
import type {
  CreateRateMasterPayload,
  RateChargePayload,
  RateCharge,
  RateConditionPayload,
  RateCondition,
  RateDistanceSlabPayload,
  RateDistanceSlab,
  RateMaster,
  RateRouteRateSlab,
  RateRouteSlabPayload,
  RateZoneRate,
  RateZoneRatePayload,
  UpdateRateMasterPayload,
} from "@/types/masters/rate";

const DEFAULT_RATE_UPDATE_TYPE = "AWB_ENTRY_RATE";

const rateMasterSchema = z.object({
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  customerId: z.string().min(1, "Customer is required"),
  productId: z.string().min(1, "Product is required"),
  rateType: z.string().optional().or(z.literal("")),
  flatRate: z.string().optional().or(z.literal("")),
  weightUnitStep: z.string().optional().or(z.literal("")),
});

type RateMasterFormValues = z.infer<typeof rateMasterSchema>;

type TabValue =
  | "master"
  | "zone-rates"
  | "distance-slabs"
  | "route-slabs"
  | "oda-slabs"
  | "rate-conditions";

const RATE_TABS: Array<{ value: TabValue; label: string }> = [
  { value: "master", label: "Master" },
  { value: "zone-rates", label: "Zone matrix" },
  { value: "distance-slabs", label: "Distance matrix" },
  { value: "route-slabs", label: "AWB" },
  { value: "oda-slabs", label: "ODA / EDL" },
  { value: "rate-conditions", label: "Rate conditions" },
];

/** Radix Select forbids `value=""` on SelectItem; map this to cleared rate type in the form. */
const RATE_TYPE_UNSET = "__rate_type_unset__";

const RATE_TYPE_OPTIONS = [
  { value: RATE_TYPE_UNSET, label: "Not set" },
  { value: "FLAT", label: "Flat" },
] as const;

const CALCULATION_BASE_OPTIONS = [
  "CHARGE_WEIGHT",
  "CHARGE_WEIGHT_PER_FLOOR",
  "FLAT",
  "ACTUAL_WEIGHT",
  "DISTANCE_KM",
  "FREIGHT",
  "SHIPMENT_VALUE",
] as const;

const CONDITION_FIELD_OPTIONS = [
  "DIMENSION_LENGTH",
  "DIMENSION_WIDTH",
  "DIMENSION_HEIGHT",
  "DIMENSION_MAX",
  "WEIGHT",
  "CHARGEABLE_WEIGHT",
  "SHIPMENT_VALUE",
  "REVERSE_PICKUP",
  "APPOINTMENT_DELIVERY",
  "FLOOR_DELIVERY",
  "FLOOR_COUNT",
  "CFT",
] as const;

const CONDITION_OPERATOR_OPTIONS = ["GT", "GTE", "LT", "LTE", "EQ"] as const;

type ZoneRateDraft = {
  id?: number;
  fromZoneId: string;
  toZoneId: string;
  rate: string;
};

type WeightSlabDraft = {
  minWeight: string;
  maxWeight: string;
  rate: string;
};

type DistanceSlabDraft = {
  id?: number;
  minKm: string;
  maxKm: string;
  weightSlabs: WeightSlabDraft[];
};

type RouteSlabDraft = {
  id?: number;
  fromZoneId: string;
  toZoneId: string;
  minKm: string;
  maxKm: string;
  weightSlabs: WeightSlabDraft[];
};

type ChargeSlabDraft = {
  minValue: string;
  maxValue: string;
  rate: string;
};

type RateChargeDraft = {
  id?: number;
  chargeId: string;
  name: string;
  calculationBase: string;
  value: string;
  isPercentage: boolean;
  minValue: string;
  maxValue: string;
  sequence: string;
  chargeSlabs: ChargeSlabDraft[];
};

type RateConditionDraft = {
  id?: number;
  chargeId: string;
  field: string;
  operator: string;
  value: string;
  chargeName: string;
  chargeAmount: string;
  calculationBase: string;
  isPercentage: boolean;
};

type ZoneRateRow = Partial<RateZoneRate> & Pick<RateZoneRate, "fromZoneId" | "toZoneId" | "rate">;
type DistanceSlabRow = Partial<RateDistanceSlab> & Pick<RateDistanceSlab, "minKm" | "maxKm" | "weightSlabs">;
type RouteSlabRow = Partial<RateRouteRateSlab> & Pick<RateRouteRateSlab, "weightSlabs">;
type RateChargeRow = Partial<RateCharge> &
  Pick<RateCharge, "value" | "isPercentage" | "chargeSlabs"> &
  Partial<Pick<RateCharge, "chargeId" | "name" | "calculationBase" | "minValue" | "maxValue" | "sequence">>;
type RateConditionRow = Partial<RateCondition> &
  Pick<RateCondition, "field" | "operator" | "value" | "chargeAmount" | "isPercentage"> &
  Partial<Pick<RateCondition, "chargeId" | "chargeName" | "calculationBase">>;

interface RateFormProps {
  initialData?: RateMaster | null;
}

export function RateForm({ initialData }: RateFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!initialData;
  const [activeTab, setActiveTab] = useState<TabValue>("master");
  const [zoneRates, setZoneRates] = useState<ZoneRateRow[]>([]);
  const [distanceSlabs, setDistanceSlabs] = useState<DistanceSlabRow[]>([]);
  const [routeSlabs, setRouteSlabs] = useState<RouteSlabRow[]>([]);
  const [odaSlabs, setOdaSlabs] = useState<RouteSlabRow[]>([]);
  const [rateConditions, setRateConditions] = useState<RateConditionRow[]>([]);

  const form = useForm<RateMasterFormValues>({
    resolver: zodResolver(rateMasterSchema) as Resolver<RateMasterFormValues>,
    defaultValues: {
      fromDate: "",
      toDate: "",
      customerId: "",
      productId: "",
      rateType: "",
      flatRate: "",
      weightUnitStep: "",
    },
  });

  useEffect(() => {
    if (!initialData) {
      form.reset({
        fromDate: "",
        toDate: "",
        customerId: "",
        productId: "",
        rateType: "",
        flatRate: "",
        weightUnitStep: "",
      });
      setZoneRates([]);
      setDistanceSlabs([]);
      setRouteSlabs([]);
      setOdaSlabs([]);
      setRateConditions([]);
      return;
    }

    form.reset({
      fromDate: initialData.fromDate ? initialData.fromDate.slice(0, 10) : "",
      toDate: initialData.toDate ? initialData.toDate.slice(0, 10) : "",
      customerId: initialData.customerId != null ? String(initialData.customerId) : "",
      rateType: initialData.rateType || "",
      flatRate: initialData.flatRate != null && initialData.flatRate !== undefined ? String(initialData.flatRate) : "",
      weightUnitStep:
        initialData.weightUnitStep != null && initialData.weightUnitStep !== undefined
          ? String(initialData.weightUnitStep)
          : "",
      productId: initialData.productId != null ? String(initialData.productId) : "",
    });
    setZoneRates(initialData.zoneRates ?? []);
    setDistanceSlabs(initialData.distanceSlabs ?? []);
    setRouteSlabs(initialData.routeRateSlabs ?? []);
    setOdaSlabs(initialData.odaRateSlabs ?? []);
    setRateConditions(initialData.rateConditions ?? []);
  }, [form, initialData]);

  const { data: customerResponse } = useQuery({
    queryKey: ["rate-form-customers"],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });
  const { data: productResponse } = useQuery({
    queryKey: ["rate-form-products"],
    queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: "productName", sortOrder: "asc" }),
  });
  const { data: zoneResponse } = useQuery({
    queryKey: ["rate-form-zones"],
    queryFn: () => zoneService.getZones({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });

  const customerOptions = useMemo(() => customerResponse?.data ?? [], [customerResponse]);
  const productOptions = useMemo(() => productResponse?.data ?? [], [productResponse]);
  const zoneOptions = useMemo(() => zoneResponse?.data ?? [], [zoneResponse]);

  const zoneLabelById = useMemo(() => new Map(zoneOptions.map((item) => [item.id, `${item.code || item.id}${item.name ? ` - ${item.name}` : ""}`])), [zoneOptions]);

  const mutation = useMutation({
    mutationFn: async (values: RateMasterFormValues) => {
      const updateType =
        isEdit && initialData?.updateType ? initialData.updateType : DEFAULT_RATE_UPDATE_TYPE;
      const payload = buildPayload(
        updateType,
        values,
        zoneRates,
        distanceSlabs,
        routeSlabs,
        odaSlabs,
        rateConditions,
      );
      if (isEdit && initialData) {
        const updatePayload: UpdateRateMasterPayload = {
          ...payload,
          version: initialData.version ?? 1,
        };
        return rateService.updateRateMaster(initialData.id, updatePayload);
      }
      return rateService.createRateMaster(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-masters"] });
      if (isEdit && initialData) {
        queryClient.invalidateQueries({ queryKey: ["rate-master", initialData.id] });
      }
      toast.success(`Rate master ${isEdit ? "updated" : "created"} successfully`);
      router.push("/masters/rates");
    },
    onError: (error: Error) => {
      toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} rate master`);
    },
  });

  const activeTabIndex = RATE_TABS.findIndex((tab) => tab.value === activeTab);
  const isFirstTab = activeTabIndex === 0;
  const isLastTab = activeTabIndex === RATE_TABS.length - 1;

  function onSubmit(values: RateMasterFormValues) {
    mutation.mutate(values);
  }

  function onInvalid(errors: FieldErrors<RateMasterFormValues>) {
    const message = Object.entries(errors)
      .map(([field, error]) => `${field}: ${error?.message ?? "Invalid value"}`)
      .join(", ");
    toast.error(message || "Please check the form");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-6">
          <TabsList className="h-auto flex w-full flex-wrap justify-start rounded-full border border-border/60 bg-muted/40 p-2">
            {RATE_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full px-5 py-2"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="master" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FloatingFormItem label="From Date">
                    <FormControl>
                      <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toDate"
                render={({ field }) => (
                  <FloatingFormItem label="To Date">
                    <FormControl>
                      <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FloatingFormItem label="Customer">
                    <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customerOptions.map((customer) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name || customer.code || `Customer ${customer.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FloatingFormItem label="Product">
                    <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productOptions.map((product) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.productName || product.productCode || `Product ${product.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rateType"
                render={({ field }) => (
                  <FloatingFormItem label="Rate type (optional)">
                    <Select
                      key={field.value || RATE_TYPE_UNSET}
                      value={field.value?.trim() ? field.value : RATE_TYPE_UNSET}
                      onValueChange={(v) => field.onChange(v === RATE_TYPE_UNSET ? "" : v)}
                    >
                      <FormControl>
                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                          <SelectValue placeholder="Select rate type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RATE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="flatRate"
                render={({ field }) => (
                  <FloatingFormItem label="Flat rate (optional)">
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Flat freight amount" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightUnitStep"
                render={({ field }) => (
                  <FloatingFormItem label="Weight step (optional)">
                    <FormControl>
                      <Input type="number" step="0.001" placeholder="Weight rounding step" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="zone-rates" className="space-y-4">
            <ZoneRatesEditor
              zoneRates={zoneRates}
              setZoneRates={setZoneRates}
              zoneLabelById={zoneLabelById}
              zoneOptions={zoneOptions}
              rateMasterId={initialData?.id}
              isEdit={false}
            />
          </TabsContent>

          <TabsContent value="distance-slabs" className="space-y-4">
            <DistanceSlabsEditor
              distanceSlabs={distanceSlabs}
              setDistanceSlabs={setDistanceSlabs}
              rateMasterId={initialData?.id}
              isEdit={false}
            />
          </TabsContent>

          <TabsContent value="route-slabs" className="space-y-4">
            <RouteSlabsEditor
              title="AWB slabs (base freight)"
              description="Match by From Zone, To Zone, and/or km band; each slab needs at least one weight slab."
              slabs={routeSlabs}
              setSlabs={setRouteSlabs}
              zoneLabelById={zoneLabelById}
              zoneOptions={zoneOptions}
            />
          </TabsContent>

          <TabsContent value="oda-slabs" className="space-y-4">
            <RouteSlabsEditor
              title="ODA / EDL slabs"
              description="Out-of-delivery-area surcharge. Same structure as main freight slabs."
              slabs={odaSlabs}
              setSlabs={setOdaSlabs}
              zoneLabelById={zoneLabelById}
              zoneOptions={zoneOptions}
            />
          </TabsContent>

          <TabsContent value="rate-conditions" className="space-y-4">
            <RateConditionsEditor
              rateConditions={rateConditions}
              setRateConditions={setRateConditions}
              rateMasterId={initialData?.id}
              isEdit={false}
            />
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap justify-end gap-3 border-t pt-6">
          {!isFirstTab && (
            <Button type="button" variant="expressNext" onClick={() => setActiveTab(RATE_TABS[Math.max(activeTabIndex - 1, 0)].value)}>
              Previous
            </Button>
          )}
          {isFirstTab && (
            <Button type="button" variant="expressDanger" onClick={() => router.push("/masters/rates")}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="success" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Rate Master" : "Create Rate Master"}
          </Button>
          {!isLastTab && (
            <Button type="button" variant="expressNext" onClick={() => setActiveTab(RATE_TABS[Math.min(activeTabIndex + 1, RATE_TABS.length - 1)].value)}>
              Next
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function mapRouteSlabsForApi(rows: RouteSlabRow[]): RateRouteSlabPayload[] {
  return rows.map((row) => {
    const { id: _id, rateMasterId: _rm, createdAt: _c, updatedAt: _u, deletedAt: _d, fromZone: _fz, toZone: _tz, weightSlabs, ...rest } = row;
    const ws = (weightSlabs || []).map((w) => ({
      minWeight: Number(w.minWeight),
      maxWeight: Number(w.maxWeight),
      rate: Number(w.rate),
    }));
    const slab: RateRouteSlabPayload = { weightSlabs: ws };
    if (rest.fromZoneId != null && rest.fromZoneId !== undefined) slab.fromZoneId = Number(rest.fromZoneId);
    if (rest.toZoneId != null && rest.toZoneId !== undefined) slab.toZoneId = Number(rest.toZoneId);
    if (rest.minKm != null && rest.minKm !== undefined && Number.isFinite(Number(rest.minKm))) slab.minKm = Number(rest.minKm);
    if (rest.maxKm != null && rest.maxKm !== undefined && Number.isFinite(Number(rest.maxKm))) slab.maxKm = Number(rest.maxKm);
    return slab;
  });
}

function mapZoneRatesForApi(rows: ZoneRateRow[]): RateZoneRatePayload[] {
  return rows
    .map((row) => ({
      fromZoneId: Number(row.fromZoneId),
      toZoneId: Number(row.toZoneId),
      rate: Number(row.rate),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.fromZoneId) &&
        Number.isFinite(row.toZoneId) &&
        Number.isFinite(row.rate),
    );
}

function mapDistanceSlabsForApi(rows: DistanceSlabRow[]): RateDistanceSlabPayload[] {
  return rows
    .map((row) => ({
      minKm: Number(row.minKm),
      maxKm: Number(row.maxKm),
      weightSlabs: (row.weightSlabs ?? [])
        .map((item) => ({
          minWeight: Number(item.minWeight),
          maxWeight: Number(item.maxWeight),
          rate: Number(item.rate),
        }))
        .filter(
          (item) =>
            Number.isFinite(item.minWeight) &&
            Number.isFinite(item.maxWeight) &&
            Number.isFinite(item.rate),
        ),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.minKm) &&
        Number.isFinite(row.maxKm) &&
        row.weightSlabs.length > 0,
    );
}

function buildPayload(
  updateType: string,
  values: RateMasterFormValues,
  zoneRates: ZoneRateRow[],
  distanceSlabs: DistanceSlabRow[],
  routeSlabs: RouteSlabRow[],
  odaSlabs: RouteSlabRow[],
  rateConditions: RateConditionRow[],
): CreateRateMasterPayload {
  const flatRaw = values.flatRate?.trim();
  const weightStepRaw = values.weightUnitStep?.trim();
  const flatRate =
    flatRaw !== undefined && flatRaw !== "" && Number.isFinite(Number(flatRaw)) ? Number(flatRaw) : undefined;
  const weightUnitStep =
    weightStepRaw !== undefined && weightStepRaw !== "" && Number.isFinite(Number(weightStepRaw))
      ? Number(weightStepRaw)
      : undefined;

  const payload: CreateRateMasterPayload = {
    updateType,
    fromDate: values.fromDate,
    toDate: values.toDate,
    customerId: Number(values.customerId),
    productId: Number(values.productId),
    zoneRates: mapZoneRatesForApi(zoneRates),
    distanceSlabs: mapDistanceSlabsForApi(distanceSlabs),
    rateSlabs: mapRouteSlabsForApi(routeSlabs),
    odaRateSlabs: mapRouteSlabsForApi(odaSlabs),
    rateConditions: rateConditions.map(({ id, rateMasterId, createdAt, updatedAt, deletedAt, charge, ...row }) => {
      const next: RateConditionPayload = {
        field: row.field,
        operator: row.operator,
        value: Number(row.value),
        chargeAmount: Number(row.chargeAmount),
      };
      if (row.chargeId != null) next.chargeId = row.chargeId;
      if (row.chargeName?.trim()) next.chargeName = row.chargeName.trim();
      if (row.calculationBase?.trim()) next.calculationBase = row.calculationBase.trim();
      if (row.isPercentage != null) next.isPercentage = row.isPercentage;
      return next;
    }),
  };

  const rt = values.rateType?.trim();
  if (rt) payload.rateType = rt;
  if (flatRate !== undefined) payload.flatRate = flatRate;
  if (weightUnitStep !== undefined) payload.weightUnitStep = weightUnitStep;

  return payload;
}

function RouteSlabsEditor({
  title,
  description,
  slabs,
  setSlabs,
  zoneLabelById,
  zoneOptions,
}: {
  title: string;
  description: string;
  slabs: RouteSlabRow[];
  setSlabs: Dispatch<SetStateAction<RouteSlabRow[]>>;
  zoneLabelById: Map<number, string>;
  zoneOptions: Array<{ id: number; code?: string; name?: string }>;
}) {
  const [draft, setDraft] = useState<RouteSlabDraft>({
    fromZoneId: "",
    toZoneId: "",
    minKm: "",
    maxKm: "",
    weightSlabs: [{ minWeight: "", maxWeight: "", rate: "" }],
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingIndex === null) return;
    const row = slabs[editingIndex];
    if (!row) return;
    const ws = row.weightSlabs ?? [];
    setDraft({
      id: row.id,
      fromZoneId: row.fromZoneId != null ? String(row.fromZoneId) : "",
      toZoneId: row.toZoneId != null ? String(row.toZoneId) : "",
      minKm: row.minKm != null ? String(row.minKm) : "",
      maxKm: row.maxKm != null ? String(row.maxKm) : "",
      weightSlabs:
        ws.length > 0
          ? ws.map((item) => ({
              minWeight: String(item.minWeight),
              maxWeight: String(item.maxWeight),
              rate: String(item.rate),
            }))
          : [{ minWeight: "", maxWeight: "", rate: "" }],
    });
  }, [editingIndex, slabs]);

  function resetDraft() {
    setDraft({
      id: undefined,
      fromZoneId: "",
      toZoneId: "",
      minKm: "",
      maxKm: "",
      weightSlabs: [{ minWeight: "", maxWeight: "", rate: "" }],
    });
    setEditingIndex(null);
  }

  function saveDraft() {
    const weightSlabs = draft.weightSlabs
      .map((item) => ({ minWeight: Number(item.minWeight), maxWeight: Number(item.maxWeight), rate: Number(item.rate) }))
      .filter((item) => Number.isFinite(item.minWeight) && Number.isFinite(item.maxWeight) && Number.isFinite(item.rate));
    if (weightSlabs.length === 0) return;

    const fromZoneId =
      draft.fromZoneId && draft.fromZoneId !== "__none__" ? Number(draft.fromZoneId) : undefined;
    const toZoneId = draft.toZoneId && draft.toZoneId !== "__none__" ? Number(draft.toZoneId) : undefined;
    const minKmParsed = draft.minKm.trim() ? Number(draft.minKm) : undefined;
    const maxKmParsed = draft.maxKm.trim() ? Number(draft.maxKm) : undefined;

    const next: RouteSlabRow = {
      weightSlabs,
      ...(draft.id != null ? { id: draft.id } : {}),
      ...(fromZoneId !== undefined && Number.isFinite(fromZoneId) ? { fromZoneId } : {}),
      ...(toZoneId !== undefined && Number.isFinite(toZoneId) ? { toZoneId } : {}),
      ...(minKmParsed !== undefined && Number.isFinite(minKmParsed) ? { minKm: minKmParsed } : {}),
      ...(maxKmParsed !== undefined && Number.isFinite(maxKmParsed) ? { maxKm: maxKmParsed } : {}),
    };

    setSlabs((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push(next);
      else copy[editingIndex] = { ...copy[editingIndex], ...next };
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    setSlabs((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      resetDraft();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex((current) => (current === null ? current : current - 1));
    }
  }

  function updateWeightSlab(index: number, field: keyof WeightSlabDraft, value: string) {
    setDraft((current) => ({
      ...current,
      weightSlabs: current.weightSlabs.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addWeightRow() {
    setDraft((current) => ({
      ...current,
      weightSlabs: [...current.weightSlabs, { minWeight: "", maxWeight: "", rate: "" }],
    }));
  }

  function removeWeightRow(index: number) {
    setDraft((current) => ({
      ...current,
      weightSlabs: current.weightSlabs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const canSave = draft.weightSlabs.some(
    (w) =>
      w.minWeight.trim() &&
      w.maxWeight.trim() &&
      w.rate.trim() &&
      Number.isFinite(Number(w.minWeight)) &&
      Number.isFinite(Number(w.maxWeight)) &&
      Number.isFinite(Number(w.rate)),
  );

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Select
          value={draft.fromZoneId || "__none__"}
          onValueChange={(value) => setDraft((current) => ({ ...current, fromZoneId: value === "__none__" ? "" : value }))}
        >
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="From Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— From Zone —</SelectItem>
            {zoneOptions.map((zone) => (
              <SelectItem key={zone.id} value={String(zone.id)}>
                {zone.code || zone.name || `Zone ${zone.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={draft.toZoneId || "__none__"}
          onValueChange={(value) => setDraft((current) => ({ ...current, toZoneId: value === "__none__" ? "" : value }))}
        >
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="To Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— To Zone —</SelectItem>
            {zoneOptions.map((zone) => (
              <SelectItem key={zone.id} value={String(zone.id)}>
                {zone.code || zone.name || `Zone ${zone.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Min km (optional)"
          className={FLOATING_INNER_CONTROL}
          value={draft.minKm}
          onChange={(e) => setDraft((current) => ({ ...current, minKm: e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Max km (optional)"
          className={FLOATING_INNER_CONTROL}
          value={draft.maxKm}
          onChange={(e) => setDraft((current) => ({ ...current, maxKm: e.target.value }))}
        />
      </div>

      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Weight slabs</p>
          <Button type="button" variant="outline" size="sm" onClick={addWeightRow}>
            <Plus className="h-4 w-4" />
            Add weight slab
          </Button>
        </div>
        <div className="space-y-3">
          {draft.weightSlabs.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input
                type="number"
                placeholder="Min weight"
                className={FLOATING_INNER_CONTROL}
                value={item.minWeight}
                onChange={(e) => updateWeightSlab(index, "minWeight", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max weight"
                className={FLOATING_INNER_CONTROL}
                value={item.maxWeight}
                onChange={(e) => updateWeightSlab(index, "maxWeight", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Rate"
                className={FLOATING_INNER_CONTROL}
                value={item.rate}
                onChange={(e) => updateWeightSlab(index, "rate", e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[var(--express-danger)]"
                  onClick={() => removeWeightRow(index)}
                  disabled={draft.weightSlabs.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="success" onClick={saveDraft} disabled={!canSave}>
          {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editingIndex === null ? "Add slab" : "Update slab"}
        </Button>
        <Button type="button" variant="outline" onClick={resetDraft}>
          Clear
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">From Zone</TableHead>
              <TableHead className="font-semibold text-primary-foreground">To Zone</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Km</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Weight slabs</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slabs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No slabs yet. Add at least one weight slab per row.
                </TableCell>
              </TableRow>
            ) : (
              slabs.map((row, index) => (
                <TableRow key={`${row.id ?? "new"}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>
                    {row.fromZoneId != null ? zoneLabelById.get(row.fromZoneId) || row.fromZoneId : "—"}
                  </TableCell>
                  <TableCell>{row.toZoneId != null ? zoneLabelById.get(row.toZoneId) || row.toZoneId : "—"}</TableCell>
                  <TableCell>
                    {row.minKm != null || row.maxKm != null ? `${row.minKm ?? "—"} – ${row.maxKm ?? "—"}` : "—"}
                  </TableCell>
                  <TableCell>{row.weightSlabs?.length ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)]" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeRow(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ZoneRatesEditor({
  zoneRates,
  setZoneRates,
  zoneLabelById,
  zoneOptions,
  rateMasterId,
  isEdit,
}: {
  zoneRates: ZoneRateRow[];
  setZoneRates: Dispatch<SetStateAction<ZoneRateRow[]>>;
  zoneLabelById: Map<number, string>;
  zoneOptions: Array<{ id: number; code?: string; name?: string }>;
  rateMasterId?: number;
  isEdit: boolean;
}) {
  const [draft, setDraft] = useState<ZoneRateDraft>({ fromZoneId: "", toZoneId: "", rate: "" });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingRowId = editingIndex === null ? undefined : zoneRates[editingIndex]?.id;
  const { data: editingRowResponse } = useQuery({
    queryKey: ["rate-zone-rate", rateMasterId, editingRowId],
    queryFn: () => rateService.getZoneRateById(rateMasterId!, editingRowId!),
    enabled: isEdit && Boolean(rateMasterId) && Boolean(editingRowId),
  });
  const createMutation = useMutation({
    mutationFn: async (payload: RateZoneRatePayload) => {
      if (!rateMasterId) {
        throw new Error("Rate master id is required");
      }
      return rateService.createZoneRate(rateMasterId, payload);
    },
    onSuccess: (response) => {
      setZoneRates((current) => [...current, response.data]);
      toast.success("Zone rate added");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add zone rate");
    },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ rowId, payload }: { rowId: number; payload: RateZoneRatePayload }) => {
      if (!rateMasterId) {
        throw new Error("Rate master id is required");
      }
      return rateService.updateZoneRate(rateMasterId, rowId, payload);
    },
    onSuccess: (response, variables) => {
      setZoneRates((current) =>
        current.map((row) =>
          row.id === variables.rowId ? { ...response.data, id: response.data.id } : row,
        ),
      );
      toast.success("Zone rate updated");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update zone rate");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async ({ rowId }: { rowId: number; index: number }) => {
      if (!rateMasterId) {
        throw new Error("Rate master id is required");
      }
      return rateService.deleteZoneRate(rateMasterId, rowId);
    },
    onSuccess: (_, variables) => {
      const { rowId, index } = variables;
      setZoneRates((current) => current.filter((row) => row.id !== rowId));
      toast.success("Zone rate deleted");
      if (editingIndex === index) {
        resetDraft();
      } else if (editingIndex !== null && index < editingIndex) {
        setEditingIndex((current) => (current === null ? current : current - 1));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete zone rate");
    },
  });

  useEffect(() => {
    if (editingIndex === null) return;
    const row = zoneRates[editingIndex];
    if (!row) return;
    const details = editingRowResponse?.data ?? row;
    setDraft({
      id: details.id,
      fromZoneId: String(details.fromZoneId),
      toZoneId: String(details.toZoneId),
      rate: String(details.rate),
    });
  }, [editingIndex, editingRowResponse?.data, zoneRates]);

  function resetDraft() {
    setDraft({ fromZoneId: "", toZoneId: "", rate: "" });
    setEditingIndex(null);
  }

  function saveDraft() {
    if (!draft.fromZoneId.trim() || !draft.toZoneId.trim() || !draft.rate.trim()) return;
    const fromZoneId = Number(draft.fromZoneId);
    const toZoneId = Number(draft.toZoneId);
    const rate = Number(draft.rate);
    if (!Number.isFinite(fromZoneId) || !Number.isFinite(toZoneId) || !Number.isFinite(rate)) return;
    if (fromZoneId <= 0 || toZoneId <= 0) return;
    const next: ZoneRateRow = { id: draft.id, fromZoneId, toZoneId, rate };
    if (isEdit && rateMasterId && draft.id) {
      updateMutation.mutate({ rowId: draft.id, payload: { fromZoneId, toZoneId, rate } });
      return;
    }
    if (isEdit && rateMasterId && !draft.id) {
      createMutation.mutate({ fromZoneId, toZoneId, rate });
      return;
    }
    setZoneRates((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push(next);
      else copy[editingIndex] = next;
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    const row = zoneRates[index];
    if (isEdit && rateMasterId && row?.id) {
      deleteMutation.mutate({ rowId: row.id, index });
      return;
    }
    setZoneRates((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      resetDraft();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex((current) => (current === null ? current : current - 1));
    }
  }

  const canSaveDraft =
    draft.fromZoneId.trim().length > 0 &&
    draft.toZoneId.trim().length > 0 &&
    draft.rate.trim().length > 0 &&
    Number(draft.fromZoneId) > 0 &&
    Number(draft.toZoneId) > 0 &&
    Number.isFinite(Number(draft.rate));

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Select key={draft.fromZoneId || "from"} value={draft.fromZoneId} onValueChange={(value) => setDraft((current) => ({ ...current, fromZoneId: value }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="From Zone" />
          </SelectTrigger>
          <SelectContent>
            {zoneOptions.map((zone) => (
              <SelectItem key={zone.id} value={String(zone.id)}>
                {zone.code || zone.name || `Zone ${zone.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select key={draft.toZoneId || "to"} value={draft.toZoneId} onValueChange={(value) => setDraft((current) => ({ ...current, toZoneId: value }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="To Zone" />
          </SelectTrigger>
          <SelectContent>
            {zoneOptions.map((zone) => (
              <SelectItem key={zone.id} value={String(zone.id)}>
                {zone.code || zone.name || `Zone ${zone.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" step="0.01" placeholder="Rate" className={FLOATING_INNER_CONTROL} value={draft.rate} onChange={(e) => setDraft((current) => ({ ...current, rate: e.target.value }))} />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="success"
            onClick={saveDraft}
            disabled={createMutation.isPending || updateMutation.isPending || !canSaveDraft}
          >
            {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editingIndex === null ? "Add" : "Update"}
          </Button>
          <Button type="button" variant="outline" onClick={resetDraft}>
            Clear
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">From Zone</TableHead>
              <TableHead className="font-semibold text-primary-foreground">To Zone</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Rate</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zoneRates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No zone rates added yet.
                </TableCell>
              </TableRow>
            ) : (
              zoneRates.map((row, index) => (
                <TableRow key={`${row.fromZoneId}-${row.toZoneId}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>{zoneLabelById.get(row.fromZoneId) || row.fromZoneId}</TableCell>
                  <TableCell>{zoneLabelById.get(row.toZoneId) || row.toZoneId}</TableCell>
                  <TableCell>{row.rate}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)]" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeRow(index)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DistanceSlabsEditor({
  distanceSlabs,
  setDistanceSlabs,
  rateMasterId,
  isEdit,
}: {
  distanceSlabs: DistanceSlabRow[];
  setDistanceSlabs: Dispatch<SetStateAction<DistanceSlabRow[]>>;
  rateMasterId?: number;
  isEdit: boolean;
}) {
  const [draft, setDraft] = useState<DistanceSlabDraft>({ minKm: "", maxKm: "", weightSlabs: [{ minWeight: "", maxWeight: "", rate: "" }] });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingRowId = editingIndex === null ? undefined : distanceSlabs[editingIndex]?.id;
  const { data: editingRowResponse } = useQuery({
    queryKey: ["rate-distance-slab", rateMasterId, editingRowId],
    queryFn: () => rateService.getDistanceSlabById(rateMasterId!, editingRowId!),
    enabled: isEdit && Boolean(rateMasterId) && Boolean(editingRowId),
  });
  const createMutation = useMutation({
    mutationFn: async (payload: RateDistanceSlabPayload) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.createDistanceSlab(rateMasterId, payload);
    },
    onSuccess: (response) => {
      setDistanceSlabs((current) => [...current, response.data]);
      toast.success("Distance slab added");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add distance slab");
    },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ rowId, payload }: { rowId: number; payload: RateDistanceSlabPayload }) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.updateDistanceSlab(rateMasterId, rowId, payload);
    },
    onSuccess: (response, variables) => {
      setDistanceSlabs((current) => current.map((row) => (row.id === variables.rowId ? response.data : row)));
      toast.success("Distance slab updated");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update distance slab");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async ({ rowId }: { rowId: number; index: number }) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.deleteDistanceSlab(rateMasterId, rowId);
    },
    onSuccess: (_, variables) => {
      const { rowId, index } = variables;
      setDistanceSlabs((current) => current.filter((row) => row.id !== rowId));
      toast.success("Distance slab deleted");
      if (editingIndex === index) {
        resetDraft();
      } else if (editingIndex !== null && index < editingIndex) {
        setEditingIndex((current) => (current === null ? current : current - 1));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete distance slab");
    },
  });

  useEffect(() => {
    if (editingIndex === null) return;
    const row = distanceSlabs[editingIndex];
    if (!row) return;
    const details = editingRowResponse?.data ?? row;
    setDraft({
      id: details.id,
      minKm: String(details.minKm),
      maxKm: String(details.maxKm),
      weightSlabs: (details.weightSlabs ?? []).map((item) => ({ minWeight: String(item.minWeight), maxWeight: String(item.maxWeight), rate: String(item.rate) })),
    });
  }, [editingIndex, editingRowResponse?.data, distanceSlabs]);

  function resetDraft() {
    setDraft({ id: undefined, minKm: "", maxKm: "", weightSlabs: [{ minWeight: "", maxWeight: "", rate: "" }] });
    setEditingIndex(null);
  }

  function saveDraft() {
    const minKm = Number(draft.minKm);
    const maxKm = Number(draft.maxKm);
    const weightSlabs = draft.weightSlabs
      .map((item) => ({ minWeight: Number(item.minWeight), maxWeight: Number(item.maxWeight), rate: Number(item.rate) }))
      .filter((item) => Number.isFinite(item.minWeight) && Number.isFinite(item.maxWeight) && Number.isFinite(item.rate));
    if (!Number.isFinite(minKm) || !Number.isFinite(maxKm)) return;
    if (weightSlabs.length === 0) return;
    const next: RateDistanceSlabPayload = { minKm, maxKm, weightSlabs };
    const editingRowId = distanceSlabs[editingIndex ?? -1]?.id ?? draft.id;
    if (isEdit && rateMasterId && editingRowId) {
      updateMutation.mutate({ rowId: editingRowId, payload: next });
      return;
    }
    if (isEdit && rateMasterId) {
      createMutation.mutate(next);
      return;
    }
    setDistanceSlabs((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push({ ...next } as DistanceSlabRow);
      else copy[editingIndex] = { ...(next as DistanceSlabRow) };
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    const row = distanceSlabs[index];
    if (isEdit && rateMasterId && row?.id) {
      deleteMutation.mutate({ rowId: row.id, index });
      return;
    }
    setDistanceSlabs((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      resetDraft();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex((current) => (current === null ? current : current - 1));
    }
  }

  function updateWeightSlab(index: number, field: keyof WeightSlabDraft, value: string) {
    setDraft((current) => ({
      ...current,
      weightSlabs: current.weightSlabs.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addWeightRow() {
    setDraft((current) => ({
      ...current,
      weightSlabs: [...current.weightSlabs, { minWeight: "", maxWeight: "", rate: "" }],
    }));
  }

  function removeWeightRow(index: number) {
    setDraft((current) => ({
      ...current,
      weightSlabs: current.weightSlabs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Input type="number" placeholder="Min km" className={FLOATING_INNER_CONTROL} value={draft.minKm} onChange={(e) => setDraft((current) => ({ ...current, minKm: e.target.value }))} />
        <Input type="number" placeholder="Max km" className={FLOATING_INNER_CONTROL} value={draft.maxKm} onChange={(e) => setDraft((current) => ({ ...current, maxKm: e.target.value }))} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={addWeightRow}>
            <Plus className="h-4 w-4" />
            Add weight slab
          </Button>
          <Button type="button" variant="success" onClick={saveDraft} disabled={createMutation.isPending || updateMutation.isPending}>
            {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editingIndex === null ? "Add" : "Update"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-background p-3">
        <p className="mb-3 text-sm font-semibold text-foreground">Weight Slabs</p>
        <div className="space-y-3">
          {draft.weightSlabs.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input type="number" placeholder="Min weight" className={FLOATING_INNER_CONTROL} value={item.minWeight} onChange={(e) => updateWeightSlab(index, "minWeight", e.target.value)} />
              <Input type="number" placeholder="Max weight" className={FLOATING_INNER_CONTROL} value={item.maxWeight} onChange={(e) => updateWeightSlab(index, "maxWeight", e.target.value)} />
              <Input type="number" step="0.01" placeholder="Rate" className={FLOATING_INNER_CONTROL} value={item.rate} onChange={(e) => updateWeightSlab(index, "rate", e.target.value)} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeWeightRow(index)} disabled={draft.weightSlabs.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">Min km</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Max km</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Weight slabs</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distanceSlabs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No distance slabs added yet.
                </TableCell>
              </TableRow>
            ) : (
              distanceSlabs.map((row, index) => (
                <TableRow key={`${row.minKm}-${row.maxKm}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>{row.minKm}</TableCell>
                  <TableCell>{row.maxKm}</TableCell>
                  <TableCell>{row.weightSlabs.length}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)]" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeRow(index)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RateChargesEditor({
  rateCharges,
  setRateCharges,
  rateMasterId,
  isEdit,
  productId: _productId,
}: {
  rateCharges: RateChargeRow[];
  setRateCharges: Dispatch<SetStateAction<RateChargeRow[]>>;
  rateMasterId?: number;
  isEdit: boolean;
  /** Reserved for future filtering (e.g. charges-by-product); catalog lists full charge master. */
  productId?: string;
}) {
  const { data: chargeListResponse } = useQuery({
    queryKey: ["rate-form-charge-master"],
    queryFn: () => chargeService.getCharges({ page: 1, limit: 200, sortBy: "code", sortOrder: "asc" }),
  });

  const chargesForSelect = chargeListResponse?.data ?? [];

  const [draft, setDraft] = useState<RateChargeDraft>({
    id: undefined,
    chargeId: "",
    name: "",
    calculationBase: "",
    value: "",
    isPercentage: false,
    minValue: "",
    maxValue: "",
    sequence: "",
    chargeSlabs: [{ minValue: "", maxValue: "", rate: "" }],
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingRowId = editingIndex === null ? undefined : rateCharges[editingIndex]?.id;
  const { data: editingRowResponse } = useQuery({
    queryKey: ["rate-charge", rateMasterId, editingRowId],
    queryFn: () => rateService.getRateChargeById(rateMasterId!, editingRowId!),
    enabled: isEdit && Boolean(rateMasterId) && Boolean(editingRowId),
  });
  const createMutation = useMutation({
    mutationFn: async (payload: RateChargePayload) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.createRateCharge(rateMasterId, payload);
    },
    onSuccess: (response) => {
      setRateCharges((current) => [...current, response.data]);
      toast.success("Rate charge added");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add rate charge");
    },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ rowId, payload }: { rowId: number; payload: RateChargePayload }) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.updateRateCharge(rateMasterId, rowId, payload);
    },
    onSuccess: (response, variables) => {
      setRateCharges((current) => current.map((row) => (row.id === variables.rowId ? response.data : row)));
      toast.success("Rate charge updated");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update rate charge");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async ({ rowId }: { rowId: number; index: number }) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.deleteRateCharge(rateMasterId, rowId);
    },
    onSuccess: (_, variables) => {
      const { rowId, index } = variables;
      setRateCharges((current) => current.filter((row) => row.id !== rowId));
      toast.success("Rate charge deleted");
      if (editingIndex === index) {
        resetDraft();
      } else if (editingIndex !== null && index < editingIndex) {
        setEditingIndex((current) => (current === null ? current : current - 1));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete rate charge");
    },
  });

  useEffect(() => {
    if (editingIndex === null) return;
    const row = rateCharges[editingIndex];
    if (!row) return;
    const details = editingRowResponse?.data ?? row;
    setDraft({
      id: details.id,
      chargeId: details.chargeId != null ? String(details.chargeId) : "",
      name: details.name ?? "",
      calculationBase: details.calculationBase ?? "",
      value: String(details.value),
      isPercentage: Boolean(details.isPercentage),
      minValue: details.minValue != null ? String(details.minValue) : "",
      maxValue: details.maxValue != null ? String(details.maxValue) : "",
      sequence: details.sequence != null ? String(details.sequence) : "",
      chargeSlabs: (details.chargeSlabs ?? []).map((item) => ({ minValue: String(item.minValue), maxValue: String(item.maxValue), rate: String(item.rate) })),
    });
  }, [editingIndex, editingRowResponse?.data, rateCharges]);

  function resetDraft() {
    setDraft({
      id: undefined,
      chargeId: "",
      name: "",
      calculationBase: "",
      value: "",
      isPercentage: false,
      minValue: "",
      maxValue: "",
      sequence: "",
      chargeSlabs: [{ minValue: "", maxValue: "", rate: "" }],
    });
    setEditingIndex(null);
  }

  function onChargeMasterChange(chargeIdStr: string) {
    if (!chargeIdStr || chargeIdStr === "__none__") {
      setDraft((c) => ({ ...c, chargeId: "" }));
      return;
    }
    const ch = chargesForSelect.find((x) => x.id === Number(chargeIdStr));
    setDraft((c) => ({
      ...c,
      chargeId: chargeIdStr,
      name: ch?.name ?? c.name,
      calculationBase: ch?.calculationBase ?? c.calculationBase,
      sequence: ch != null && ch.sequence != null ? String(ch.sequence) : c.sequence,
    }));
  }

  function saveDraft() {
    const value = Number(draft.value);
    const chargeSlabs = draft.chargeSlabs
      .map((item) => ({ minValue: Number(item.minValue), maxValue: Number(item.maxValue), rate: Number(item.rate) }))
      .filter((item) => Number.isFinite(item.minValue) && Number.isFinite(item.maxValue) && Number.isFinite(item.rate));
    if (!Number.isFinite(value)) return;
    const chargeId = draft.chargeId && draft.chargeId !== "__none__" ? Number(draft.chargeId) : undefined;
    if (!chargeId && (!draft.name.trim() || !draft.calculationBase.trim())) {
      toast.error("Select a charge from master or enter name and calculation base");
      return;
    }
    const next: RateChargePayload = {
      value,
      isPercentage: draft.isPercentage,
    };
    if (chargeId) next.chargeId = chargeId;
    if (draft.name.trim()) next.name = draft.name.trim();
    if (draft.calculationBase.trim()) next.calculationBase = draft.calculationBase.trim();
    if (draft.minValue.trim() && Number.isFinite(Number(draft.minValue))) next.minValue = Number(draft.minValue);
    if (draft.maxValue.trim() && Number.isFinite(Number(draft.maxValue))) next.maxValue = Number(draft.maxValue);
    if (draft.sequence.trim() && Number.isFinite(Number(draft.sequence))) next.sequence = Number(draft.sequence);
    if (chargeSlabs.length > 0) next.chargeSlabs = chargeSlabs;
    const editingRowId = rateCharges[editingIndex ?? -1]?.id ?? draft.id;
    if (isEdit && rateMasterId && editingRowId) {
      updateMutation.mutate({ rowId: editingRowId, payload: next });
      return;
    }
    if (isEdit && rateMasterId) {
      createMutation.mutate(next);
      return;
    }
    setRateCharges((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push({ ...next } as RateChargeRow);
      else copy[editingIndex] = { ...(next as RateChargeRow) };
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    const row = rateCharges[index];
    if (isEdit && rateMasterId && row?.id) {
      deleteMutation.mutate({ rowId: row.id, index });
      return;
    }
    setRateCharges((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      resetDraft();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex((current) => (current === null ? current : current - 1));
    }
  }

  function updateChargeSlab(index: number, field: keyof ChargeSlabDraft, value: string) {
    setDraft((current) => ({
      ...current,
      chargeSlabs: current.chargeSlabs.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addChargeSlabRow() {
    setDraft((current) => ({
      ...current,
      chargeSlabs: [...current.chargeSlabs, { minValue: "", maxValue: "", rate: "" }],
    }));
  }

  function removeChargeSlabRow(index: number) {
    setDraft((current) => ({
      ...current,
      chargeSlabs: current.chargeSlabs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Select value={draft.chargeId || "__none__"} onValueChange={onChargeMasterChange}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="Charge master" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— None (manual name) —</SelectItem>
            {chargesForSelect.map((ch) => (
              <SelectItem key={ch.id} value={String(ch.id)}>
                {ch.code ? `${ch.code} — ${ch.name}` : ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Name (fallback label)" className={FLOATING_INNER_CONTROL} value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
        <Select value={draft.calculationBase || "__pick__"} onValueChange={(v) => setDraft((c) => ({ ...c, calculationBase: v === "__pick__" ? "" : v }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="Calculation base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__pick__">— Pick base —</SelectItem>
            {CALCULATION_BASE_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" step="0.01" placeholder="Value" className={FLOATING_INNER_CONTROL} value={draft.value} onChange={(e) => setDraft((current) => ({ ...current, value: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Input type="number" placeholder="Sequence (optional)" className={FLOATING_INNER_CONTROL} value={draft.sequence} onChange={(e) => setDraft((current) => ({ ...current, sequence: e.target.value }))} />
        <Input type="number" step="0.01" placeholder="Min value (optional)" className={FLOATING_INNER_CONTROL} value={draft.minValue} onChange={(e) => setDraft((current) => ({ ...current, minValue: e.target.value }))} />
        <Input type="number" step="0.01" placeholder="Max value (optional)" className={FLOATING_INNER_CONTROL} value={draft.maxValue} onChange={(e) => setDraft((current) => ({ ...current, maxValue: e.target.value }))} />
        <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
          <Checkbox checked={draft.isPercentage} onCheckedChange={(checked) => setDraft((current) => ({ ...current, isPercentage: Boolean(checked) }))} />
          <span className="text-sm font-medium text-foreground">Is percentage</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={addChargeSlabRow}>
          <Plus className="h-4 w-4" />
          Add charge slab
        </Button>
        <Button type="button" variant="success" onClick={saveDraft} disabled={createMutation.isPending || updateMutation.isPending}>
          {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editingIndex === null ? "Add" : "Update"}
        </Button>
      </div>

      <div className="rounded-md border border-border bg-background p-3">
        <p className="mb-3 text-sm font-semibold text-foreground">Charge slabs</p>
        <div className="space-y-3">
          {draft.chargeSlabs.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input type="number" step="0.01" placeholder="Min value" className={FLOATING_INNER_CONTROL} value={item.minValue} onChange={(e) => updateChargeSlab(index, "minValue", e.target.value)} />
              <Input type="number" step="0.01" placeholder="Max value" className={FLOATING_INNER_CONTROL} value={item.maxValue} onChange={(e) => updateChargeSlab(index, "maxValue", e.target.value)} />
              <Input type="number" step="0.01" placeholder="Rate" className={FLOATING_INNER_CONTROL} value={item.rate} onChange={(e) => updateChargeSlab(index, "rate", e.target.value)} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeChargeSlabRow(index)} disabled={draft.chargeSlabs.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">Charge</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Name</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Calculation base</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Value</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Sequence</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateCharges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No rate charges added yet.
                </TableCell>
              </TableRow>
            ) : (
              rateCharges.map((row, index) => (
                <TableRow key={`${row.chargeId ?? row.name}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>{row.chargeId != null ? `#${row.chargeId}` : "—"}</TableCell>
                  <TableCell>{row.charge?.name || row.name || "—"}</TableCell>
                  <TableCell>{row.calculationBase || "—"}</TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell>{row.sequence ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)]" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeRow(index)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RateConditionsEditor({
  rateConditions,
  setRateConditions,
  rateMasterId,
  isEdit,
}: {
  rateConditions: RateConditionRow[];
  setRateConditions: Dispatch<SetStateAction<RateConditionRow[]>>;
  rateMasterId?: number;
  isEdit: boolean;
}) {
  const { data: conditionChargeList } = useQuery({
    queryKey: ["rate-form-charge-master"],
    queryFn: () => chargeService.getCharges({ page: 1, limit: 200, sortBy: "code", sortOrder: "asc" }),
  });
  const chargesForCondition = conditionChargeList?.data ?? [];

  const [draft, setDraft] = useState<RateConditionDraft>({
    id: undefined,
    chargeId: "",
    field: "",
    operator: "",
    value: "",
    chargeName: "",
    chargeAmount: "",
    calculationBase: "",
    isPercentage: false,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingRowId = editingIndex === null ? undefined : rateConditions[editingIndex]?.id;
  const { data: editingRowResponse } = useQuery({
    queryKey: ["rate-condition", rateMasterId, editingRowId],
    queryFn: () => rateService.getRateConditionById(rateMasterId!, editingRowId!),
    enabled: isEdit && Boolean(rateMasterId) && Boolean(editingRowId),
  });
  const createMutation = useMutation({
    mutationFn: async (payload: RateConditionPayload) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.createRateCondition(rateMasterId, payload);
    },
    onSuccess: (response) => {
      setRateConditions((current) => [...current, response.data]);
      toast.success("Rate condition added");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add rate condition");
    },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ rowId, payload }: { rowId: number; payload: RateConditionPayload }) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.updateRateCondition(rateMasterId, rowId, payload);
    },
    onSuccess: (response, variables) => {
      setRateConditions((current) => current.map((row) => (row.id === variables.rowId ? response.data : row)));
      toast.success("Rate condition updated");
      resetDraft();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update rate condition");
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async ({ rowId }: { rowId: number; index: number }) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.deleteRateCondition(rateMasterId, rowId);
    },
    onSuccess: (_, variables) => {
      const { rowId, index } = variables;
      setRateConditions((current) => current.filter((row) => row.id !== rowId));
      toast.success("Rate condition deleted");
      if (editingIndex === index) {
        resetDraft();
      } else if (editingIndex !== null && index < editingIndex) {
        setEditingIndex((current) => (current === null ? current : current - 1));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete rate condition");
    },
  });

  useEffect(() => {
    if (editingIndex === null) return;
    const row = rateConditions[editingIndex];
    if (!row) return;
    const details = editingRowResponse?.data ?? row;
    setDraft({
      id: details.id,
      chargeId: details.chargeId != null ? String(details.chargeId) : "",
      field: details.field,
      operator: details.operator,
      value: String(details.value),
      chargeName: details.chargeName ?? "",
      chargeAmount: String(details.chargeAmount),
      calculationBase: details.calculationBase ?? "",
      isPercentage: Boolean(details.isPercentage),
    });
  }, [editingIndex, editingRowResponse?.data, rateConditions]);

  function resetDraft() {
    setDraft({
      id: undefined,
      chargeId: "",
      field: "",
      operator: "",
      value: "",
      chargeName: "",
      chargeAmount: "",
      calculationBase: "",
      isPercentage: false,
    });
    setEditingIndex(null);
  }

  function onConditionChargeChange(chargeIdStr: string) {
    if (!chargeIdStr || chargeIdStr === "__none__") {
      setDraft((c) => ({ ...c, chargeId: "" }));
      return;
    }
    const ch = chargesForCondition.find((x) => x.id === Number(chargeIdStr));
    setDraft((c) => ({
      ...c,
      chargeId: chargeIdStr,
      chargeName: ch?.name ?? c.chargeName,
      calculationBase: ch?.calculationBase ?? c.calculationBase,
    }));
  }

  function saveDraft() {
    const value = Number(draft.value);
    const chargeAmount = Number(draft.chargeAmount);
    if (!draft.field.trim() || !draft.operator.trim() || !Number.isFinite(value) || !Number.isFinite(chargeAmount)) return;
    const chargeId = draft.chargeId && draft.chargeId !== "__none__" ? Number(draft.chargeId) : undefined;
    if (!chargeId && !draft.chargeName.trim()) {
      toast.error("Link a charge master row or enter a charge name for this condition");
      return;
    }
    const next: RateConditionPayload = {
      field: draft.field.trim(),
      operator: draft.operator.trim(),
      value,
      chargeAmount,
      isPercentage: draft.isPercentage,
    };
    if (chargeId) next.chargeId = chargeId;
    if (draft.chargeName.trim()) next.chargeName = draft.chargeName.trim();
    if (draft.calculationBase.trim()) next.calculationBase = draft.calculationBase.trim();
    const editingRowId = rateConditions[editingIndex ?? -1]?.id ?? draft.id;
    if (isEdit && rateMasterId && editingRowId) {
      updateMutation.mutate({ rowId: editingRowId, payload: next });
      return;
    }
    if (isEdit && rateMasterId) {
      createMutation.mutate(next);
      return;
    }
    setRateConditions((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push({ ...next } as RateConditionRow);
      else copy[editingIndex] = { ...(next as RateConditionRow) };
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    const row = rateConditions[index];
    if (isEdit && rateMasterId && row?.id) {
      deleteMutation.mutate({ rowId: row.id, index });
      return;
    }
    setRateConditions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      resetDraft();
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex((current) => (current === null ? current : current - 1));
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Select value={draft.field || "__field__"} onValueChange={(v) => setDraft((c) => ({ ...c, field: v === "__field__" ? "" : v }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="Condition field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__field__">— Field —</SelectItem>
            {CONDITION_FIELD_OPTIONS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={draft.operator || "__op__"} onValueChange={(v) => setDraft((c) => ({ ...c, operator: v === "__op__" ? "" : v }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__op__">— Operator —</SelectItem>
            {CONDITION_OPERATOR_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" step="0.01" placeholder="Compare value" className={FLOATING_INNER_CONTROL} value={draft.value} onChange={(e) => setDraft((current) => ({ ...current, value: e.target.value }))} />
        <Select value={draft.chargeId || "__none__"} onValueChange={onConditionChargeChange}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="Linked charge (master)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— None —</SelectItem>
            {chargesForCondition.map((ch) => (
              <SelectItem key={ch.id} value={String(ch.id)}>
                {ch.code ? `${ch.code} — ${ch.name}` : ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Charge name (fallback)" className={FLOATING_INNER_CONTROL} value={draft.chargeName} onChange={(e) => setDraft((current) => ({ ...current, chargeName: e.target.value }))} />
        <Input type="number" step="0.01" placeholder="Charge amount" className={FLOATING_INNER_CONTROL} value={draft.chargeAmount} onChange={(e) => setDraft((current) => ({ ...current, chargeAmount: e.target.value }))} />
        <Select value={draft.calculationBase || "__cb__"} onValueChange={(v) => setDraft((c) => ({ ...c, calculationBase: v === "__cb__" ? "" : v }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="Calculation base (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__cb__">— Calculation base —</SelectItem>
            {CALCULATION_BASE_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
          <Checkbox checked={draft.isPercentage} onCheckedChange={(checked) => setDraft((current) => ({ ...current, isPercentage: Boolean(checked) }))} />
          <span className="text-sm font-medium text-foreground">Is percentage</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="success" onClick={saveDraft} disabled={createMutation.isPending || updateMutation.isPending}>
          {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editingIndex === null ? "Add" : "Update"}
        </Button>
        <Button type="button" variant="outline" onClick={resetDraft}>
          Clear
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-primary hover:bg-primary">
              <TableHead className="font-semibold text-primary-foreground">Field</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Operator</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Value</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Charge</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Charge name</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Amount</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateConditions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No rate conditions added yet.
                </TableCell>
              </TableRow>
            ) : (
              rateConditions.map((row, index) => (
                <TableRow key={`${row.field}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>{row.field}</TableCell>
                  <TableCell>{row.operator}</TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell>{row.chargeId != null ? `#${row.chargeId}` : "—"}</TableCell>
                  <TableCell>{row.chargeName || row.charge?.name || "—"}</TableCell>
                  <TableCell>{row.chargeAmount}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)]" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-danger)]" onClick={() => removeRow(index)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
