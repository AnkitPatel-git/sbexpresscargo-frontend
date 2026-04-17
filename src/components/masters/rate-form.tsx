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
import { customerService } from "@/services/masters/customer-service";
import { productService } from "@/services/masters/product-service";
import { rateService } from "@/services/masters/rate-service";
import { vendorService } from "@/services/masters/vendor-service";
import { zoneService } from "@/services/masters/zone-service";
import type {
  CreateRateMasterPayload,
  RateChargePayload,
  RateConditionPayload,
  RateDistanceSlabPayload,
  RateMaster,
  RateZoneRatePayload,
  UpdateRateMasterPayload,
} from "@/types/masters/rate";

const rateMasterSchema = z.object({
  updateType: z.string().min(1, "Update type is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  customerId: z.string().min(1, "Customer is required"),
  serviceType: z.string().min(1, "Service type is required"),
  rateType: z.string().min(1, "Rate type is required"),
  productId: z.string().min(1, "Product is required"),
  vendorId: z.string().optional().or(z.literal("")),
  paymentType: z.string().min(1, "Payment type is required"),
  zeroContract: z.boolean(),
  flatRate: z.string().optional().or(z.literal("")),
});

type RateMasterFormValues = z.infer<typeof rateMasterSchema>;

type TabValue = "master" | "zone-rates" | "distance-slabs" | "rate-charges" | "rate-conditions";

const RATE_TABS: Array<{ value: TabValue; label: string }> = [
  { value: "master", label: "Master" },
  { value: "zone-rates", label: "Zone Rates" },
  { value: "distance-slabs", label: "Distance Slabs" },
  { value: "rate-charges", label: "Rate Charges" },
  { value: "rate-conditions", label: "Rate Conditions" },
];

type ZoneRateDraft = {
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
  field: string;
  operator: string;
  value: string;
  chargeName: string;
  chargeAmount: string;
  isPercentage: boolean;
};

interface RateFormProps {
  initialData?: RateMaster | null;
}

export function RateForm({ initialData }: RateFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!initialData;
  const [activeTab, setActiveTab] = useState<TabValue>("master");
  const [zoneRates, setZoneRates] = useState<RateZoneRatePayload[]>([]);
  const [distanceSlabs, setDistanceSlabs] = useState<RateDistanceSlabPayload[]>([]);
  const [rateCharges, setRateCharges] = useState<RateChargePayload[]>([]);
  const [rateConditions, setRateConditions] = useState<RateConditionPayload[]>([]);

  const form = useForm<RateMasterFormValues>({
    resolver: zodResolver(rateMasterSchema) as Resolver<RateMasterFormValues>,
    defaultValues: {
      updateType: "",
      fromDate: "",
      toDate: "",
      customerId: "",
      serviceType: "",
      rateType: "",
      productId: "",
      vendorId: "",
      paymentType: "",
      zeroContract: false,
      flatRate: "",
    },
  });

  useEffect(() => {
    if (!initialData) {
      form.reset({
        updateType: "",
        fromDate: "",
        toDate: "",
        customerId: "",
        serviceType: "",
        rateType: "",
        productId: "",
        vendorId: "",
        paymentType: "",
        zeroContract: false,
        flatRate: "",
      });
      setZoneRates([]);
      setDistanceSlabs([]);
      setRateCharges([]);
      setRateConditions([]);
      return;
    }

    form.reset({
      updateType: initialData.updateType || "",
      fromDate: initialData.fromDate ? initialData.fromDate.slice(0, 10) : "",
      toDate: initialData.toDate ? initialData.toDate.slice(0, 10) : "",
      customerId: initialData.customerId != null ? String(initialData.customerId) : "",
      serviceType: initialData.serviceType || "",
      rateType: initialData.rateType || "",
      productId: initialData.productId != null ? String(initialData.productId) : "",
      vendorId: initialData.vendorId != null ? String(initialData.vendorId) : "",
      paymentType: initialData.paymentType || "",
      zeroContract: initialData.zeroContract ?? false,
      flatRate: initialData.flatRate != null ? String(initialData.flatRate) : "",
    });
    setZoneRates((initialData.zoneRates ?? []).map(({ fromZoneId, toZoneId, rate }) => ({ fromZoneId, toZoneId, rate })));
    setDistanceSlabs((initialData.distanceSlabs ?? []).map((slab) => ({
      minKm: slab.minKm,
      maxKm: slab.maxKm,
      weightSlabs: (slab.weightSlabs ?? []).map(({ minWeight, maxWeight, rate }) => ({ minWeight, maxWeight, rate })),
    })));
    setRateCharges((initialData.rateCharges ?? []).map((charge) => ({
      name: charge.name,
      calculationBase: charge.calculationBase,
      value: charge.value,
      isPercentage: charge.isPercentage,
      minValue: charge.minValue,
      maxValue: charge.maxValue,
      sequence: charge.sequence,
      chargeSlabs: (charge.chargeSlabs ?? []).map(({ minValue, maxValue, rate }) => ({ minValue, maxValue, rate })),
    })));
    setRateConditions((initialData.rateConditions ?? []).map(({ field, operator, value, chargeName, chargeAmount, isPercentage }) => ({
      field,
      operator,
      value,
      chargeName,
      chargeAmount,
      isPercentage,
    })));
  }, [form, initialData]);

  const { data: customerResponse } = useQuery({
    queryKey: ["rate-form-customers"],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });
  const { data: productResponse } = useQuery({
    queryKey: ["rate-form-products"],
    queryFn: () => productService.getProducts({ page: 1, limit: 100, sortBy: "productName", sortOrder: "asc" }),
  });
  const { data: vendorResponse } = useQuery({
    queryKey: ["rate-form-vendors"],
    queryFn: () => vendorService.getVendors({ page: 1, limit: 100, sortBy: "vendorName", sortOrder: "asc" }),
  });
  const { data: zoneResponse } = useQuery({
    queryKey: ["rate-form-zones"],
    queryFn: () => zoneService.getZones({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }),
  });

  const customerOptions = useMemo(() => customerResponse?.data ?? [], [customerResponse]);
  const productOptions = useMemo(() => productResponse?.data ?? [], [productResponse]);
  const vendorOptions = useMemo(() => vendorResponse?.data ?? [], [vendorResponse]);
  const zoneOptions = useMemo(() => zoneResponse?.data ?? [], [zoneResponse]);

  const zoneLabelById = useMemo(() => new Map(zoneOptions.map((item) => [item.id, `${item.code || item.id}${item.name ? ` - ${item.name}` : ""}`])), [zoneOptions]);

  const mutation = useMutation({
    mutationFn: async (values: RateMasterFormValues) => {
      const payload = buildPayload(values, zoneRates, distanceSlabs, rateCharges, rateConditions);
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
              <TabsTrigger key={tab.value} value={tab.value} disabled={!isEdit && tab.value !== "master"} className="rounded-full px-5 py-2">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="master" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="updateType"
                render={({ field }) => (
                  <FloatingFormItem label="Update Type">
                    <FormControl>
                      <Input placeholder="AWB_ENTRY_RATE" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FloatingFormItem label="Service Type">
                    <FormControl>
                      <Input placeholder="EXPRESS" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rateType"
                render={({ field }) => (
                  <FloatingFormItem label="Rate Type">
                    <FormControl>
                      <Input placeholder="ZONE_MATRIX" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FloatingFormItem label="Payment Type">
                    <FormControl>
                      <Input placeholder="TO_PAY" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
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
                            {customer.code || customer.name || `Customer ${customer.id}`}
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
                            {product.productCode || product.productName || `Product ${product.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FloatingFormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FloatingFormItem label="Vendor">
                    <Select key={field.value || "blank"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                          <SelectValue placeholder="Optional vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {vendorOptions.map((vendor) => (
                          <SelectItem key={vendor.id} value={String(vendor.id)}>
                            {vendor.vendorCode || vendor.vendorName || `Vendor ${vendor.id}`}
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
                  <FloatingFormItem label="Flat Rate">
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Optional"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className={FLOATING_INNER_CONTROL}
                      />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 md:col-span-2">
                <FormField
                  control={form.control}
                  name="zeroContract"
                  render={({ field }) => (
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                    </FormControl>
                  )}
                />
                <span className="text-sm font-medium text-foreground">Zero contract</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="zone-rates" className="space-y-4">
            {!isEdit ? (
              <DisabledTab title="Zone Rates" />
            ) : (
              <ZoneRatesEditor
                zoneRates={zoneRates}
                setZoneRates={setZoneRates}
                zoneLabelById={zoneLabelById}
                zoneOptions={zoneOptions}
              />
            )}
          </TabsContent>

          <TabsContent value="distance-slabs" className="space-y-4">
            {!isEdit ? (
              <DisabledTab title="Distance Slabs" />
            ) : (
              <DistanceSlabsEditor distanceSlabs={distanceSlabs} setDistanceSlabs={setDistanceSlabs} />
            )}
          </TabsContent>

          <TabsContent value="rate-charges" className="space-y-4">
            {!isEdit ? (
              <DisabledTab title="Rate Charges" />
            ) : (
              <RateChargesEditor rateCharges={rateCharges} setRateCharges={setRateCharges} />
            )}
          </TabsContent>

          <TabsContent value="rate-conditions" className="space-y-4">
            {!isEdit ? (
              <DisabledTab title="Rate Conditions" />
            ) : (
              <RateConditionsEditor rateConditions={rateConditions} setRateConditions={setRateConditions} />
            )}
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

function buildPayload(
  values: RateMasterFormValues,
  zoneRates: RateZoneRatePayload[],
  distanceSlabs: RateDistanceSlabPayload[],
  rateCharges: RateChargePayload[],
  rateConditions: RateConditionPayload[],
): CreateRateMasterPayload {
  const payload: CreateRateMasterPayload = {
    updateType: values.updateType.trim(),
    fromDate: values.fromDate,
    toDate: values.toDate,
    customerId: Number(values.customerId),
    serviceType: values.serviceType.trim(),
    rateType: values.rateType.trim(),
    productId: Number(values.productId),
    paymentType: values.paymentType.trim(),
    zeroContract: values.zeroContract,
    zoneRates,
    distanceSlabs,
    rateCharges,
    rateConditions,
  };

  if (values.vendorId) {
    payload.vendorId = Number(values.vendorId);
  }

  if (values.flatRate !== undefined && values.flatRate !== "") {
    payload.flatRate = Number(values.flatRate);
  }

  return payload;
}

function DisabledTab({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-6 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">Save the rate master first, then this tab can be used for the related APIs.</p>
    </div>
  );
}

function ZoneRatesEditor({
  zoneRates,
  setZoneRates,
  zoneLabelById,
  zoneOptions,
}: {
  zoneRates: RateZoneRatePayload[];
  setZoneRates: Dispatch<SetStateAction<RateZoneRatePayload[]>>;
  zoneLabelById: Map<number, string>;
  zoneOptions: Array<{ id: number; code?: string; name?: string }>;
}) {
  const [draft, setDraft] = useState<ZoneRateDraft>({ fromZoneId: "", toZoneId: "", rate: "" });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingIndex === null) return;
    const row = zoneRates[editingIndex];
    if (!row) return;
    setDraft({ fromZoneId: String(row.fromZoneId), toZoneId: String(row.toZoneId), rate: String(row.rate) });
  }, [editingIndex, zoneRates]);

  function resetDraft() {
    setDraft({ fromZoneId: "", toZoneId: "", rate: "" });
    setEditingIndex(null);
  }

  function saveDraft() {
    const fromZoneId = Number(draft.fromZoneId);
    const toZoneId = Number(draft.toZoneId);
    const rate = Number(draft.rate);
    if (!Number.isFinite(fromZoneId) || !Number.isFinite(toZoneId) || !Number.isFinite(rate)) return;
    const next = { fromZoneId, toZoneId, rate };
    setZoneRates((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push(next);
      else copy[editingIndex] = next;
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    setZoneRates((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) resetDraft();
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Select key={draft.fromZoneId || "from"} value={draft.fromZoneId} onValueChange={(value) => setDraft((current) => ({ ...current, fromZoneId: value }))}>
          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
            <SelectValue placeholder="From zone" />
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
            <SelectValue placeholder="To zone" />
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
          <Button type="button" variant="success" onClick={saveDraft}>
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
              <TableHead className="font-semibold text-primary-foreground">From zone</TableHead>
              <TableHead className="font-semibold text-primary-foreground">To zone</TableHead>
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

function DistanceSlabsEditor({
  distanceSlabs,
  setDistanceSlabs,
}: {
  distanceSlabs: RateDistanceSlabPayload[];
  setDistanceSlabs: Dispatch<SetStateAction<RateDistanceSlabPayload[]>>;
}) {
  const [draft, setDraft] = useState<DistanceSlabDraft>({ minKm: "", maxKm: "", weightSlabs: [{ minWeight: "", maxWeight: "", rate: "" }] });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingIndex === null) return;
    const row = distanceSlabs[editingIndex];
    if (!row) return;
    setDraft({
      minKm: String(row.minKm),
      maxKm: String(row.maxKm),
      weightSlabs: (row.weightSlabs ?? []).map((item) => ({ minWeight: String(item.minWeight), maxWeight: String(item.maxWeight), rate: String(item.rate) })),
    });
  }, [editingIndex, distanceSlabs]);

  function resetDraft() {
    setDraft({ minKm: "", maxKm: "", weightSlabs: [{ minWeight: "", maxWeight: "", rate: "" }] });
    setEditingIndex(null);
  }

  function saveDraft() {
    const minKm = Number(draft.minKm);
    const maxKm = Number(draft.maxKm);
    const weightSlabs = draft.weightSlabs
      .map((item) => ({ minWeight: Number(item.minWeight), maxWeight: Number(item.maxWeight), rate: Number(item.rate) }))
      .filter((item) => Number.isFinite(item.minWeight) && Number.isFinite(item.maxWeight) && Number.isFinite(item.rate));
    if (!Number.isFinite(minKm) || !Number.isFinite(maxKm)) return;
    const next = { minKm, maxKm, weightSlabs };
    setDistanceSlabs((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push(next);
      else copy[editingIndex] = next;
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    setDistanceSlabs((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) resetDraft();
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
          <Button type="button" variant="success" onClick={saveDraft}>
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

function RateChargesEditor({
  rateCharges,
  setRateCharges,
}: {
  rateCharges: RateChargePayload[];
  setRateCharges: Dispatch<SetStateAction<RateChargePayload[]>>;
}) {
  const [draft, setDraft] = useState<RateChargeDraft>({
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

  useEffect(() => {
    if (editingIndex === null) return;
    const row = rateCharges[editingIndex];
    if (!row) return;
    setDraft({
      name: row.name,
      calculationBase: row.calculationBase,
      value: String(row.value),
      isPercentage: row.isPercentage,
      minValue: String(row.minValue ?? ""),
      maxValue: String(row.maxValue ?? ""),
      sequence: String(row.sequence),
      chargeSlabs: (row.chargeSlabs ?? []).map((item) => ({ minValue: String(item.minValue), maxValue: String(item.maxValue), rate: String(item.rate) })),
    });
  }, [editingIndex, rateCharges]);

  function resetDraft() {
    setDraft({
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

  function saveDraft() {
    const value = Number(draft.value);
    const minValue = Number(draft.minValue);
    const maxValue = Number(draft.maxValue);
    const sequence = Number(draft.sequence);
    const chargeSlabs = draft.chargeSlabs
      .map((item) => ({ minValue: Number(item.minValue), maxValue: Number(item.maxValue), rate: Number(item.rate) }))
      .filter((item) => Number.isFinite(item.minValue) && Number.isFinite(item.maxValue) && Number.isFinite(item.rate));
    if (!draft.name.trim() || !draft.calculationBase.trim() || !Number.isFinite(value) || !Number.isFinite(minValue) || !Number.isFinite(maxValue) || !Number.isFinite(sequence)) return;
    const next = {
      name: draft.name.trim(),
      calculationBase: draft.calculationBase.trim(),
      value,
      isPercentage: draft.isPercentage,
      minValue,
      maxValue,
      sequence,
      chargeSlabs,
    };
    setRateCharges((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push(next);
      else copy[editingIndex] = next;
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    setRateCharges((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) resetDraft();
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Input placeholder="Charge name" className={FLOATING_INNER_CONTROL} value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} />
        <Input placeholder="Calculation base" className={FLOATING_INNER_CONTROL} value={draft.calculationBase} onChange={(e) => setDraft((current) => ({ ...current, calculationBase: e.target.value }))} />
        <Input type="number" step="0.01" placeholder="Value" className={FLOATING_INNER_CONTROL} value={draft.value} onChange={(e) => setDraft((current) => ({ ...current, value: e.target.value }))} />
        <Input type="number" placeholder="Sequence" className={FLOATING_INNER_CONTROL} value={draft.sequence} onChange={(e) => setDraft((current) => ({ ...current, sequence: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Input type="number" step="0.01" placeholder="Min value" className={FLOATING_INNER_CONTROL} value={draft.minValue} onChange={(e) => setDraft((current) => ({ ...current, minValue: e.target.value }))} />
        <Input type="number" step="0.01" placeholder="Max value" className={FLOATING_INNER_CONTROL} value={draft.maxValue} onChange={(e) => setDraft((current) => ({ ...current, maxValue: e.target.value }))} />
        <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
          <Checkbox checked={draft.isPercentage} onCheckedChange={(checked) => setDraft((current) => ({ ...current, isPercentage: Boolean(checked) }))} />
          <span className="text-sm font-medium text-foreground">Is percentage</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={addChargeSlabRow}>
            <Plus className="h-4 w-4" />
            Add charge slab
          </Button>
          <Button type="button" variant="success" onClick={saveDraft}>
            {editingIndex === null ? <Plus className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editingIndex === null ? "Add" : "Update"}
          </Button>
        </div>
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No rate charges added yet.
                </TableCell>
              </TableRow>
            ) : (
              rateCharges.map((row, index) => (
                <TableRow key={`${row.name}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.calculationBase}</TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell>{row.sequence}</TableCell>
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

function RateConditionsEditor({
  rateConditions,
  setRateConditions,
}: {
  rateConditions: RateConditionPayload[];
  setRateConditions: Dispatch<SetStateAction<RateConditionPayload[]>>;
}) {
  const [draft, setDraft] = useState<RateConditionDraft>({
    field: "",
    operator: "",
    value: "",
    chargeName: "",
    chargeAmount: "",
    isPercentage: false,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editingIndex === null) return;
    const row = rateConditions[editingIndex];
    if (!row) return;
    setDraft({
      field: row.field,
      operator: row.operator,
      value: String(row.value),
      chargeName: row.chargeName,
      chargeAmount: String(row.chargeAmount),
      isPercentage: row.isPercentage,
    });
  }, [editingIndex, rateConditions]);

  function resetDraft() {
    setDraft({ field: "", operator: "", value: "", chargeName: "", chargeAmount: "", isPercentage: false });
    setEditingIndex(null);
  }

  function saveDraft() {
    const value = Number(draft.value);
    const chargeAmount = Number(draft.chargeAmount);
    if (!draft.field.trim() || !draft.operator.trim() || !draft.chargeName.trim() || !Number.isFinite(value) || !Number.isFinite(chargeAmount)) return;
    const next: RateConditionPayload = {
      field: draft.field.trim(),
      operator: draft.operator.trim(),
      value,
      chargeName: draft.chargeName.trim(),
      chargeAmount,
      isPercentage: draft.isPercentage,
    };
    setRateConditions((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push(next);
      else copy[editingIndex] = next;
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    setRateConditions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) resetDraft();
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Input placeholder="Field" className={FLOATING_INNER_CONTROL} value={draft.field} onChange={(e) => setDraft((current) => ({ ...current, field: e.target.value }))} />
        <Input placeholder="Operator" className={FLOATING_INNER_CONTROL} value={draft.operator} onChange={(e) => setDraft((current) => ({ ...current, operator: e.target.value }))} />
        <Input type="number" step="0.01" placeholder="Value" className={FLOATING_INNER_CONTROL} value={draft.value} onChange={(e) => setDraft((current) => ({ ...current, value: e.target.value }))} />
        <Input placeholder="Charge name" className={FLOATING_INNER_CONTROL} value={draft.chargeName} onChange={(e) => setDraft((current) => ({ ...current, chargeName: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Input type="number" step="0.01" placeholder="Charge amount" className={FLOATING_INNER_CONTROL} value={draft.chargeAmount} onChange={(e) => setDraft((current) => ({ ...current, chargeAmount: e.target.value }))} />
        <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
          <Checkbox checked={draft.isPercentage} onCheckedChange={(checked) => setDraft((current) => ({ ...current, isPercentage: Boolean(checked) }))} />
          <span className="text-sm font-medium text-foreground">Is percentage</span>
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <Button type="button" variant="success" onClick={saveDraft}>
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
              <TableHead className="font-semibold text-primary-foreground">Field</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Operator</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Value</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Charge name</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Charge amount</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateConditions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No rate conditions added yet.
                </TableCell>
              </TableRow>
            ) : (
              rateConditions.map((row, index) => (
                <TableRow key={`${row.field}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  <TableCell>{row.field}</TableCell>
                  <TableCell>{row.operator}</TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell>{row.chargeName}</TableCell>
                  <TableCell>{row.chargeAmount}</TableCell>
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
