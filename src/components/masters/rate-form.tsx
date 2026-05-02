"use client";

import { useEffect, useMemo, useState, type ComponentProps, type Dispatch, type SetStateAction } from "react";
import type { Charge } from "@/types/masters/charge";
import { FieldErrors, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useInfiniteEntityList, useSelectContentInfiniteScroll } from "@/hooks/use-infinite-entity-list";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { vendorService } from "@/services/masters/vendor-service";
import { zoneService } from "@/services/masters/zone-service";
import type {
  CreateRateMasterPayload,
  RateChargePayload,
  RateCharge,
  RateConditionPayload,
  RateCondition,
  RateMaster,
  RateRouteRateSlab,
  RateRouteSlabPayload,
  RateZoneRef,
  UpdateRateMasterPayload,
} from "@/types/masters/rate";
import type { Customer } from "@/types/masters/customer";
import type { Product } from "@/types/masters/product";
import type { Vendor } from "@/types/masters/vendor";
import type { Zone } from "@/types/masters/zone";
import {
  isVendorRateMasterRow,
  parseRateContractParam,
  rateMasterListPath,
} from "@/lib/rate-master-nav";

const DEFAULT_RATE_UPDATE_TYPE = "AWB_ENTRY_RATE";

function buildRateMasterSchema(isVendorContract: boolean) {
  return z
    .object({
      fromDate: z.string().min(1, "From date is required"),
      toDate: z.string().min(1, "To date is required"),
      customerId: z.string().optional(),
      vendorId: z.string().optional(),
      productId: z.string().min(1, "Product is required"),
      rateType: z.string().optional().or(z.literal("")),
      flatRate: z.string().optional().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
      if (isVendorContract) {
        if (!data.vendorId?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Vendor is required",
            path: ["vendorId"],
          });
        }
      } else if (!data.customerId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer is required",
          path: ["customerId"],
        });
      }
    });
}

type RateMasterFormValues = {
  fromDate: string;
  toDate: string;
  customerId?: string;
  vendorId?: string;
  productId: string;
  rateType?: string;
  flatRate?: string;
};

type TabValue = "master" | "route-slabs" | "oda-slabs" | "rate-conditions";

const RATE_TABS: Array<{ value: TabValue; label: string }> = [
  { value: "master", label: "Master" },
  { value: "route-slabs", label: "Base rate" },
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
  "TOTAL_DISTANCE",
  "SHIPMENT_VALUE",
  "REVERSE_PICKUP",
  "APPOINTMENT_DELIVERY",
  "FLOOR_DELIVERY",
  "FLOOR_COUNT",
] as const;

const CONDITION_OPERATOR_OPTIONS = ["GT", "GTE", "LT", "LTE", "EQ"] as const;
const CONDITION_OPERATOR_LABELS: Record<(typeof CONDITION_OPERATOR_OPTIONS)[number], string> = {
  GT: "Greater Than",
  GTE: "Greater Than or Equal To",
  LT: "Less Than",
  LTE: "Less Than or Equal To",
  EQ: "Equal To",
};

type WeightSlabDraft = {
  minWeight: string;
  maxWeight: string;
  rate: string;
  pricingMode?: "FLAT" | "PER_KG";
  applyFuel?: boolean;
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
  applyFuel: boolean;
  chargeSlabs: ChargeSlabDraft[];
};

type ConditionRuleType = "threshold" | "slab";

type ConditionSlabFormRow = {
  minValue: string;
  maxValue: string;
  rate: string;
  pricingMode: "FLAT" | "PER_KG";
};

type RateConditionDraft = {
  id?: number;
  ruleType: ConditionRuleType;
  chargeId: string;
  field: string;
  operator: string;
  value: string;
  chargeAmount: string;
  minValue: string;
  maxValue: string;
  calculationBase: string;
  applyPerPiece: boolean;
  isPercentage: boolean;
  applyFuel: boolean;
  slabs: ConditionSlabFormRow[];
};

type RouteSlabRow = Partial<RateRouteRateSlab> & Pick<RateRouteRateSlab, "weightSlabs">;
type RateChargeRow = Partial<RateCharge> &
  Pick<RateCharge, "value" | "isPercentage" | "chargeSlabs"> &
  Partial<Pick<RateCharge, "chargeId" | "name" | "calculationBase" | "minValue" | "maxValue" | "sequence">>;
type RateConditionRow = Partial<RateCondition> &
  Pick<RateCondition, "field" | "operator" | "value" | "chargeAmount" | "isPercentage"> &
  Partial<Pick<RateCondition, "chargeId" | "calculationBase">> & {
    /** `slab` rows are UI-only until save; they map to `rateCharges` with charge slabs. */
    ruleType?: ConditionRuleType;
    slabs?: ConditionSlabFormRow[];
    applyPerPiece?: boolean;
    /** Set when this row was loaded from an existing rate charge (edit). */
    rateChargeSourceId?: number;
  };

function mapRateChargesToSlabConditionRows(rows: RateCharge[] | undefined): RateConditionRow[] {
  if (!rows?.length) return [];
  return rows
    .filter((row) => (row.chargeSlabs?.length ?? 0) > 0)
    .map((row) => ({
      ruleType: "slab" as const,
      rateChargeSourceId: row.id,
      chargeId: row.chargeId,
      calculationBase: row.calculationBase ?? "",
      applyPerPiece: Boolean(row.applyPerPiece),
      // Keep values for compatibility with existing row renderer/edit flow.
      field: "",
      operator: "",
      value: 0,
      chargeAmount: 0,
      isPercentage: false,
      charge: row.charge,
      slabs: (row.chargeSlabs ?? []).map((slab) => ({
        minValue: String(slab.minValue),
        maxValue: String(slab.maxValue),
        rate: String(slab.rate),
        pricingMode: slab.pricingMode === "PER_KG" ? "PER_KG" : "FLAT",
      })),
    }));
}

/** Zones linked on slabs (and initial API refs) are merged so selects stay valid when paged. */
function collectExtraZoneRows(
  initialData: RateMaster | null | undefined,
  routeSlabs: RouteSlabRow[],
  odaSlabs: RouteSlabRow[],
): Zone[] {
  const m = new Map<number, Zone>();
  const add = (z: RateZoneRef | null | undefined) => {
    if (!z || m.has(z.id)) return;
    m.set(z.id, {
      id: z.id,
      name: z.name ?? "",
      code: z.code ?? "",
      countryId: null,
      zoneType: "DOMESTIC",
      createdAt: "",
      updatedAt: "",
      createdById: null,
      updatedById: null,
      deletedAt: null,
      deletedById: null,
    });
  };
  for (const s of initialData?.routeRateSlabs ?? []) {
    add(s.fromZone);
    add(s.toZone);
  }
  for (const s of initialData?.odaRateSlabs ?? []) {
    add(s.fromZone);
    add(s.toZone);
  }
  for (const s of routeSlabs) {
    add(s.fromZone);
    add(s.toZone);
  }
  for (const s of odaSlabs) {
    add(s.fromZone);
    add(s.toZone);
  }
  return Array.from(m.values());
}

interface RateFormProps {
  initialData?: RateMaster | null;
}

