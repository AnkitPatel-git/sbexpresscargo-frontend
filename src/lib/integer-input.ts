/**
 * Whole-number fields: text-like input (no spinners), no decimals, blank when unset (not 0).
 */

export type IntegerOnChange = (value: number | undefined) => void

/** Display string for controlled integer inputs. Empty when null/undefined/NaN; truncates numbers. */
export function integerInputDisplayValue(value: unknown): string {
  if (value === "" || value == null) return ""
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return ""
    return String(Math.trunc(value))
  }
  if (typeof value === "string") {
    const t = value.trim()
    if (!t) return ""
    const n = Number(t)
    if (!Number.isFinite(n)) return ""
    return String(Math.trunc(n))
  }
  return ""
}

export type ParseIntegerOptions = {
  min?: number
  max?: number
  /** When true, allow a single leading minus (negative integers). Default false. */
  allowNegative?: boolean
}

/**
 * Parse raw input to an integer or undefined (empty / non-numeric).
 * Strips non-digits (and minus only when allowNegative).
 */
export function parseOptionalIntegerInput(raw: string, options?: ParseIntegerOptions): number | undefined {
  let s = raw.trim()
  if (!s) return undefined

  const allowNegative = options?.allowNegative === true
  if (allowNegative) {
    const neg = s.startsWith("-")
    s = s.replace(/[^\d]/g, "")
    if (!s) return undefined
    let n = parseInt(s, 10)
    if (!Number.isFinite(n)) return undefined
    if (neg) n = -n
    return clampInteger(n, options)
  }

  s = s.replace(/\D/g, "")
  if (!s) return undefined
  const n = parseInt(s, 10)
  if (!Number.isFinite(n)) return undefined
  return clampInteger(n, options)
}

function clampInteger(n: number, options?: ParseIntegerOptions): number {
  let v = Math.trunc(n)
  if (options?.min != null) v = Math.max(options.min, v)
  if (options?.max != null) v = Math.min(options.max, v)
  return v
}

/** Same as parseOptionalIntegerInput but defaults empty to undefined and applies min 0 when requested. */
export function parseOptionalNonNegativeInteger(raw: string): number | undefined {
  return parseOptionalIntegerInput(raw, { min: 0 })
}
