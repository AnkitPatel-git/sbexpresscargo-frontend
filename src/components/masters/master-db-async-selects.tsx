"use client"

import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select"
import { customerService } from "@/services/masters/customer-service"
import { productService } from "@/services/masters/product-service"
import { serviceCenterService } from "@/services/masters/service-center-service"
import { serviceMapService } from "@/services/masters/service-map-service"
import { shipperService } from "@/services/masters/shipper-service"
import { vendorService } from "@/services/masters/vendor-service"
import { zoneService } from "@/services/masters/zone-service"
import type { Customer } from "@/types/masters/customer"
import type { Product } from "@/types/masters/product"
import type { ServiceCenter } from "@/types/masters/service-center"
import type { ServiceMap } from "@/types/masters/service-map"
import type { Shipper } from "@/types/masters/shipper"
import type { Vendor } from "@/types/masters/vendor"
import type { Zone } from "@/types/masters/zone"

/** List / attendance filters: “all” row. */
export const MASTER_FILTER_ALL = "all"

/** MIS (and similar) optional numeric filters: unset when this value is selected. */
export const MIS_FILTER_ANY = "__mis_any__"

/** Service map list vendor filter: maps to empty string in parent state. */
export const SERVICE_MAP_VENDOR_ALL = "__svcmap_vendor_all__"

const FILTER_TRIGGER = "w-full h-9 border-border bg-background text-xs"

export function ServiceCenterMasterFilterDbAsync({
  value,
  onValueChange,
  queryScope,
  allValue = MASTER_FILTER_ALL,
  allLabel = "All",
}: {
  value: string
  onValueChange: (v: string) => void
  queryScope: string
  allValue?: string
  allLabel?: string
}) {
  return (
    <DbAsyncSelect<ServiceCenter>
      queryKey={["master-filter", "service-center", queryScope, allValue]}
      fetchPage={(page, search) =>
        serviceCenterService.getServiceCenters({
          page,
          limit: DB_ASYNC_SELECT_PAGE_SIZE,
          sortBy: "name",
          sortOrder: "asc",
          search: search || undefined,
        })
      }
      getItemLabel={(sc) => `${sc.code} - ${sc.name}`}
      clearOption={{ value: allValue, label: allLabel }}
      value={value}
      onValueChange={onValueChange}
      placeholder="Service center"
      searchPlaceholder="Search service centers…"
      triggerClassName={FILTER_TRIGGER}
    />
  )
}

export function CustomerMasterFilterDbAsync({
  value,
  onValueChange,
  queryScope,
  allValue = MASTER_FILTER_ALL,
  allLabel = "All",
}: {
  value: string
  onValueChange: (v: string) => void
  queryScope: string
  allValue?: string
  allLabel?: string
}) {
  return (
    <DbAsyncSelect<Customer>
      queryKey={["master-filter", "customer", queryScope, allValue]}
      fetchPage={(page, search) =>
        customerService.getCustomers({
          page,
          limit: DB_ASYNC_SELECT_PAGE_SIZE,
          sortBy: "name",
          sortOrder: "asc",
          search: search || undefined,
        })
      }
      getItemLabel={(c) => (c.code ? `${c.code} - ${c.name}` : c.name)}
      clearOption={{ value: allValue, label: allLabel }}
      value={value}
      onValueChange={onValueChange}
      placeholder="Customer"
      searchPlaceholder="Search customers…"
      triggerClassName={FILTER_TRIGGER}
    />
  )
}

export function VendorMasterFilterDbAsync({
  value,
  onValueChange,
  queryScope,
  allValue = MASTER_FILTER_ALL,
  allLabel = "All vendors",
}: {
  value: string
  onValueChange: (v: string) => void
  queryScope: string
  allValue?: string
  allLabel?: string
}) {
  return (
    <DbAsyncSelect<Vendor>
      queryKey={["master-filter", "vendor", queryScope, allValue]}
      fetchPage={(page, search) =>
        vendorService.getVendors({
          page,
          limit: DB_ASYNC_SELECT_PAGE_SIZE,
          sortBy: "vendorName",
          sortOrder: "asc",
          search: search || undefined,
        })
      }
      getItemLabel={(v) => (v.vendorCode ? `${v.vendorName} (${v.vendorCode})` : v.vendorName)}
      clearOption={{ value: allValue, label: allLabel }}
      value={value}
      onValueChange={onValueChange}
      placeholder="Vendor"
      searchPlaceholder="Search vendors…"
      triggerClassName={FILTER_TRIGGER}
    />
  )
}

