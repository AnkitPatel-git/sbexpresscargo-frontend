/**
 * Decimal fields (e.g. rates): text input, no spinners, up to N fractional digits.
 */

export type DecimalOnChange = (value: number | undefined) => void

export type ParseDecimalOptions = {
  /** Max digits after decimal point. Default 2. */
  decimalPlaces?: number
  min?: number
  max?: number
  allowNegative?: boolean
}

const DEFAULT_DECIMAL_PLACES = 2

/** Display string when not actively editing (blur / external value sync). */
export function decimalInputDisplayValue(
  value: unknown,
  decimalPlaces: number = DEFAULT_DECIMAL_PLACES,
): string {
  if (value === "" || value == null) return ""
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ""
    return formatDecimalNumber(value, decimalPlaces)
  }
  if (typeof value === "string") {
    const t = value.trim()
    if (!t) return ""
    const n = Number(t)
    if (!Number.isFinite(n)) return sanitizeDecimalRaw(t, decimalPlaces)
    return formatDecimalNumber(n, decimalPlaces)
  }
  return ""
}

function formatDecimalNumber(n: number, decimalPlaces: number): string {
  const factor = 10 ** decimalPlaces
  const rounded = Math.round(n * factor) / factor
  const fixed = rounded.toFixed(decimalPlaces)
  return fixed.replace(/\.?0+$/, "") || "0"
}

/** Sanitize in-progress typing (keeps a single dot and limits fractional length). */
export function sanitizeDecimalRaw(raw: string, decimalPlaces: number = DEFAULT_DECIMAL_PLACES): string {
  let s = raw.trim()
  if (!s) return ""

  const allowNegative = s.startsWith("-")
  if (allowNegative) s = s.slice(1)

  s = s.replace(/[^\d.]/g, "")
  const dot = s.indexOf(".")
  if (dot === -1) return (allowNegative ? "-" : "") + s

  const intPart = s.slice(0, dot).replace(/\./g, "") || "0"
  const fracPart = s.slice(dot + 1).replace(/\./g, "").slice(0, decimalPlaces)
  const endsWithDot = raw.trim().endsWith(".") && fracPart.length === 0
  const prefix = allowNegative ? "-" : ""
  if (endsWithDot) return `${prefix}${intPart === "0" && raw.trim().startsWith(".") ? "" : intPart}.`
  if (fracPart.length === 0) return `${prefix}${intPart}`
  return `${prefix}${intPart}.${fracPart}`
}

export function parseOptionalDecimalInput(
  raw: string,
  options?: ParseDecimalOptions,
): number | undefined {
  const places = options?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES
  const sanitized = sanitizeDecimalRaw(raw, places)
  if (!sanitized || sanitized === "-" || sanitized === "." || sanitized === "-.") return undefined

  const n = Number(sanitized)
  if (!Number.isFinite(n)) return undefined
  return clampDecimal(n, options, places)
}

function clampDecimal(n: number, options: ParseDecimalOptions | undefined, places: number): number {
  const factor = 10 ** places
  let v = Math.round(n * factor) / factor
  if (options?.allowNegative !== true && v < 0) v = Math.abs(v)
  if (options?.min != null) v = Math.max(options.min, v)
  if (options?.max != null) v = Math.min(options.max, v)
  return v
}
