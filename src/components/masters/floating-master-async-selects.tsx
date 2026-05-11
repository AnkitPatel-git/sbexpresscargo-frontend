"use client"

import type { Ref } from "react"
import { areaService } from "@/services/masters/area-service"
import { bankService } from "@/services/masters/bank-service"
import { countryService } from "@/services/masters/country-service"
import { customerService } from "@/services/masters/customer-service"
import { serviceCenterService } from "@/services/masters/service-center-service"
import { serviceMapService } from "@/services/masters/service-map-service"
import { vendorService } from "@/services/masters/vendor-service"
import { userService } from "@/services/user-service"
import type { Area } from "@/types/masters/area"
import type { Bank } from "@/types/masters/bank"
import type { Country } from "@/types/masters/country"
import type { Customer } from "@/types/masters/customer"
import type { ServiceCenter } from "@/types/masters/service-center"
import type { ServiceMap } from "@/types/masters/service-map"
import type { Vendor } from "@/types/masters/vendor"
import type { UtilityUser } from "@/types/utilities/user"
import { useFormField } from "@/components/ui/form"
import { FLOATING_INNER_SELECT_TRIGGER } from "@/components/ui/floating-form-item"
import { DbAsyncSelect, DB_ASYNC_SELECT_PAGE_SIZE } from "@/components/ui/db-async-select"