export function ServiceMapMasterFilterDbAsync({
  value,
  onValueChange,
  queryScope,
  allValue = MASTER_FILTER_ALL,
  allLabel = "All service maps",
}: {
  value: string
  onValueChange: (v: string) => void
  queryScope: string
  allValue?: string
  allLabel?: string
}) {
  return (
    <DbAsyncSelect<ServiceMap>
      queryKey={["master-filter", "service-map", queryScope, allValue]}
      fetchPage={(page, search) =>
        serviceMapService.getServiceMaps({
          page,
          limit: DB_ASYNC_SELECT_PAGE_SIZE,
          search: search || undefined,
          sortBy: "vendor",
          sortOrder: "asc",
        })
      }
      getItemLabel={(sm) =>
        sm.vendor?.vendorName ? `${sm.vendor.vendorName} - ${sm.serviceType}` : `${sm.serviceType} (#${sm.id})`
      }
      clearOption={{ value: allValue, label: allLabel }}
      value={value}
      onValueChange={onValueChange}
      placeholder="Service map"
      searchPlaceholder="Search service maps…"
      triggerClassName={FILTER_TRIGGER}
    />
  )
}

export function ServiceMapVendorFilterDbAsync({
  value,
  onValueChange,
  queryScope,
}: {
  /** Parent `""` means all — pass `SERVICE_MAP_VENDOR_ALL` from caller when empty. */
  value: string
  onValueChange: (v: string) => void
  queryScope: string
}) {
  return (
    <DbAsyncSelect<Vendor>
      queryKey={["master-filter", "service-map-vendor", queryScope]}
      fetchPage={(page, search) =>
        vendorService.getVendors({
          page,
          limit: DB_ASYNC_SELECT_PAGE_SIZE,
          sortBy: "vendorName",
          sortOrder: "asc",
          search: search || undefined,
        })
      }
      getItemLabel={(v) => (v.vendorCode ? `${v.vendorName} (${v.vendorCode})` : v.vendorName)}
      clearOption={{ value: SERVICE_MAP_VENDOR_ALL, label: "All vendors" }}
      value={value || SERVICE_MAP_VENDOR_ALL}
      onValueChange={onValueChange}
      placeholder="Vendor"
      searchPlaceholder="Search vendors…"
      triggerClassName={FILTER_TRIGGER}
    />
  )
}

function misOptionalSelect<T extends { id: number }>(
  props: {
    queryKey: readonly unknown[]
    fetchPage: (page: number, search: string) => Promise<{ data: T[]; meta?: { page: number; totalPages: number } }>
    getItemLabel: (row: T) => string
    valueNum: number | undefined
    onPick: (id: number | undefined) => void
    placeholder: string
    searchPlaceholder: string
    anyLabel: string
  },
) {
  const value = props.valueNum != null && props.valueNum > 0 ? String(props.valueNum) : MIS_FILTER_ANY
  return (
    <DbAsyncSelect<T>
      queryKey={props.queryKey}
      fetchPage={props.fetchPage}
      getItemLabel={props.getItemLabel}
      clearOption={{ value: MIS_FILTER_ANY, label: props.anyLabel }}
      value={value}
      onValueChange={(v) => props.onPick(v === MIS_FILTER_ANY ? undefined : Number(v))}
      placeholder={props.placeholder}
      searchPlaceholder={props.searchPlaceholder}
      triggerClassName={FILTER_TRIGGER}
    />
  )
}

