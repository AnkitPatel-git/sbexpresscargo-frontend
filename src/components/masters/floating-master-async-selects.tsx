"use client"

import type { Ref } from "react"
import { bankService } from "@/services/masters/bank-service"
import { countryService } from "@/services/masters/country-service"
import { serviceCenterService } from "@/services/masters/service-center-service"
import type { Bank } from "@/types/masters/bank"
import type { Country } from "@/types/masters/country"
import type { ServiceCenter } from "@/types/masters/service-center"
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
            value={value > 0 ? String(value) : undefined}
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