export function RateForm({ initialData }: RateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ratesListHref = rateMasterListPath(parseRateContractParam(searchParams.get("contract")));
  const queryClient = useQueryClient();
  const isEdit = !!initialData;
  const isVendorContract = isEdit
    ? isVendorRateMasterRow(initialData ?? {})
    : parseRateContractParam(searchParams.get("contract")) === "vendor";
  const rateSchema = useMemo(() => buildRateMasterSchema(isVendorContract), [isVendorContract]);
  const [activeTab, setActiveTab] = useState<TabValue>("master");
  const [routeSlabs, setRouteSlabs] = useState<RouteSlabRow[]>([]);
  const [odaSlabs, setOdaSlabs] = useState<RouteSlabRow[]>([]);
  const [rateConditions, setRateConditions] = useState<RateConditionRow[]>([]);
  const [rateCharges, setRateCharges] = useState<RateChargeRow[]>([]);

  const form = useForm<RateMasterFormValues>({
    resolver: zodResolver(rateSchema) as Resolver<RateMasterFormValues>,
    defaultValues: {
      fromDate: "",
      toDate: "",
      customerId: "",
      vendorId: "",
      productId: "",
      rateType: "",
      flatRate: "",
    },
  });

  useEffect(() => {
    if (!initialData) {
      form.reset({
        fromDate: "",
        toDate: "",
        customerId: "",
        vendorId: "",
        productId: "",
        rateType: "",
        flatRate: "",
      });
      setRouteSlabs([]);
      setOdaSlabs([]);
      setRateConditions([]);
      setRateCharges([]);
      return;
    }

    form.reset({
      fromDate: initialData.fromDate ? initialData.fromDate.slice(0, 10) : "",
      toDate: initialData.toDate ? initialData.toDate.slice(0, 10) : "",
      customerId:
        initialData.customerId != null && !isVendorRateMasterRow(initialData)
          ? String(initialData.customerId)
          : "",
      vendorId:
        initialData.vendorId != null && isVendorRateMasterRow(initialData)
          ? String(initialData.vendorId)
          : "",
      rateType: initialData.rateType || "",
      flatRate: initialData.flatRate != null && initialData.flatRate !== undefined ? String(initialData.flatRate) : "",
      productId: initialData.productId != null ? String(initialData.productId) : "",
    });
    setRouteSlabs(initialData.routeRateSlabs ?? []);
    setOdaSlabs(initialData.odaRateSlabs ?? []);
    const allCharges = initialData.rateCharges ?? [];
    const slabChargeIds = new Set(
      allCharges
        .filter((charge) => (charge.chargeSlabs?.length ?? 0) > 0 && charge.chargeId != null)
        .map((charge) => Number(charge.chargeId)),
    );
    setRateCharges(allCharges);
    const thresholdRows = (initialData.rateConditions ?? []).filter((condition) => {
        const chargeId = condition.chargeId != null ? Number(condition.chargeId) : NaN;
        if (!Number.isFinite(chargeId) || !slabChargeIds.has(chargeId)) {
          return true;
        }
        return !(
          Number(condition.chargeAmount ?? 0) === 0 &&
          (condition.isPercentage ?? false) === false
        );
      });
    const slabRows = mapRateChargesToSlabConditionRows(allCharges);
    setRateConditions([...thresholdRows, ...slabRows]);
  }, [form, initialData]);

  const extraVendorRows = useMemo((): Vendor[] | undefined => {
    const v = initialData?.vendor;
    if (!v) return undefined;
    return [
      {
        id: v.id,
        vendorCode: v.vendorCode ?? "",
        vendorName: v.vendorName ?? "",
        contactPerson: "",
        address1: null,
        address2: null,
        pinCodeId: null,
        countryId: null,
        stateId: null,
        zoneId: null,
        bankId: null,
        bankAccount: null,
        bankIfsc: null,
        telephone: null,
        email: "",
        mobile: "",
        website: null,
        gstNo: null,
        vendorZip: null,
        status: "ACTIVE",
        createdAt: "",
        updatedAt: "",
        createdById: null,
        updatedById: null,
        deletedAt: null,
        deletedById: null,
      } as Vendor,
    ];
  }, [initialData?.vendor]);

  const extraCustomerRows = useMemo((): Customer[] | undefined => {
    const c = initialData?.customer;
    if (!c) return undefined;
    return [
      {
        id: c.id,
        name: c.name ?? "",
        code: c.code ?? "—",
        version: 1,
        contactPerson: null,
        address1: null,
        address2: null,
        pinCodeId: null,
        countryId: null,
        stateId: null,
        bankId: null,
        bankAccount: null,
        bankIfsc: null,
        telephone: null,
        email: null,
        mobile: null,
        serviceCenterId: null,
        serviceStartDate: null,
        status: "ACTIVE",
        origin: null,
        gstNo: null,
        customerType: null,
        registerType: null,
        createdAt: "",
        updatedAt: "",
        createdById: null,
        updatedById: null,
        deletedAt: null,
        deletedById: null,
      } as Customer,
    ];
  }, [initialData?.customer]);

  const extraProductRows = useMemo((): Product[] | undefined => {
    const p = initialData?.product;
    if (!p) return undefined;
    return [
      {
        id: p.id,
        productName: p.productName ?? "",
        productCode: p.productCode ?? "",
        version: 1,
        productType: "DOMESTIC",
        status: "ACTIVE",
        createdAt: "",
        updatedAt: "",
        createdById: null,
        updatedById: null,
        deletedAt: null,
        deletedById: null,
      } as Product,
    ];
  }, [initialData?.product]);

  const extraZoneRows = useMemo(
    () => collectExtraZoneRows(initialData, routeSlabs, odaSlabs),
    [initialData, routeSlabs, odaSlabs],
  );

  const {
    rows: customerOptions,
    fetchNextPage: fetchNextCustomers,
    hasNextPage: hasNextCustomerPage,
    isFetchingNextPage: isFetchingNextCustomerPage,
  } = useInfiniteEntityList<Customer>({
    queryKey: ["rate-form-customers"],
    fetchPage: (page) => customerService.getCustomers({ page, limit: 10, sortBy: "name", sortOrder: "asc" }),
    extraRows: extraCustomerRows,
    enabled: !isVendorContract,
  });

  const {
    rows: vendorOptions,
    fetchNextPage: fetchNextVendors,
    hasNextPage: hasNextVendorPage,
    isFetchingNextPage: isFetchingNextVendorPage,
  } = useInfiniteEntityList<Vendor>({
    queryKey: ["rate-form-vendors"],
    fetchPage: (page) => vendorService.getVendors({ page, limit: 10, sortBy: "vendorName", sortOrder: "asc" }),
    extraRows: extraVendorRows,
    enabled: isVendorContract,
  });

  const {
    rows: productOptions,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasNextProductPage,
    isFetchingNextPage: isFetchingNextProductPage,
  } = useInfiniteEntityList<Product>({
    queryKey: ["rate-form-products"],
    fetchPage: (page) => productService.getProducts({ page, limit: 10, sortBy: "productName", sortOrder: "asc" }),
    extraRows: extraProductRows,
  });

  const {
    rows: zoneOptions,
    fetchNextPage: fetchNextZones,
    hasNextPage: hasNextZonePage,
    isFetchingNextPage: isFetchingNextZonePage,
  } = useInfiniteEntityList<Zone>({
    queryKey: ["rate-form-zones"],
    fetchPage: (page) => zoneService.getZones({ page, limit: 10, sortBy: "name", sortOrder: "asc" }),
    extraRows: extraZoneRows.length > 0 ? extraZoneRows : undefined,
  });

  const onCustomerSelectScroll = useSelectContentInfiniteScroll({
    hasNextPage: hasNextCustomerPage,
    isFetchingNextPage: isFetchingNextCustomerPage,
    fetchNextPage: fetchNextCustomers,
  });
  const onVendorSelectScroll = useSelectContentInfiniteScroll({
    hasNextPage: hasNextVendorPage,
    isFetchingNextPage: isFetchingNextVendorPage,
    fetchNextPage: fetchNextVendors,
  });
  const onProductSelectScroll = useSelectContentInfiniteScroll({
    hasNextPage: hasNextProductPage,
    isFetchingNextPage: isFetchingNextProductPage,
    fetchNextPage: fetchNextProducts,
  });
  const onZoneSelectScroll = useSelectContentInfiniteScroll({
    hasNextPage: hasNextZonePage,
    isFetchingNextPage: isFetchingNextZonePage,
    fetchNextPage: fetchNextZones,
  });

  const zoneLabelById = useMemo(() => new Map(zoneOptions.map((item) => [item.id, `${item.code || item.id}${item.name ? ` - ${item.name}` : ""}`])), [zoneOptions]);

  const mutation = useMutation({
    mutationFn: async (values: RateMasterFormValues) => {
      const updateType =
        isEdit && initialData?.updateType
          ? initialData.updateType
          : isVendorContract
            ? "VENDOR_RATE"
            : DEFAULT_RATE_UPDATE_TYPE;
      const payload = buildPayload(
        updateType,
        values,
        routeSlabs,
        odaSlabs,
        rateConditions,
        rateCharges,
        isVendorContract,
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
      if (!isEdit) {
        router.push(ratesListHref);
      }
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
                  <FloatingFormItem required label="From Date">
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
                  <FloatingFormItem required label="To Date">
                    <FormControl>
                      <Input type="date" {...field} className={FLOATING_INNER_CONTROL} />
                    </FormControl>
                  </FloatingFormItem>
                )}
              />
              {isVendorContract ? (
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FloatingFormItem required label="Vendor">
                      <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72" onScroll={onVendorSelectScroll}>
                          {vendorOptions.map((vendor) => (
                            <SelectItem key={vendor.id} value={String(vendor.id)}>
                              {vendor.vendorName || vendor.vendorCode || `Vendor ${vendor.id}`}
                            </SelectItem>
                          ))}
                          {isFetchingNextVendorPage ? (
                            <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </FloatingFormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FloatingFormItem required label="Customer">
                      <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-72" onScroll={onCustomerSelectScroll}>
                          {customerOptions.map((customer) => (
                            <SelectItem key={customer.id} value={String(customer.id)}>
                              {customer.name || customer.code || `Customer ${customer.id}`}
                            </SelectItem>
                          ))}
                          {isFetchingNextCustomerPage ? (
                            <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </FloatingFormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FloatingFormItem required label="Product">
                    <Select key={field.value} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className="max-h-72"
                        onScroll={onProductSelectScroll}
                      >
                        {productOptions.map((product) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.productName || product.productCode || `Product ${product.id}`}
                          </SelectItem>
                        ))}
                        {isFetchingNextProductPage ? (
                          <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
                        ) : null}
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
            </div>
          </TabsContent>

          <TabsContent value="route-slabs" className="space-y-4">
            <RouteSlabsEditor
              title="Base rate"
              description="Match by From Zone and To Zone; each slab needs at least one weight slab (Flat or Per kg)."
              showKmBands={false}
              slabs={routeSlabs}
              setSlabs={setRouteSlabs}
              zoneLabelById={zoneLabelById}
              zoneOptions={zoneOptions}
              zoneSelectContentProps={{ className: "max-h-72", onScroll: onZoneSelectScroll }}
              isLoadingMoreZones={isFetchingNextZonePage}
            />
          </TabsContent>

          <TabsContent value="oda-slabs" className="space-y-4">
            <RouteSlabsEditor
              title="ODA / EDL slabs"
              description="Each row is a km band (min and max km required) with weight slabs. Zones are not used."
              showZones={false}
              showKmBands
              requireKmBands
              slabs={odaSlabs}
              setSlabs={setOdaSlabs}
              zoneLabelById={zoneLabelById}
              zoneOptions={zoneOptions}
              zoneSelectContentProps={{ className: "max-h-72", onScroll: onZoneSelectScroll }}
              isLoadingMoreZones={isFetchingNextZonePage}
            />
          </TabsContent>

          <TabsContent value="rate-conditions" className="space-y-4">
            <RateConditionsEditor
              rateConditions={rateConditions}
              setRateConditions={setRateConditions}
              rateMasterId={initialData?.id}
              isEdit={isEdit}
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
            <Button type="button" variant="expressDanger" onClick={() => router.push(ratesListHref)}>
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

function mapRouteSlabsForApi(rows: RouteSlabRow[], mode: "route" | "oda" = "route"): RateRouteSlabPayload[] {
  return rows.map((row) => {
    const { id: _id, rateMasterId: _rm, createdAt: _c, updatedAt: _u, deletedAt: _d, fromZone: _fz, toZone: _tz, weightSlabs, ...rest } = row;
    const ws = (weightSlabs || []).map((w) => ({
      minWeight: Number(w.minWeight),
      maxWeight: Number(w.maxWeight),
      rate: Number(w.rate),
      pricingMode: (w as { pricingMode?: string }).pricingMode === "PER_KG" ? ("PER_KG" as const) : ("FLAT" as const),
      applyFuel: (w as { applyFuel?: boolean }).applyFuel !== false,
    }));
    const slab: RateRouteSlabPayload = { weightSlabs: ws };
    if (mode === "route") {
      if (rest.fromZoneId != null && rest.fromZoneId !== undefined) slab.fromZoneId = Number(rest.fromZoneId);
      if (rest.toZoneId != null && rest.toZoneId !== undefined) slab.toZoneId = Number(rest.toZoneId);
    }
    if (rest.minKm != null && rest.minKm !== undefined && Number.isFinite(Number(rest.minKm))) slab.minKm = Number(rest.minKm);
    if (rest.maxKm != null && rest.maxKm !== undefined && Number.isFinite(Number(rest.maxKm))) slab.maxKm = Number(rest.maxKm);
    return slab;
  });
}

function mapRateChargesForApi(rows: RateChargeRow[]): RateChargePayload[] {
  return rows
    .map((row) => {
      const chargeId = row.chargeId != null && Number.isFinite(Number(row.chargeId)) ? Number(row.chargeId) : undefined;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const calculationBase = typeof row.calculationBase === "string" ? row.calculationBase.trim() : "";
      if (!chargeId && (!name || !calculationBase)) return null;
      const value = Number(row.value);
      if (!Number.isFinite(value)) return null;
      const chargeSlabs = (row.chargeSlabs ?? [])
        .map((s) => {
          const minValue = Number((s as { minValue?: number | string }).minValue);
          const maxValue = Number((s as { maxValue?: number | string }).maxValue);
          const rate = Number((s as { rate?: number | string }).rate);
          const pricingMode = (s as { pricingMode?: string }).pricingMode === "PER_KG" ? ("PER_KG" as const) : ("FLAT" as const);
          return { minValue, maxValue, rate, pricingMode };
        })
        .filter((s) => Number.isFinite(s.minValue) && Number.isFinite(s.maxValue) && Number.isFinite(s.rate));
      const next: RateChargePayload = {
        value,
        isPercentage: Boolean(row.isPercentage),
      };
      if (chargeId) next.chargeId = chargeId;
      if (name) next.name = name;
      if (calculationBase) next.calculationBase = calculationBase;
      if (row.minValue != null && Number.isFinite(Number(row.minValue))) next.minValue = Number(row.minValue);
      if (row.maxValue != null && Number.isFinite(Number(row.maxValue))) next.maxValue = Number(row.maxValue);
      if (row.sequence != null && Number.isFinite(Number(row.sequence))) next.sequence = Number(row.sequence);
      if (chargeSlabs.length > 0) next.chargeSlabs = chargeSlabs;
      next.applyFuel = (row as { applyFuel?: boolean }).applyFuel !== false;
      return next;
    })
    .filter((row): row is RateChargePayload => row != null);
}

function mapSlabConditionRulesToRateChargePayloads(rows: RateConditionRow[]): RateChargePayload[] {
  return rows
    .filter((row) => row.ruleType === "slab")
    .map((row) => {
      const chargeId = row.chargeId != null && Number.isFinite(Number(row.chargeId)) ? Number(row.chargeId) : NaN;
      if (!Number.isFinite(chargeId) || chargeId < 1) return null;
      const slabs = (row.slabs ?? [])
        .map((s) => ({
          minValue: Number(s.minValue),
          maxValue: Number(s.maxValue),
          rate: Number(s.rate),
          pricingMode: s.pricingMode === "PER_KG" ? ("PER_KG" as const) : ("FLAT" as const),
        }))
        .filter((s) => Number.isFinite(s.minValue) && Number.isFinite(s.maxValue) && Number.isFinite(s.rate));
      if (slabs.length === 0) return null;
      const calculationBase = row.calculationBase?.trim() ?? "";
      if (!calculationBase) return null;
      const payload: RateChargePayload = {
        chargeId,
        calculationBase,
        applyPerPiece: Boolean(row.applyPerPiece),
        value: 0,
        isPercentage: false,
        applyFuel: (row as { applyFuel?: boolean }).applyFuel !== false,
        chargeSlabs: slabs,
      };
      return payload;
    })
    .filter((row): row is RateChargePayload => row != null);
}

function dedupeRateChargePayloads(rows: RateChargePayload[]): RateChargePayload[] {
  const byKey = new Map<string, RateChargePayload>();
  for (const row of rows) {
    const key =
      row.chargeId != null && Number.isFinite(Number(row.chargeId))
        ? `charge:${Number(row.chargeId)}`
        : `name:${(row.name ?? "").trim().toUpperCase()}`;
    byKey.set(key, row);
  }
  return Array.from(byKey.values());
}

function getConditionOperatorLabel(operator?: string | null): string {
  if (!operator) return "—";
  return CONDITION_OPERATOR_LABELS[operator as keyof typeof CONDITION_OPERATOR_LABELS] ?? operator;
}

function normalizeMasterSelectId(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildPayload(
  updateType: string,
  values: RateMasterFormValues,
  routeSlabs: RouteSlabRow[],
  odaSlabs: RouteSlabRow[],
  rateConditions: RateConditionRow[],
  rateCharges: RateChargeRow[],
  isVendorContract: boolean,
): CreateRateMasterPayload {
  const flatRaw = values.flatRate?.trim();
  const flatRate =
    flatRaw !== undefined && flatRaw !== "" && Number.isFinite(Number(flatRaw)) ? Number(flatRaw) : undefined;

  const resolvedUpdateType = isVendorContract ? "VENDOR_RATE" : updateType;

  const payload: CreateRateMasterPayload = {
    updateType: resolvedUpdateType,
    fromDate: values.fromDate,
    toDate: values.toDate,
    productId: Number(values.productId),
    zoneRates: [],
    distanceSlabs: [],
    rateSlabs: mapRouteSlabsForApi(routeSlabs, "route"),
    odaRateSlabs: mapRouteSlabsForApi(odaSlabs, "oda"),
    rateConditions: rateConditions
      .filter((row) => row.ruleType !== "slab")
      .filter((row) => row.chargeId != null && Number.isFinite(Number(row.chargeId)))
      .map(({ id, rateMasterId, createdAt, updatedAt, deletedAt, charge, chargeName, ruleType, slabs, rateChargeSourceId, ...row }) => {
        const next: RateConditionPayload = {
          field: row.field!,
          operator: row.operator!,
          value: Number(row.value),
          chargeAmount: Number(row.chargeAmount),
          chargeId: Number(row.chargeId),
        };
        if (row.calculationBase?.trim()) next.calculationBase = row.calculationBase.trim();
        if (row.isPercentage != null) next.isPercentage = row.isPercentage;
        if (row.minValue != null && Number.isFinite(Number(row.minValue))) {
          next.minValue = Number(row.minValue);
        }
        if (row.maxValue != null && Number.isFinite(Number(row.maxValue))) {
          next.maxValue = Number(row.maxValue);
        }
        next.applyFuel = (row as { applyFuel?: boolean }).applyFuel !== false;
        return next;
      }),
    rateCharges: dedupeRateChargePayloads([
      ...mapRateChargesForApi(rateCharges),
      ...mapSlabConditionRulesToRateChargePayloads(rateConditions),
    ]),
  };

  const rt = values.rateType?.trim();
  if (rt) payload.rateType = rt;
  if (flatRate !== undefined) payload.flatRate = flatRate;

  if (isVendorContract) {
    payload.vendorId = Number(values.vendorId);
  } else {
    payload.customerId = Number(values.customerId);
  }

  return payload;
}

function RouteSlabsEditor({
  title,
  description,
  showZones = true,
  showKmBands = true,
  requireKmBands = false,
  slabs,
  setSlabs,
  zoneLabelById,
  zoneOptions,
  zoneSelectContentProps,
  isLoadingMoreZones = false,
}: {
  title: string;
  description: string;
  /** When false (ODA/EDL), from/to zone inputs are hidden and zones are not saved on the row. */
  showZones?: boolean;
  /** When false (base rate), min/max km inputs are hidden and km is not saved on the row. */
  showKmBands?: boolean;
  /** When true (ODA/EDL), min and max km are required and max must be greater than min. */
  requireKmBands?: boolean;
  slabs: RouteSlabRow[];
  setSlabs: Dispatch<SetStateAction<RouteSlabRow[]>>;
  zoneLabelById: Map<number, string>;
  zoneOptions: Array<{ id: number; code?: string; name?: string }>;
  zoneSelectContentProps?: Pick<ComponentProps<typeof SelectContent>, "onScroll" | "className">;
  isLoadingMoreZones?: boolean;
}) {
  const [draft, setDraft] = useState<RouteSlabDraft>({
    fromZoneId: "",
    toZoneId: "",
    minKm: "",
    maxKm: "",
    weightSlabs: [{ minWeight: "", maxWeight: "", rate: "", pricingMode: "FLAT", applyFuel: true }],
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
              pricingMode: (item as { pricingMode?: string }).pricingMode === "PER_KG" ? "PER_KG" : "FLAT",
              applyFuel: (item as { applyFuel?: boolean }).applyFuel !== false,
            }))
          : [{ minWeight: "", maxWeight: "", rate: "", pricingMode: "FLAT", applyFuel: true }],
    });
  }, [editingIndex, slabs]);

  function resetDraft() {
    setDraft({
      id: undefined,
      fromZoneId: "",
      toZoneId: "",
      minKm: "",
      maxKm: "",
      weightSlabs: [{ minWeight: "", maxWeight: "", rate: "", pricingMode: "FLAT", applyFuel: true }],
    });
    setEditingIndex(null);
  }

  function saveDraft() {
    const weightSlabs = draft.weightSlabs
      .map((item) => ({
        minWeight: Number(item.minWeight),
        maxWeight: Number(item.maxWeight),
        rate: Number(item.rate),
        pricingMode: item.pricingMode === "PER_KG" ? ("PER_KG" as const) : ("FLAT" as const),
        applyFuel: item.applyFuel !== false,
      }))
      .filter((item) => Number.isFinite(item.minWeight) && Number.isFinite(item.maxWeight) && Number.isFinite(item.rate));
    if (weightSlabs.length === 0) return;

    const fromZoneId =
      showZones && draft.fromZoneId && draft.fromZoneId !== "__none__" ? Number(draft.fromZoneId) : undefined;
    const toZoneId =
      showZones && draft.toZoneId && draft.toZoneId !== "__none__" ? Number(draft.toZoneId) : undefined;
    const minKmParsed = showKmBands && draft.minKm.trim() ? Number(draft.minKm) : undefined;
    const maxKmParsed = showKmBands && draft.maxKm.trim() ? Number(draft.maxKm) : undefined;

    if (requireKmBands) {
      if (
        minKmParsed === undefined ||
        maxKmParsed === undefined ||
        !Number.isFinite(minKmParsed) ||
        !Number.isFinite(maxKmParsed) ||
        maxKmParsed <= minKmParsed
      ) {
        toast.error("ODA / EDL: enter min km and max km (max must be greater than min).");
        return;
      }
    }

    const next: RouteSlabRow = {
      weightSlabs,
      ...(draft.id != null ? { id: draft.id } : {}),
      ...(showZones && fromZoneId !== undefined && Number.isFinite(fromZoneId) ? { fromZoneId } : {}),
      ...(showZones && toZoneId !== undefined && Number.isFinite(toZoneId) ? { toZoneId } : {}),
      ...(showKmBands && minKmParsed !== undefined && Number.isFinite(minKmParsed) ? { minKm: minKmParsed } : {}),
      ...(showKmBands && maxKmParsed !== undefined && Number.isFinite(maxKmParsed) ? { maxKm: maxKmParsed } : {}),
    };
    if (!showKmBands) {
      next.minKm = undefined;
      next.maxKm = undefined;
    }
    if (!showZones) {
      next.fromZoneId = undefined;
      next.toZoneId = undefined;
    }

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

  function updateWeightSlab(index: number, field: keyof WeightSlabDraft, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      weightSlabs: current.weightSlabs.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "pricingMode"
                  ? (value as "FLAT" | "PER_KG")
                  : field === "applyFuel"
                    ? Boolean(value)
                    : String(value),
            }
          : item,
      ),
    }));
  }

  function addWeightRow() {
    setDraft((current) => ({
      ...current,
      weightSlabs: [...current.weightSlabs, { minWeight: "", maxWeight: "", rate: "", pricingMode: "FLAT", applyFuel: true }],
    }));
  }

  function removeWeightRow(index: number) {
    setDraft((current) => ({
      ...current,
      weightSlabs: current.weightSlabs.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const kmInputsValid =
    !requireKmBands ||
    (draft.minKm.trim() !== "" &&
      draft.maxKm.trim() !== "" &&
      Number.isFinite(Number(draft.minKm)) &&
      Number.isFinite(Number(draft.maxKm)) &&
      Number(draft.maxKm) > Number(draft.minKm));

  const canSave =
    kmInputsValid &&
    draft.weightSlabs.some(
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

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          showZones && showKmBands && "md:grid-cols-2 lg:grid-cols-4",
          showZones && !showKmBands && "md:grid-cols-2",
          !showZones && showKmBands && "md:grid-cols-2",
        )}
      >
        {showZones ? (
          <>
            <Select
              value={draft.fromZoneId || "__none__"}
              onValueChange={(value) => setDraft((current) => ({ ...current, fromZoneId: value === "__none__" ? "" : value }))}
            >
              <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                <SelectValue placeholder="From Zone" />
              </SelectTrigger>
              <SelectContent
                className={cn("max-h-60", zoneSelectContentProps?.className)}
                onScroll={zoneSelectContentProps?.onScroll}
              >
                <SelectItem value="__none__">— From Zone —</SelectItem>
                {zoneOptions.map((zone) => (
                  <SelectItem key={zone.id} value={String(zone.id)}>
                    {zone.code || zone.name || `Zone ${zone.id}`}
                  </SelectItem>
                ))}
                {isLoadingMoreZones ? (
                  <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
                ) : null}
              </SelectContent>
            </Select>
            <Select
              value={draft.toZoneId || "__none__"}
              onValueChange={(value) => setDraft((current) => ({ ...current, toZoneId: value === "__none__" ? "" : value }))}
            >
              <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                <SelectValue placeholder="To Zone" />
              </SelectTrigger>
              <SelectContent
                className={cn("max-h-60", zoneSelectContentProps?.className)}
                onScroll={zoneSelectContentProps?.onScroll}
              >
                <SelectItem value="__none__">— To Zone —</SelectItem>
                {zoneOptions.map((zone) => (
                  <SelectItem key={zone.id} value={String(zone.id)}>
                    {zone.code || zone.name || `Zone ${zone.id}`}
                  </SelectItem>
                ))}
                {isLoadingMoreZones ? (
                  <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
                ) : null}
              </SelectContent>
            </Select>
          </>
        ) : null}
        {showKmBands ? (
          <>
            <Input
              type="number"
              placeholder={requireKmBands ? "Min km (required)" : "Min km (optional)"}
              className={FLOATING_INNER_CONTROL}
              value={draft.minKm}
              onChange={(e) => setDraft((current) => ({ ...current, minKm: e.target.value }))}
            />
            <Input
              type="number"
              placeholder={requireKmBands ? "Max km (required)" : "Max km (optional)"}
              className={FLOATING_INNER_CONTROL}
              value={draft.maxKm}
              onChange={(e) => setDraft((current) => ({ ...current, maxKm: e.target.value }))}
            />
          </>
        ) : null}
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
            <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
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
              <Select
                value={item.pricingMode ?? "FLAT"}
                onValueChange={(value) => updateWeightSlab(index, "pricingMode", value)}
              >
                <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                  <SelectValue placeholder="Pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAT">Flat</SelectItem>
                  <SelectItem value="PER_KG">Per kg</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder={item.pricingMode === "PER_KG" ? "Rate per kg" : "Total rate"}
                className={FLOATING_INNER_CONTROL}
                value={item.rate}
                onChange={(e) => updateWeightSlab(index, "rate", e.target.value)}
              />
              <div className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2">
                <Checkbox
                  checked={item.applyFuel !== false}
                  onCheckedChange={(checked) => updateWeightSlab(index, "applyFuel", Boolean(checked))}
                />
                <span className="text-sm text-foreground">Fuel basis</span>
              </div>
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
              {showZones ? (
                <>
                  <TableHead className="font-semibold text-primary-foreground">From Zone</TableHead>
                  <TableHead className="font-semibold text-primary-foreground">To Zone</TableHead>
                </>
              ) : null}
              {showKmBands ? (
                <TableHead className="font-semibold text-primary-foreground">Km</TableHead>
              ) : null}
              <TableHead className="font-semibold text-primary-foreground">Weight slabs</TableHead>
              <TableHead className="text-center font-semibold text-primary-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slabs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={(showZones ? 2 : 0) + (showKmBands ? 1 : 0) + 2}
                  className="h-24 text-center text-muted-foreground"
                >
                  No slabs yet. Add at least one weight slab per row.
                </TableCell>
              </TableRow>
            ) : (
              slabs.map((row, index) => (
                <TableRow key={`${row.id ?? "new"}-${index}`} className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}>
                  {showZones ? (
                    <>
                      <TableCell>
                        {row.fromZoneId != null ? zoneLabelById.get(row.fromZoneId) || row.fromZoneId : "—"}
                      </TableCell>
                      <TableCell>{row.toZoneId != null ? zoneLabelById.get(row.toZoneId) || row.toZoneId : "—"}</TableCell>
                    </>
                  ) : null}
                  {showKmBands ? (
                    <TableCell>
                      {row.minKm != null || row.maxKm != null ? `${row.minKm ?? "—"} – ${row.maxKm ?? "—"}` : "—"}
                    </TableCell>
                  ) : null}
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
    applyFuel: true,
    chargeSlabs: [{ minValue: "", maxValue: "", rate: "" }],
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingRowId = editingIndex === null ? undefined : rateCharges[editingIndex]?.id;
  const { data: editingRowResponse } = useQuery({
    queryKey: ["rate-charge", rateMasterId, editingRowId],
    queryFn: () => rateService.getRateChargeById(rateMasterId!, editingRowId!),
    enabled: isEdit && Boolean(rateMasterId) && Boolean(editingRowId),
  });

  const extraChargeRowsForRateCharges = useMemo((): Charge[] | undefined => {
    const m = new Map<number, Charge>();
    const put = (ch: { id: number; code?: string; name?: string; calculationBase?: string } | null | undefined) => {
      if (!ch) {
        return;
      }
      if (m.has(ch.id)) {
        return;
      }
      m.set(ch.id, {
        id: ch.id,
        code: ch.code ?? "",
        name: ch.name ?? "",
        calculationBase: (ch as { calculationBase?: string }).calculationBase ?? "FLAT",
        sequence: 0,
        stateApplicationMode: "ALL",
        pincodeApplicationMode: "ALL",
      });
    };
    for (const row of rateCharges) {
      put(row.charge);
    }
    put(editingRowResponse?.data?.charge);
    return m.size > 0 ? Array.from(m.values()) : undefined;
  }, [rateCharges, editingRowResponse?.data?.charge]);

  const {
    rows: chargesForSelectRaw,
    fetchNextPage: fetchNextRateChargeMaster,
    hasNextPage: hasNextRateChargeMasterPage,
    isFetchingNextPage: isFetchingNextRateChargeMasterPage,
  } = useInfiniteEntityList<Charge>({
    queryKey: ["rate-form-charge-master", "sequence"],
    fetchPage: (page) => chargeService.getCharges({ page, limit: 10, sortBy: "sequence", sortOrder: "asc" }),
    extraRows: extraChargeRowsForRateCharges,
  });

  const chargesForSelect = useMemo(
    () => [...chargesForSelectRaw].sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name, undefined, { sensitivity: "base" })),
    [chargesForSelectRaw],
  );

  const onRateChargeSelectScroll = useSelectContentInfiniteScroll({
    hasNextPage: hasNextRateChargeMasterPage,
    isFetchingNextPage: isFetchingNextRateChargeMasterPage,
    fetchNextPage: fetchNextRateChargeMaster,
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
      applyFuel: (details as { applyFuel?: boolean }).applyFuel !== false,
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
      applyFuel: true,
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
      applyFuel: draft.applyFuel,
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
      if (editingIndex === null) {
        const duplicateIndex = copy.findIndex(
          (row) =>
            chargeId != null &&
            normalizeMasterSelectId(row.chargeId) === chargeId,
        );
        if (duplicateIndex >= 0) copy[duplicateIndex] = { ...copy[duplicateIndex], ...(next as RateChargeRow) };
        else copy.push({ ...next } as RateChargeRow);
      } else copy[editingIndex] = { ...(next as RateChargeRow) };
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
          <SelectContent className="max-h-72" onScroll={onRateChargeSelectScroll}>
            <SelectItem value="__none__">— None (manual name) —</SelectItem>
            {chargesForSelect.map((ch) => (
              <SelectItem key={ch.id} value={String(ch.id)}>
                {ch.code ? `${ch.code} — ${ch.name}` : ch.name}
              </SelectItem>
            ))}
            {isFetchingNextRateChargeMasterPage ? (
              <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
            ) : null}
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
        <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
          <Checkbox checked={draft.applyFuel} onCheckedChange={(checked) => setDraft((current) => ({ ...current, applyFuel: Boolean(checked) }))} />
          <span className="text-sm font-medium text-foreground">Counts toward fuel basis</span>
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
  const [draft, setDraft] = useState<RateConditionDraft>({
    id: undefined,
    ruleType: "threshold",
    chargeId: "",
    field: "",
    operator: "",
    value: "",
    chargeAmount: "",
    minValue: "",
    maxValue: "",
    calculationBase: "",
    applyPerPiece: false,
    isPercentage: false,
    applyFuel: true,
    slabs: [{ minValue: "", maxValue: "", rate: "", pricingMode: "FLAT" }],
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingRowSnapshot = editingIndex !== null ? rateConditions[editingIndex] : undefined;
  const editingRowId =
    editingIndex === null || editingRowSnapshot?.ruleType === "slab"
      ? undefined
      : (editingRowSnapshot?.id as number | undefined);
  const { data: editingRowResponse } = useQuery({
    queryKey: ["rate-condition", rateMasterId, editingRowId],
    queryFn: () => rateService.getRateConditionById(rateMasterId!, editingRowId!),
    enabled: isEdit && Boolean(rateMasterId) && Boolean(editingRowId),
  });

  const extraChargeRowsForConditions = useMemo((): Charge[] | undefined => {
    const m = new Map<number, Charge>();
    const put = (ch: { id: number; code?: string; name?: string; calculationBase?: string } | null | undefined) => {
      if (!ch) {
        return;
      }
      if (m.has(ch.id)) {
        return;
      }
      m.set(ch.id, {
        id: ch.id,
        code: ch.code ?? "",
        name: ch.name ?? "",
        calculationBase: (ch as { calculationBase?: string }).calculationBase ?? "FLAT",
        sequence: 0,
        stateApplicationMode: "ALL",
        pincodeApplicationMode: "ALL",
      });
    };
    for (const row of rateConditions) {
      put(row.charge);
    }
    put(editingRowResponse?.data?.charge);
    return m.size > 0 ? Array.from(m.values()) : undefined;
  }, [rateConditions, editingRowResponse?.data?.charge]);

  const {
    rows: conditionChargeOptions,
    fetchNextPage: fetchNextConditionCharges,
    hasNextPage: hasNextConditionChargePage,
    isFetchingNextPage: isFetchingNextConditionChargePage,
  } = useInfiniteEntityList<Charge>({
    queryKey: ["rate-form-charge-master", "sequence"],
    fetchPage: (page) => chargeService.getCharges({ page, limit: 10, sortBy: "sequence", sortOrder: "asc" }),
    extraRows: extraChargeRowsForConditions,
  });

  const onConditionChargeSelectScroll = useSelectContentInfiniteScroll({
    hasNextPage: hasNextConditionChargePage,
    isFetchingNextPage: isFetchingNextConditionChargePage,
    fetchNextPage: fetchNextConditionCharges,
  });

  const conditionChargeOptionsSorted = useMemo(
    () => [...conditionChargeOptions].sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name, undefined, { sensitivity: "base" })),
    [conditionChargeOptions],
  );

  const createMutation = useMutation({
    mutationFn: async (payload: RateConditionPayload) => {
      if (!rateMasterId) throw new Error("Rate master id is required");
      return rateService.createRateCondition(rateMasterId, payload);
    },
    onSuccess: (response) => {
      setRateConditions((current) => [...current, { ...response.data, ruleType: "threshold" } as RateConditionRow]);
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
      setRateConditions((current) =>
        current.map((row) => (row.id === variables.rowId ? ({ ...response.data, ruleType: "threshold" } as RateConditionRow) : row)),
      );
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
    const ruleType: ConditionRuleType = row.ruleType === "slab" ? "slab" : "threshold";
    const slabsFromRow =
      row.ruleType === "slab" && (row.slabs?.length ?? 0) > 0
        ? (row.slabs ?? []).map((s) => ({
            minValue: String(s.minValue),
            maxValue: String(s.maxValue),
            rate: String(s.rate),
            pricingMode: s.pricingMode === "PER_KG" ? ("PER_KG" as const) : ("FLAT" as const),
          }))
        : [{ minValue: "", maxValue: "", rate: "", pricingMode: "FLAT" as const }];
    setDraft({
      id: details.id,
      ruleType,
      chargeId: details.chargeId != null ? String(details.chargeId) : "",
      field: details.field ?? "",
      operator: details.operator ?? "",
      value: String(details.value ?? ""),
      chargeAmount: String(details.chargeAmount ?? ""),
      minValue:
        details.minValue != null ? String(details.minValue) : "",
      maxValue:
        details.maxValue != null ? String(details.maxValue) : "",
      calculationBase: details.calculationBase ?? "",
      applyPerPiece: Boolean((row as { applyPerPiece?: boolean }).applyPerPiece),
      isPercentage: Boolean(details.isPercentage),
      applyFuel: (details as { applyFuel?: boolean }).applyFuel !== false,
      slabs: slabsFromRow,
    });
  }, [editingIndex, editingRowResponse?.data, rateConditions]);

  function resetDraft() {
    setDraft({
      id: undefined,
      ruleType: "threshold",
      chargeId: "",
      field: "",
      operator: "",
      value: "",
      chargeAmount: "",
      minValue: "",
      maxValue: "",
      calculationBase: "",
      applyPerPiece: false,
      isPercentage: false,
      applyFuel: true,
      slabs: [{ minValue: "", maxValue: "", rate: "", pricingMode: "FLAT" }],
    });
    setEditingIndex(null);
  }

  function onConditionChargeChange(chargeIdStr: string) {
    if (!chargeIdStr || chargeIdStr === "__none__") {
      setDraft((c) => ({ ...c, chargeId: "", calculationBase: "" }));
      return;
    }
    const ch = conditionChargeOptionsSorted.find((x) => x.id === Number(chargeIdStr));
    setDraft((c) => ({
      ...c,
      chargeId: chargeIdStr,
      calculationBase: typeof ch?.calculationBase === "string" ? ch.calculationBase : c.calculationBase,
    }));
  }

  function saveDraft() {
    const chargeId = draft.chargeId && draft.chargeId !== "__none__" ? Number(draft.chargeId) : NaN;
    if (!Number.isFinite(chargeId) || chargeId < 1) {
      toast.error("Select a charge from charge master");
      return;
    }

    if (draft.ruleType === "slab") {
      const parsedSlabs = draft.slabs
        .map((s) => ({
          minValue: Number(s.minValue),
          maxValue: Number(s.maxValue),
          rate: Number(s.rate),
          pricingMode: s.pricingMode === "PER_KG" ? ("PER_KG" as const) : ("FLAT" as const),
        }))
        .filter((s) => Number.isFinite(s.minValue) && Number.isFinite(s.maxValue) && Number.isFinite(s.rate));
      if (parsedSlabs.length === 0) {
        toast.error("Add at least one charge slab (min, max, rate)");
        return;
      }
      if (!draft.calculationBase.trim()) {
        toast.error("Select calculation base");
        return;
      }
      const ch = conditionChargeOptionsSorted.find((x) => x.id === chargeId);
      const calcBase = draft.calculationBase.trim();
      const nextRow: RateConditionRow = {
        ruleType: "slab",
        chargeId,
        field: draft.field.trim(),
        operator: draft.operator.trim(),
        value: draft.value.trim() === "" ? 0 : Number(draft.value),
        chargeAmount: 0,
        calculationBase: calcBase,
        applyPerPiece: draft.applyPerPiece,
        isPercentage: false,
        applyFuel: draft.applyFuel,
        slabs: parsedSlabs.map((s) => ({
          minValue: String(s.minValue),
          maxValue: String(s.maxValue),
          rate: String(s.rate),
          pricingMode: s.pricingMode,
        })),
        charge: ch ? { id: ch.id, code: ch.code, name: ch.name, calculationBase: ch.calculationBase } : undefined,
      };
      setRateConditions((current) => {
        const copy = [...current];
        if (editingIndex === null) {
          const duplicateIndex = copy.findIndex(
            (row) =>
              row.ruleType === "slab" &&
              normalizeMasterSelectId(row.chargeId) === chargeId,
          );
          if (duplicateIndex >= 0) copy[duplicateIndex] = { ...copy[duplicateIndex], ...nextRow, rateChargeSourceId: copy[duplicateIndex]?.rateChargeSourceId };
          else copy.push(nextRow);
        }
        else copy[editingIndex] = { ...copy[editingIndex], ...nextRow, rateChargeSourceId: copy[editingIndex]?.rateChargeSourceId };
        return copy;
      });
      toast.success(editingIndex === null ? "Charge slab rule added (saved with rate master)" : "Charge slab rule updated");
      resetDraft();
      return;
    }

    const chargeAmount = Number(draft.chargeAmount);
    const hasExplicitCondition =
      draft.field.trim().length > 0 &&
      draft.operator.trim().length > 0 &&
      draft.value.trim().length > 0 &&
      Number.isFinite(Number(draft.value));
    const hasAnyConditionInput =
      draft.field.trim().length > 0 ||
      draft.operator.trim().length > 0 ||
      draft.value.trim().length > 0;
    if (!Number.isFinite(chargeAmount)) return;
    if (hasAnyConditionInput && !hasExplicitCondition) {
      toast.error("Select field, operator, and compare value for a standard rule");
      return;
    }
    const next: RateConditionPayload = {
      chargeId,
      field: hasExplicitCondition ? draft.field.trim() : "CHARGEABLE_WEIGHT",
      operator: hasExplicitCondition ? draft.operator.trim() : "GTE",
      value: hasExplicitCondition ? Number(draft.value) : 0,
      chargeAmount,
      isPercentage: draft.isPercentage,
      applyFuel: draft.applyFuel,
    };
    if (draft.minValue.trim() && Number.isFinite(Number(draft.minValue))) {
      next.minValue = Number(draft.minValue);
    }
    if (draft.maxValue.trim() && Number.isFinite(Number(draft.maxValue))) {
      next.maxValue = Number(draft.maxValue);
    }
    if (draft.calculationBase.trim()) next.calculationBase = draft.calculationBase.trim();
    const thresholdRowId = rateConditions[editingIndex ?? -1]?.id ?? draft.id;
    if (isEdit && rateMasterId && thresholdRowId) {
      updateMutation.mutate({ rowId: thresholdRowId, payload: next });
      return;
    }
    if (isEdit && rateMasterId) {
      createMutation.mutate(next);
      return;
    }
    setRateConditions((current) => {
      const copy = [...current];
      if (editingIndex === null) copy.push({ ...next, ruleType: "threshold" } as RateConditionRow);
      else copy[editingIndex] = { ...(next as RateConditionRow), ruleType: "threshold" };
      return copy;
    });
    resetDraft();
  }

  function removeRow(index: number) {
    const row = rateConditions[index];
    if (isEdit && rateMasterId && row?.id && row.ruleType !== "slab") {
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

  const conditionFieldSelectValues = useMemo(() => {
    const base: string[] = [...CONDITION_FIELD_OPTIONS];
    if (draft.field && !base.includes(draft.field)) {
      base.push(draft.field);
    }
    return base;
  }, [draft.field]);

  function toggleExtraDetails(enabled: boolean) {
    setDraft((c) => ({
      ...c,
      ruleType: enabled ? "slab" : "threshold",
      slabs: enabled
        ? c.slabs.length > 0
          ? c.slabs
          : [{ minValue: "", maxValue: "", rate: "", pricingMode: "FLAT" }]
        : [{ minValue: "", maxValue: "", rate: "", pricingMode: "FLAT" }],
    }));
  }

  function addConditionSlabRow() {
    setDraft((c) => ({
      ...c,
      slabs: [...c.slabs, { minValue: "", maxValue: "", rate: "", pricingMode: "FLAT" }],
    }));
  }

  function updateConditionSlabRow(index: number, patch: Partial<ConditionSlabFormRow>) {
    setDraft((c) => ({
      ...c,
      slabs: c.slabs.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function removeConditionSlabRow(index: number) {
    setDraft((c) => ({
      ...c,
      slabs: c.slabs.length <= 1 ? c.slabs : c.slabs.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Rate conditions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Standard rules compare a field to a value. Use <span className="font-medium text-foreground">Extra details (charge slabs)</span> for ECC-style
          bands (e.g. chargeable weight slabs with flat or per-kg rates). Slab rules are stored as rate charges when you save the rate master.
        </p>
      </div>

      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select value={draft.field || "__field__"} onValueChange={(v) => setDraft((c) => ({ ...c, field: v === "__field__" ? "" : v }))}>
            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
              <SelectValue placeholder="Condition field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__field__">— Field —</SelectItem>
              {conditionFieldSelectValues.map((f) => (
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
                  {CONDITION_OPERATOR_LABELS[o]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" step="0.01" placeholder="Compare value" className={FLOATING_INNER_CONTROL} value={draft.value} onChange={(e) => setDraft((current) => ({ ...current, value: e.target.value }))} />
          <Select value={draft.chargeId || "__none__"} onValueChange={onConditionChargeChange}>
            <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
              <SelectValue placeholder="Linked charge (master)" />
            </SelectTrigger>
            <SelectContent className="max-h-72" onScroll={onConditionChargeSelectScroll}>
              <SelectItem value="__none__">— Select charge —</SelectItem>
              {conditionChargeOptionsSorted.map((ch) => (
                <SelectItem key={ch.id} value={String(ch.id)}>
                  {ch.code ? `${ch.code} — ${ch.name}` : ch.name}
                </SelectItem>
              ))}
              {isFetchingNextConditionChargePage ? (
                <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">Loading more…</div>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input type="number" step="0.01" placeholder="Charge amount" className={FLOATING_INNER_CONTROL} value={draft.chargeAmount} onChange={(e) => setDraft((current) => ({ ...current, chargeAmount: e.target.value }))} />
          <Input
            type="number"
            step="0.01"
            placeholder="Minimum charge (optional)"
            className={FLOATING_INNER_CONTROL}
            value={draft.minValue}
            onChange={(e) => setDraft((current) => ({ ...current, minValue: e.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Maximum charge (optional)"
            className={FLOATING_INNER_CONTROL}
            value={draft.maxValue}
            onChange={(e) => setDraft((current) => ({ ...current, maxValue: e.target.value }))}
          />
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
          <div className="flex items-center gap-3 rounded-xl border border-border/70 px-4 py-3">
            <Checkbox checked={draft.applyFuel} onCheckedChange={(checked) => setDraft((current) => ({ ...current, applyFuel: Boolean(checked) }))} />
            <span className="text-sm font-medium text-foreground">Fuel basis</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-3">
            <Checkbox
              id="rule-slab-extra"
              checked={draft.ruleType === "slab"}
              onCheckedChange={(checked) => toggleExtraDetails(Boolean(checked))}
            />
            <Label htmlFor="rule-slab-extra" className="cursor-pointer text-sm font-medium">
              Extra details (charge slabs)
            </Label>
          </div>
        </div>
      </>

      {draft.ruleType === "slab" ? (
        <>
          <div className="rounded-md border border-border bg-background p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">Charge slabs</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-1.5">
                  <Checkbox checked={draft.applyPerPiece} onCheckedChange={(checked) => setDraft((c) => ({ ...c, applyPerPiece: Boolean(checked) }))} />
                  <span className="text-xs font-medium text-foreground">Apply per piece</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addConditionSlabRow}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add slab
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {draft.slabs.map((slab, slabIndex) => (
                <div key={slabIndex} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Min (e.g. 0)"
                    className={FLOATING_INNER_CONTROL}
                    value={slab.minValue}
                    onChange={(e) => updateConditionSlabRow(slabIndex, { minValue: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Max (e.g. 50)"
                    className={FLOATING_INNER_CONTROL}
                    value={slab.maxValue}
                    onChange={(e) => updateConditionSlabRow(slabIndex, { maxValue: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    className={FLOATING_INNER_CONTROL}
                    value={slab.rate}
                    onChange={(e) => updateConditionSlabRow(slabIndex, { rate: e.target.value })}
                  />
                  <Select
                    value={slab.pricingMode}
                    onValueChange={(v) => updateConditionSlabRow(slabIndex, { pricingMode: v === "PER_KG" ? "PER_KG" : "FLAT" })}
                  >
                    <SelectTrigger className={FLOATING_INNER_SELECT_TRIGGER}>
                      <SelectValue placeholder="Pricing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat (fixed amount for band)</SelectItem>
                      <SelectItem value="PER_KG">Per unit (rate × basis: weight or km)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--express-danger)]"
                      onClick={() => removeConditionSlabRow(slabIndex)}
                      disabled={draft.slabs.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

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
              <TableHead className="font-semibold text-primary-foreground">Type</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Field</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Operator</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Value</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Charge (master)</TableHead>
              <TableHead className="font-semibold text-primary-foreground">Amount / slabs</TableHead>
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
                <TableRow
                  key={`${row.ruleType ?? "threshold"}-${row.field}-${row.rateChargeSourceId ?? row.id ?? index}`}
                  className={cn("border-border", index % 2 === 1 ? "bg-muted/40" : "bg-card")}
                >
                  <TableCell className="text-sm">
                    {row.ruleType === "slab" ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Charge slabs</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Standard</span>
                    )}
                  </TableCell>
                  <TableCell>{row.field}</TableCell>
                  <TableCell>{row.ruleType === "slab" ? "—" : getConditionOperatorLabel(row.operator)}</TableCell>
                  <TableCell>{row.ruleType === "slab" ? "—" : row.value}</TableCell>
                  <TableCell>
                    {row.charge != null
                      ? row.charge.code
                        ? `${row.charge.code} — ${row.charge.name}`
                        : row.charge.name
                      : row.chargeId != null
                        ? `#${row.chargeId}`
                        : row.chargeName || "—"}
                  </TableCell>
                  <TableCell className="max-w-[220px] text-xs leading-snug text-muted-foreground">
                    {row.ruleType === "slab" && row.slabs?.length
                      ? row.slabs.map((s, i) => (
                          <span key={i} className="mr-1 inline-block">
                            {s.minValue}–{s.maxValue}: {s.rate} ({s.pricingMode === "PER_KG" ? "× basis" : "flat"})
                            {i < (row.slabs?.length ?? 0) - 1 ? " · " : ""}
                          </span>
                        ))
                      : row.chargeAmount}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[var(--express-link)]" onClick={() => setEditingIndex(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--express-danger)]"
                        onClick={() => removeRow(index)}
                        disabled={deleteMutation.isPending && row.ruleType !== "slab"}
                      >
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