export function BankFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraBanks,
    triggerRef,
    optional = false,
}: {
    value: number
    onChange: (v: number) => void
    queryKeyScope: string
    extraBanks?: Bank[]
    triggerRef: Ref<HTMLButtonElement>
    /** When true, first option clears selection (bank id 0). */
    optional?: boolean
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<Bank>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "banks", queryKeyScope]}
            fetchPage={(page, search) =>
                bankService.getBanks({
                    page,
                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                    sortBy: "bankName",
                    sortOrder: "asc",
                    search: search || undefined,
                })
            }
            getItemLabel={(b) => b.bankName}
            extraItems={extraBanks}
            clearOption={optional ? { value: "0", label: "No bank" } : undefined}
            value={value > 0 ? String(value) : optional ? "0" : undefined}
            onValueChange={(v) => onChange(v === "0" ? 0 : Number(v))}
            placeholder="Select bank"
            searchPlaceholder="Search banks…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function CountryFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraCountries,
    triggerRef,
}: {
    value: number
    onChange: (v: number) => void
    queryKeyScope: string
    extraCountries?: Country[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<Country>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "countries", queryKeyScope]}
            fetchPage={(page, search) =>
                countryService.getCountries({
                    page,
                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                    search: search || undefined,
                    sortBy: "name",
                    sortOrder: "asc",
                })
            }
            getItemLabel={(c) => `${c.name} (${c.code})`}
            extraItems={extraCountries}
            value={value > 0 ? String(value) : undefined}
            onValueChange={(v) => onChange(Number(v))}
            placeholder="Select country"
            searchPlaceholder="Search countries…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function ServiceCenterFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraCenters,
    triggerRef,
}: {
    value: number
    onChange: (v: number) => void
    queryKeyScope: string
    extraCenters?: ServiceCenter[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<ServiceCenter>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "service-centers", queryKeyScope]}
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
            extraItems={extraCenters}
            value={value > 0 ? String(value) : undefined}
            onValueChange={(v) => onChange(Number(v))}
            placeholder="Select service center"
            searchPlaceholder="Search service centers…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function ServiceCenterOptionalFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraCenters,
    triggerRef,
}: {
    value: number | undefined
    onChange: (v: number | undefined) => void
    queryKeyScope: string
    extraCenters?: ServiceCenter[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<ServiceCenter>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "service-centers-optional", queryKeyScope]}
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
            extraItems={extraCenters}
            clearOption={{ value: "__none__", label: "None" }}
            value={value != null && value > 0 ? String(value) : "__none__"}
            onValueChange={(v) => onChange(v === "__none__" ? undefined : Number(v))}
            placeholder="Select service center"
            searchPlaceholder="Search service centers…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function VendorFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraVendors,
    triggerRef,
    allowClear = false,
}: {
    value: number | undefined
    onChange: (v: number | undefined) => void
    queryKeyScope: string
    extraVendors?: Vendor[]
    triggerRef: Ref<HTMLButtonElement>
    allowClear?: boolean
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<Vendor>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "vendors", queryKeyScope, allowClear]}
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
            extraItems={extraVendors}
            clearOption={allowClear ? { value: "__none__", label: "None" } : undefined}
            value={
                allowClear
                    ? value != null && value > 0
                        ? String(value)
                        : "__none__"
                    : value != null && value > 0
                      ? String(value)
                      : undefined
            }
            onValueChange={(v) => {
                if (allowClear) {
                    onChange(v === "__none__" ? undefined : Number(v))
                } else {
                    onChange(Number(v))
                }
            }}
            placeholder="Select vendor"
            searchPlaceholder="Search vendors…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function ServiceMapFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraServiceMaps,
    triggerRef,
}: {
    value: number | undefined
    onChange: (v: number | undefined) => void
    queryKeyScope: string
    extraServiceMaps?: ServiceMap[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<ServiceMap>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "service-maps", queryKeyScope]}
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
            extraItems={extraServiceMaps}
            value={value != null && value > 0 ? String(value) : undefined}
            onValueChange={(v) => onChange(Number(v))}
            placeholder="Select service map"
            searchPlaceholder="Search service maps…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function AreaFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraAreas,
    triggerRef,
    allowClear = false,
}: {
    value: number | undefined
    onChange: (v: number | undefined) => void
    queryKeyScope: string
    extraAreas?: Area[]
    triggerRef: Ref<HTMLButtonElement>
    allowClear?: boolean
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<Area>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "areas", queryKeyScope, allowClear]}
            fetchPage={(page, search) =>
                areaService.getAreas({
                    page,
                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                    sortBy: "areaName",
                    sortOrder: "asc",
                    search: search || undefined,
                })
            }
            getItemLabel={(a) => a.areaName}
            extraItems={extraAreas}
            clearOption={allowClear ? { value: "__none__", label: "None" } : undefined}
            value={
                allowClear
                    ? value != null && value > 0
                        ? String(value)
                        : "__none__"
                    : value != null && value > 0
                      ? String(value)
                      : undefined
            }
            onValueChange={(v) => {
                if (allowClear) {
                    onChange(v === "__none__" ? undefined : Number(v))
                } else {
                    onChange(Number(v))
                }
            }}
            placeholder="Select area"
            searchPlaceholder="Search areas…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function CustomerFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraCustomers,
    triggerRef,
}: {
    value: number | undefined
    onChange: (v: number | undefined) => void
    queryKeyScope: string
    extraCustomers?: Customer[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<Customer>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "customers", queryKeyScope]}
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
            extraItems={extraCustomers}
            value={value != null && value > 0 ? String(value) : undefined}
            onValueChange={(v) => onChange(Number(v))}
            placeholder="Select customer"
            searchPlaceholder="Search customers…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function CustomerNullableFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraCustomers,
    triggerRef,
}: {
    value: number | null | undefined
    onChange: (v: number | null) => void
    queryKeyScope: string
    extraCustomers?: Customer[]
    triggerRef: Ref<HTMLButtonElement>
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<Customer>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            queryKey={["master-form", "customers-nullable", queryKeyScope]}
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
            extraItems={extraCustomers}
            clearOption={{ value: "none", label: "None" }}
            value={value != null && value > 0 ? String(value) : "none"}
            onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
            placeholder="Select customer"
            searchPlaceholder="Search customers…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}

export function UserFloatingAsyncSelect({
    value,
    onChange,
    queryKeyScope,
    extraUsers,
    triggerRef,
    disabled,
}: {
    value: number | undefined
    onChange: (v: number | undefined) => void
    queryKeyScope: string
    extraUsers?: UtilityUser[]
    triggerRef: Ref<HTMLButtonElement>
    disabled?: boolean
}) {
    const { formItemId, error } = useFormField()
    return (
        <DbAsyncSelect<UtilityUser>
            triggerRef={triggerRef}
            id={formItemId}
            aria-invalid={error ? true : undefined}
            disabled={disabled}
            queryKey={["master-form", "users-active", queryKeyScope]}
            fetchPage={(page, search) =>
                userService.listUsers({
                    page,
                    limit: DB_ASYNC_SELECT_PAGE_SIZE,
                    status: "ACTIVE",
                    search: search || undefined,
                })
            }
            getItemLabel={(u) => (u.email ? `${u.username} (${u.email})` : u.username)}
            extraItems={extraUsers}
            value={value != null && value > 0 ? String(value) : undefined}
            onValueChange={(v) => onChange(Number(v))}
            placeholder="Select user"
            searchPlaceholder="Search users…"
            triggerClassName={FLOATING_INNER_SELECT_TRIGGER}
        />
    )
}
