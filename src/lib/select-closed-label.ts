/**
 * Radix Select keeps `SelectContent` unmounted while closed, so `SelectValue` cannot read labels from
 * `SelectItem` nodes. Pass the same labels explicitly as children, using this helper when the value
 * comes from a fixed option list.
 */
export function optionLabelForSelect<V extends string>(
  current: string | undefined | null,
  options: ReadonlyArray<{ value: V; label: string }>,
): string | undefined {
  if (current == null || current === "") return undefined
  const n = String(current).trim()
  const hit = options.find(
    (o) => String(o.value) === n || String(o.value).toUpperCase() === n.toUpperCase(),
  )
  return hit?.label
}

/** Resolve label for async-style selects where options are `{ id, … }` rows. */
export function optionLabelById<T extends { id: number }>(
  current: string | undefined | null,
  rows: readonly T[] | undefined,
  getLabel: (row: T) => string,
): string | undefined {
  if (current == null || current === "") return undefined
  const id = Number(current)
  if (!Number.isFinite(id)) return undefined
  const row = rows?.find((r) => r.id === id)
  return row ? getLabel(row) : undefined
}

export const STATUS_ACTIVE_INACTIVE_OPTIONS = [
  { value: "ACTIVE" as const, label: "Active" },
  { value: "INACTIVE" as const, label: "Inactive" },
] as const

export const WEIGHT_UNIT_KGS_LBS_OPTIONS = [
  { value: "KGS" as const, label: "KGS" },
  { value: "LBS" as const, label: "LBS" },
] as const

export const SHIPPER_FIRM_TYPE_OPTIONS = [
  { value: "GOV" as const, label: "GOV" },
  { value: "NON_GOV" as const, label: "NON_GOV" },
] as const

export const VENDOR_ENVIRONMENT_OPTIONS = [
  { value: "SANDBOX" as const, label: "Sandbox" },
  { value: "PRODUCTION" as const, label: "Production" },
] as const

export const EXCEPTION_TYPE_OPTIONS = [
  { value: "UNDELIVERED" as const, label: "UNDELIVERED" },
  { value: "DELIVERED" as const, label: "DELIVERED" },
] as const

export const PRODUCT_TYPE_OPTIONS = [
  { value: "DOMESTIC" as const, label: "Domestic" },
  { value: "INTERNATIONAL" as const, label: "International" },
  { value: "LOCAL" as const, label: "Local" },
] as const

export const ZONE_TYPE_OPTIONS = [
  { value: "DOMESTIC" as const, label: "Domestic" },
  { value: "VENDOR" as const, label: "Vendor" },
] as const

export const CUSTOMER_ACCOUNT_TYPE_OPTIONS = [
  { value: "CREDIT" as const, label: "Credit" },
  { value: "DEBIT" as const, label: "Debit" },
] as const

export const PRICING_MODE_FLAT_PER_KG_OPTIONS = [
  { value: "FLAT" as const, label: "Flat" },
  { value: "PER_KG" as const, label: "Per kg" },
] as const

export const PRICING_MODE_CONDITION_SLAB_OPTIONS = [
  { value: "FLAT" as const, label: "Flat (fixed amount for band)" },
  { value: "PER_KG" as const, label: "Per unit (rate × basis: weight or km)" },
] as const

export const SERVICE_MAP_SERVICE_TYPE_OPTIONS = [
  { value: "EXPRESS" as const, label: "EXPRESS" },
  { value: "SURFACE" as const, label: "SURFACE" },
  { value: "AIR" as const, label: "AIR" },
] as const

/** Service map list uses full-word labels on items (not title case). */
export const SERVICE_MAP_STATUS_OPTIONS = [
  { value: "ACTIVE" as const, label: "ACTIVE" },
  { value: "INACTIVE" as const, label: "INACTIVE" },
] as const

export const MANIFEST_FORMAT_OPTIONS = [
  { value: "standard" as const, label: "Standard" },
  { value: "detailed" as const, label: "Detailed" },
] as const

export const MANIFEST_PDF_TYPE_OPTIONS = [
  { value: "A4" as const, label: "A4" },
  { value: "Letter" as const, label: "Letter" },
] as const

/** List / dialog filters: status + "all" sentinel (label matches SelectItem text). */
export const MASTER_LIST_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
] as const

export const BANK_LIST_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
] as const

export const VENDOR_CONFIG_ENVIRONMENT_FILTER_OPTIONS = [
  { value: "all" as const, label: "All environments" },
  { value: "SANDBOX" as const, label: "Sandbox" },
  { value: "PRODUCTION" as const, label: "Production" },
] as const

export const BOOLEAN_STRING_FILTER_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "true" as const, label: "Active" },
  { value: "false" as const, label: "Inactive" },
] as const

export const PIECE_MEASURE_UNIT_OPTIONS = (
  ["PCS", "KG", "METER", "LITER"] as const
).map((u) => ({ value: u, label: u }));
