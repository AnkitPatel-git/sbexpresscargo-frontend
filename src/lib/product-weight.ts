export type ProductWeightUnit = 'G' | 'KG'

const PRODUCT_BOOKING_GRAM_SLAB = 500

export function isProductWeightInGrams(
  unit: ProductWeightUnit | string | null | undefined,
): boolean {
  return String(unit ?? 'KG').toUpperCase() === 'G'
}

/** Gram products: round up to the next 500 g slab (1600 → 2000). */
export function roundProductBookingGramWeight(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.ceil(value / PRODUCT_BOOKING_GRAM_SLAB) * PRODUCT_BOOKING_GRAM_SLAB
}

/** Kg products: preserve decimal kg input (rounded only to 2 decimals). */
export function roundProductBookingKgWeight(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return round2(value)
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Gram-product compatibility parser:
 * - legacy values may still be grams (e.g. 500, 1600)
 * - new flow stores decimal kg (e.g. 0.5, 1.5)
 */
function normalizeGramValueToKg(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  const interpretedAsGrams = value >= 100
  const grams = interpretedAsGrams ? value : value * 1000
  return round2(roundProductBookingGramWeight(grams) / 1000)
}

/** Normalize a weight value in the product's native booking unit. */
export function normalizeProductBookingWeight(
  value: number,
  unit: ProductWeightUnit | string,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (isProductWeightInGrams(unit)) {
    return normalizeGramValueToKg(value)
  }
  return roundProductBookingKgWeight(value)
}

/** Stored booking weight → kg for L×B×H divisor math. */
export function productBookingWeightToKg(
  value: number,
  unit: ProductWeightUnit | string,
): number {
  if (!Number.isFinite(value)) return 0
  if (!isProductWeightInGrams(unit)) return value
  // Backward compatible: legacy rows stored grams; new rows store kg decimals.
  return value >= 100 ? value / 1000 : value
}

/** Kg from volumetric formula → product storage unit. */
export function kgToProductBookingWeight(
  kg: number,
  unit: ProductWeightUnit | string,
): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  if (isProductWeightInGrams(unit)) {
    return normalizeGramValueToKg(kg)
  }
  return normalizeProductBookingWeight(kg, unit)
}

export type CustomerWeightRoundOff = 'ROUND_OFF_AT_0' | 'ROUND_OFF_AT_500'

export const DEFAULT_CUSTOMER_WEIGHT_ROUND_OFF: CustomerWeightRoundOff =
  'ROUND_OFF_AT_0'

/**
 * Customer kg round-off:
 * - ROUND_OFF_AT_0 (Round): any fraction → next whole kg
 * - ROUND_OFF_AT_500 (Roundoff): fraction ≤ 0.5 keep whole; else +1
 */
export function applyCustomerKgWeightRoundOff(
  value: number,
  mode: CustomerWeightRoundOff | string | null | undefined,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  const normalized = String(mode ?? DEFAULT_CUSTOMER_WEIGHT_ROUND_OFF).toUpperCase()
  const whole = Math.floor(value)
  const fraction = value - whole
  if (fraction <= 0) return whole
  if (normalized === 'ROUND_OFF_AT_500') {
    return fraction <= 0.5 ? whole : whole + 1
  }
  return whole + 1
}

/**
 * Volumetric at content (single box) level, then × pieces.
 * e.g. Round + 12.1 kg/box + 3 pcs → 13 × 3 = 39
 */
export function applyCustomerContentVolumetricKg(
  perPieceKg: number,
  pieces: number,
  mode: CustomerWeightRoundOff | string | null | undefined,
): number {
  if (!Number.isFinite(perPieceKg) || perPieceKg <= 0) return 0
  const pcs = Math.max(0, Number(pieces) || 0)
  if (pcs <= 0) return 0
  return round2(applyCustomerKgWeightRoundOff(perPieceKg, mode) * pcs)
}

export function productWeightLabel(
  unit: ProductWeightUnit | string | null | undefined,
): string {
  return isProductWeightInGrams(unit) ? 'g' : 'kg'
}

export function sumPieceVolumetricWeights(
  rows?: Array<{ volumetricWeight?: number | null }> | null,
): number {
  return Math.round(
    (rows ?? []).reduce(
      (sum, row) => sum + (Number(row.volumetricWeight) || 0),
      0,
    ),
  )
}

/** Match backend: declared vol → piece sum → actual weight. */
export function resolveShipmentVolumetricWeight(
  declaredVolumetric: number,
  actualWeight: number,
  pieceVolumetricSum: number,
): number {
  if (declaredVolumetric > 0) return declaredVolumetric
  if (pieceVolumetricSum > 0) return pieceVolumetricSum
  if (actualWeight > 0) return actualWeight
  return 0
}