export function MisCustomerFilterDbAsync({
  valueNum,
  onPick,
  queryScope,
}: {
  valueNum: number | undefined
  onPick: (id: number | undefined) => void
  queryScope: string
}) {
  return misOptionalSelect<Customer>({
    queryKey: ["mis-filter", "customer", queryScope],
    fetchPage: (page, search) =>
      customerService.getCustomers({
        page,
        limit: DB_ASYNC_SELECT_PAGE_SIZE,
        sortBy: "name",
        sortOrder: "asc",
        search: search || undefined,
      }),
    getItemLabel: (c) => (c.code ? `${c.code} - ${c.name}` : c.name),
    valueNum,
    onPick,
    placeholder: "Customer",
    searchPlaceholder: "Search customer…",
    anyLabel: "Any customer",
  })
}

export function MisShipperFilterDbAsync({
  valueNum,
  onPick,
  queryScope,
}: {
  valueNum: number | undefined
  onPick: (id: number | undefined) => void
  queryScope: string
}) {
  return misOptionalSelect<Shipper>({
    queryKey: ["mis-filter", "shipper", queryScope],
    fetchPage: (page, search) =>
      shipperService.getShippers({
        page,
        limit: DB_ASYNC_SELECT_PAGE_SIZE,
        sortBy: "shipperName",
        sortOrder: "asc",
        search: search || undefined,
      }),
    getItemLabel: (s) => (s.shipperCode ? `${s.shipperCode} - ${s.shipperName}` : s.shipperName),
    valueNum,
    onPick,
    placeholder: "Shipper",
    searchPlaceholder: "Search shipper…",
    anyLabel: "Any shipper",
  })
}

export function MisServiceCenterFilterDbAsync({
  valueNum,
  onPick,
  queryScope,
}: {
  valueNum: number | undefined
  onPick: (id: number | undefined) => void
  queryScope: string
}) {
  return misOptionalSelect<ServiceCenter>({
    queryKey: ["mis-filter", "service-center", queryScope],
    fetchPage: (page, search) =>
      serviceCenterService.getServiceCenters({
        page,
        limit: DB_ASYNC_SELECT_PAGE_SIZE,
        sortBy: "name",
        sortOrder: "asc",
        search: search || undefined,
      }),
    getItemLabel: (sc) => `${sc.code} - ${sc.name}`,
    valueNum,
    onPick,
    placeholder: "Service center",
    searchPlaceholder: "Search service center…",
    anyLabel: "Any service center",
  })
}

export function MisProductFilterDbAsync({
  valueNum,
  onPick,
  queryScope,
}: {
  valueNum: number | undefined
  onPick: (id: number | undefined) => void
  queryScope: string
}) {
  return misOptionalSelect<Product>({
    queryKey: ["mis-filter", "product", queryScope],
    fetchPage: (page, search) =>
      productService.getProducts({
        page,
        limit: DB_ASYNC_SELECT_PAGE_SIZE,
        sortBy: "productName",
        sortOrder: "asc",
        search: search || undefined,
      }),
    getItemLabel: (p) => (p.productCode ? `${p.productCode} - ${p.productName}` : p.productName),
    valueNum,
    onPick,
    placeholder: "Product",
    searchPlaceholder: "Search product…",
    anyLabel: "Any product",
  })
}

export function MisZoneFilterDbAsync({
  valueNum,
  onPick,
  queryScope,
  anyLabel,
}: {
  valueNum: number | undefined
  onPick: (id: number | undefined) => void
  queryScope: string
  anyLabel: string
}) {
  return misOptionalSelect<Zone>({
    queryKey: ["mis-filter", "zone", queryScope, anyLabel],
    fetchPage: (page, search) =>
      zoneService.getZones({
        page,
        limit: DB_ASYNC_SELECT_PAGE_SIZE,
        sortBy: "name",
        sortOrder: "asc",
        search: search || undefined,
      }),
    getItemLabel: (z) => (z.code ? `${z.code} - ${z.name}` : z.name),
    valueNum,
    onPick,
    placeholder: "Zone",
    searchPlaceholder: "Search zone…",
    anyLabel,
  })
}
