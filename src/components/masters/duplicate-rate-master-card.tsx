"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { customerService } from "@/services/masters/customer-service";
import { productService } from "@/services/masters/product-service";
import { rateService } from "@/services/masters/rate-service";
import { vendorService } from "@/services/masters/vendor-service";
import type { RateMaster } from "@/types/masters/rate";
import {
  isVendorRateMasterRow,
  parseRateContractParam,
  rateMasterListPath,
} from "@/lib/rate-master-nav";

type DuplicateTargetMode = "single" | "customer_group";

function resolveCustomerGroupId(
  customer?: { customerGroupId?: number | null; customerGroup?: { id?: number } | null } | null,
): number | null {
  if (!customer) return null;
  const id = customer.customerGroupId ?? customer.customerGroup?.id ?? null;
  return id != null && id > 0 ? id : null;
}

function rateTemplateLabel(rm: RateMaster) {
  const party = isVendorRateMasterRow(rm)
    ? rm.vendor?.vendorName || rm.vendor?.vendorCode || `Vendor #${rm.vendorId ?? "?"}`
    : rm.customer?.name || rm.customer?.code || `Customer #${rm.customerId ?? "?"}`;
  const prod = rm.product?.productName || rm.product?.productCode || `Product #${rm.productId ?? "?"}`;
  const from = rm.fromDate?.slice(0, 10) ?? "";
  const to = rm.toDate?.slice(0, 10) ?? "";
  return `#${rm.id} — ${party} / ${prod} (${from} → ${to})`;
}

