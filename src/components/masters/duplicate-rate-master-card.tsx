"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  }, [isVendorContract]);

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
    enabled: !isVendorContract,
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
        ...(isVendorContract
          ? { targetVendorId: vendorId }
          : { customerId }),
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

  const canSubmit =
    fromDate &&
    toDate &&
    (isVendorContract ? vendorId > 0 : customerId > 0) &&
    productId > 0 &&
    sourceRateMasterId > 0;

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
            : "Choose dates and customer/product for the new contract, pick a saved rate to copy slabs and charges from, then submit. You can adjust details on the next screen."}
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
        ) : (
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
        <PermissionGuard permission="master.rate.create">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canSubmit || duplicateMutation.isPending}
            onClick={() => duplicateMutation.mutate()}
          >
            {duplicateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Duplicating…
              </>
            ) : (
              "Duplicate & open editor"
            )}
          </Button>
        </PermissionGuard>
      </CardContent>
    </Card>
  );
}
