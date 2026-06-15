export type ProductWeightUnit = 'G' | 'KG'

export function isProductWeightInGrams(
  unit: ProductWeightUnit | string | null | undefined,
): boolean {
  return String(unit ?? 'KG').toUpperCase() === 'G'
}

/** Normalize a weight value in the product's native booking unit. */
export function normalizeProductBookingWeight(
  value: number,
  unit: ProductWeightUnit | string,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  if (isProductWeightInGrams(unit)) {
    return Math.round(value)
  }
  const baseKg = Math.floor(value)
  const fraction = value - baseKg
  const ceiled = fraction > 0.1 ? baseKg + 1 : value
  return Math.round(ceiled * 100) / 100
}

/** Stored booking weight → kg for L×B×H divisor math. */
export function productBookingWeightToKg(
  value: number,
  unit: ProductWeightUnit | string,
): number {
  if (!Number.isFinite(value)) return 0
  return isProductWeightInGrams(unit) ? value / 1000 : value
}

/** Kg from volumetric formula → product storage unit. */
export function kgToProductBookingWeight(
  kg: number,
  unit: ProductWeightUnit | string,
): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  if (isProductWeightInGrams(unit)) {
    return Math.round(kg * 1000)
  }
  return normalizeProductBookingWeight(kg, unit)
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