export function DuplicateRateMasterCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contract = parseRateContractParam(searchParams.get("contract"));
  const contractQs = contract === "vendor" ? "vendor" : "customer";
  const isVendorContract = contract === "vendor";
  const [targetMode, setTargetMode] = useState<DuplicateTargetMode>("single");
  const [includeSourceCustomer, setIncludeSourceCustomer] = useState(false);
  const [fromDate, setFromDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(() => format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [customerId, setCustomerId] = useState(0);
  const [vendorId, setVendorId] = useState(0);
  const [productId, setProductId] = useState(0);
  const [sourceRateMasterId, setSourceRateMasterId] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [rateSearch, setRateSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch.trim(), 300);
  const debouncedVendorSearch = useDebounce(vendorSearch.trim(), 300);
  const debouncedProductSearch = useDebounce(productSearch.trim(), 300);
  const debouncedRateSearch = useDebounce(rateSearch.trim(), 300);

  const prevVendorContractRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevVendorContractRef.current === null) {
      prevVendorContractRef.current = isVendorContract;
      return;
    }
    if (prevVendorContractRef.current === isVendorContract) return;
    prevVendorContractRef.current = isVendorContract;
    setCustomerId(0);
    setVendorId(0);
    setSourceRateMasterId(0);
    setCustomerSearch("");
    setVendorSearch("");
    setRateSearch("");
    setTargetMode("single");
    setIncludeSourceCustomer(false);
    prevTemplateDatesRef.current = 0;
  }, [isVendorContract]);

  const prevTemplateDatesRef = useRef(0);

  const { data: customersData } = useQuery({
    queryKey: ["duplicate-rate-customers", debouncedCustomerSearch],
    queryFn: () =>
      customerService.getCustomers({
        page: 1,
        limit: 15,
        search: debouncedCustomerSearch || undefined,
        sortBy: "name",
        sortOrder: "asc",
      }),
    enabled: !isVendorContract && targetMode === "single",
  });

  const { data: vendorsData } = useQuery({
    queryKey: ["duplicate-rate-vendors", debouncedVendorSearch],
    queryFn: () =>
      vendorService.getVendors({
        page: 1,
        limit: 15,
        search: debouncedVendorSearch || undefined,
        sortBy: "vendorName",
        sortOrder: "asc",
      }),
    enabled: isVendorContract,
  });

  const { data: productsData } = useQuery({
    queryKey: ["duplicate-rate-products", debouncedProductSearch],
    queryFn: () =>
      productService.getProducts({
        page: 1,
        limit: 15,
        search: debouncedProductSearch || undefined,
        sortBy: "productName",
        sortOrder: "asc",
      }),
  });

  const { data: ratesData, isFetching: ratesLoading } = useQuery({
    queryKey: ["duplicate-rate-templates", debouncedRateSearch, isVendorContract],
    queryFn: () =>
      rateService.getRateMasters({
        page: 1,
        limit: 20,
        search: debouncedRateSearch || undefined,
        sortBy: "fromDate",
        sortOrder: "desc",
        updateType: isVendorContract ? "VENDOR_RATE" : "AWB_ENTRY_RATE",
      }),
  });

  const isGroupMode = !isVendorContract && targetMode === "customer_group";

  const selectedTemplateRate = useMemo(
    () => (ratesData?.data ?? []).find((rm) => rm.id === sourceRateMasterId),
    [ratesData?.data, sourceRateMasterId],
  );

  const { data: sourceRateResponse, isFetching: sourceRateLoading } = useQuery({
    queryKey: ["duplicate-source-rate", sourceRateMasterId],
    queryFn: () => rateService.getRateMasterById(sourceRateMasterId),
    enabled: sourceRateMasterId > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const sourceRate = sourceRateResponse?.data;
  const sourceGroupId = useMemo(
    () =>
      resolveCustomerGroupId(sourceRate?.customer) ??
      resolveCustomerGroupId(selectedTemplateRate?.customer) ??
      null,
    [sourceRate?.customer, selectedTemplateRate?.customer],
  );
  const sourceGroupLabel =
    sourceRate?.customer?.customerGroup?.name ||
    sourceRate?.customer?.customerGroup?.code ||
    selectedTemplateRate?.customer?.customerGroup?.name ||
    selectedTemplateRate?.customer?.customerGroup?.code ||
    (sourceGroupId != null ? `Group #${sourceGroupId}` : null);

  useEffect(() => {
    if (sourceRateMasterId <= 0) return;
    const template = sourceRate ?? selectedTemplateRate;
    const pid = template?.productId;
    if (pid != null && pid > 0) {
      setProductId(pid);
    }
  }, [sourceRateMasterId, sourceRate, selectedTemplateRate]);

  useEffect(() => {
    if (!isGroupMode || sourceRateMasterId <= 0 || !sourceRate?.toDate) return;
    if (prevTemplateDatesRef.current === sourceRateMasterId) return;
    prevTemplateDatesRef.current = sourceRateMasterId;
    const templateEnd = sourceRate.toDate.slice(0, 10);
    const nextFrom = format(addDays(new Date(`${templateEnd}T00:00:00`), 1), "yyyy-MM-dd");
    setFromDate(nextFrom);
    setToDate(format(addDays(new Date(`${nextFrom}T00:00:00`), 30), "yyyy-MM-dd"));
  }, [isGroupMode, sourceRate?.toDate, sourceRateMasterId]);

  const { data: groupCustomersData, isFetching: groupCustomersLoading } = useQuery({
    queryKey: ["duplicate-group-customers", sourceGroupId, includeSourceCustomer, sourceRate?.customerId],
    queryFn: () =>
      customerService.getCustomers({
        page: 1,
        limit: 200,
        customerGroupId: sourceGroupId!,
        sortBy: "name",
        sortOrder: "asc",
      }),
    enabled: isGroupMode && sourceGroupId != null && sourceGroupId > 0,
  });

  const groupPreviewCustomers = useMemo(() => {
    const rows = groupCustomersData?.data ?? [];
    if (!isGroupMode) return [];
    if (includeSourceCustomer) return rows;
    const sourceId = sourceRate?.customerId ?? selectedTemplateRate?.customerId;
    if (sourceId == null) return rows;
    return rows.filter((c) => c.id !== sourceId);
  }, [
    groupCustomersData?.data,
    includeSourceCustomer,
    isGroupMode,
    selectedTemplateRate?.customerId,
    sourceRate?.customerId,
  ]);

  const customerOptions = useMemo(
    () =>
      (customersData?.data ?? []).map((c) => ({
        value: c.id,
        label: c.name || c.code || `Customer #${c.id}`,
      })),
    [customersData?.data],
  );

  const vendorOptions = useMemo(
    () =>
      (vendorsData?.data ?? []).map((v) => ({
        value: v.id,
        label: v.vendorName || v.vendorCode || `Vendor #${v.id}`,
      })),
    [vendorsData?.data],
  );

  const productOptions = useMemo(
    () =>
      (productsData?.data ?? []).map((p) => ({
        value: p.id,
        label: p.productName || p.productCode || `Product #${p.id}`,
      })),
    [productsData?.data],
  );

  const rateOptions = useMemo(
    () =>
      (ratesData?.data ?? []).map((rm) => ({
        value: rm.id,
        label: rateTemplateLabel(rm),
      })),
    [ratesData?.data],
  );

  const duplicateMutation = useMutation({
    mutationFn: () =>
      rateService.duplicateRateMaster({
        sourceRateMasterId: sourceRateMasterId,
        fromDate,
        toDate,
        ...(isVendorContract ? { targetVendorId: vendorId } : { customerId }),
        productId,
      }),
    onSuccess: (res) => {
      const id = res?.data?.id;
      if (id) {
        toast.success("Rate master duplicated");
        router.push(`/masters/rates/${id}/edit?contract=${contractQs}`);
        return;
      }
      toast.success("Rate master duplicated");
      router.push(rateMasterListPath(contract));
    },
    onError: (e: Error) => {
      toast.error(e.message || "Duplicate failed");
    },
  });

  const duplicateGroupMutation = useMutation({
    mutationFn: () =>
      rateService.duplicateRateMasterToCustomerGroup({
        sourceRateMasterId,
        fromDate,
        toDate,
        productId,
        includeSourceCustomer,
      }),
    onSuccess: (res) => {
      const result = res?.data;
      const created = result?.created?.length ?? 0;
      const skipped = result?.skipped?.length ?? 0;
      const skippedNote = skipped > 0 ? `, ${skipped} skipped` : "";
      toast.success(`Created ${created} rate master(s) for ${result?.customerGroupName ?? "group"}${skippedNote}`);
      router.push(rateMasterListPath(contract));
    },
    onError: (e: Error) => {
      toast.error(e.message || "Group duplicate failed");
    },
  });

  const isPending = duplicateMutation.isPending || duplicateGroupMutation.isPending;

  const canSubmitSingle =
    fromDate &&
    toDate &&
    (isVendorContract ? vendorId > 0 : customerId > 0) &&
    productId > 0 &&
    sourceRateMasterId > 0;

  const canSubmitGroup =
    fromDate &&
    toDate &&
    productId > 0 &&
    sourceRateMasterId > 0 &&
    sourceGroupId != null &&
    sourceGroupId > 0 &&
    groupPreviewCustomers.length > 0;

  const canSubmit = isGroupMode ? canSubmitGroup : canSubmitSingle;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Copy className="h-4 w-4" aria-hidden />
          Duplicate from existing rate
        </CardTitle>
        <CardDescription>
          {isVendorContract
            ? "Choose dates, vendor, and product for the new buy-rate contract, pick a vendor rate to copy slabs and charges from, then submit. You can adjust details on the next screen."
            : "Choose dates and product, pick a saved rate to copy from, then duplicate to one customer or to every customer in the template customer's group."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dup-from-date">From date</Label>
            <Input
              id="dup-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dup-to-date">To date</Label>
            <Input id="dup-to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        {!isVendorContract ? (
          <div className="space-y-2">
            <Label htmlFor="dup-target-mode">Duplicate to</Label>
            <Select
              value={targetMode}
              onValueChange={(v) => setTargetMode(v as DuplicateTargetMode)}
            >
              <SelectTrigger id="dup-target-mode" className="w-full sm:max-w-md">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single customer</SelectItem>
                <SelectItem value="customer_group">All customers in same group</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {isVendorContract ? (
          <div className="space-y-2">
            <Label>Vendor (new rate)</Label>
            <Combobox
              options={vendorOptions}
              value={vendorId > 0 ? vendorId : ""}
              onChange={(v) => setVendorId(Number(v) || 0)}
              placeholder="Select vendor"
              searchPlaceholder="Search vendors…"
              searchValue={vendorSearch}
              onSearchValueChange={setVendorSearch}
            />
          </div>
        ) : isGroupMode ? null : (
          <div className="space-y-2">
            <Label>Customer (new rate)</Label>
            <Combobox
              options={customerOptions}
              value={customerId > 0 ? customerId : ""}
              onChange={(v) => setCustomerId(Number(v) || 0)}
              placeholder="Select customer"
              searchPlaceholder="Search customers…"
              searchValue={customerSearch}
              onSearchValueChange={setCustomerSearch}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Product (new rate)</Label>
          <Combobox
            options={productOptions}
            value={productId > 0 ? productId : ""}
            onChange={(v) => setProductId(Number(v) || 0)}
            placeholder="Select product"
            searchPlaceholder="Search products…"
            searchValue={productSearch}
            onSearchValueChange={setProductSearch}
          />
        </div>
        <div className="space-y-2">
          <Label>Template rate to copy from</Label>
          <Combobox
            options={rateOptions}
            value={sourceRateMasterId > 0 ? sourceRateMasterId : ""}
            onChange={(v) => setSourceRateMasterId(Number(v) || 0)}
            placeholder={
              isVendorContract
                ? "Search by id, vendor, or product…"
                : "Search by id, customer, or product…"
            }
            searchPlaceholder="Search saved rates…"
            searchValue={rateSearch}
            onSearchValueChange={setRateSearch}
            isSearching={ratesLoading}
          />
        </div>

        {isGroupMode ? (
          <div className="space-y-3 rounded-md border border-border/80 bg-muted/30 p-4">
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Customer group copy</p>
                <p className="text-muted-foreground">
                  Creates one new rate per customer in the template customer&apos;s group, using the
                  same slabs and charges. Customers who already have an overlapping contract for
                  this product and date range are skipped.
                </p>
              </div>
            </div>

            {sourceRateMasterId > 0 && sourceRateLoading ? (
              <p className="text-sm text-muted-foreground">Loading template customer group…</p>
            ) : null}

            {sourceRateMasterId > 0 && !sourceRateLoading && sourceGroupId == null ? (
              <p className="text-sm font-medium text-destructive">
                The template rate&apos;s customer is not in a customer group. Open that customer in
                Customer Master, assign a group, save, then re-select the template rate here.
              </p>
            ) : null}

            {sourceGroupId != null && sourceGroupLabel ? (
              <p className="text-sm">
                Group: <span className="font-medium">{sourceGroupLabel}</span>
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox
                id="dup-include-source"
                checked={includeSourceCustomer}
                onCheckedChange={(checked) => setIncludeSourceCustomer(Boolean(checked))}
              />
              <Label htmlFor="dup-include-source" className="cursor-pointer font-normal">
                Also duplicate for the template customer (they already have this rate)
              </Label>
            </div>

            {sourceGroupId != null ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Will target ({groupPreviewCustomers.length} customer
                  {groupPreviewCustomers.length === 1 ? "" : "s"})
                </p>
                {groupCustomersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading customers…</p>
                ) : groupPreviewCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No other customers in this group. Enable &quot;template customer&quot; above and
                    use a date range that does not overlap the template rate, or add more customers
                    to the group.
                  </p>
                ) : (
                  <ul className="max-h-36 list-inside list-disc overflow-y-auto text-sm text-muted-foreground">
                    {groupPreviewCustomers.map((c) => (
                      <li key={c.id}>{c.name || c.code || `Customer #${c.id}`}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <PermissionGuard permission="master.rate.create">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canSubmit || isPending}
            onClick={() =>
              isGroupMode ? duplicateGroupMutation.mutate() : duplicateMutation.mutate()
            }
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {isGroupMode ? "Duplicating to group…" : "Duplicating…"}
              </>
            ) : isGroupMode ? (
              `Duplicate to ${groupPreviewCustomers.length} customer${groupPreviewCustomers.length === 1 ? "" : "s"}`
            ) : (
              "Duplicate & open editor"
            )}
          </Button>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}
