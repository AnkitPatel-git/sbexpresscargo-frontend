/** Standard GST applied on the shipment total amount (18%). */
export const GST_RATE = 0.18;

/** GST percentage for display/labels (e.g. "GST (18%)"). */
export const GST_PERCENT = GST_RATE * 100;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** GST amount (18%) for a given total. Returns 0 for non-finite/zero totals. */
export function gstOnTotal(total?: number | string | null): number {
  const numeric = Number(total);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return round2(numeric * GST_RATE);
}

/** Grand total (total + 18% GST) for a given total. */
export function grandTotalWithGst(total?: number | string | null): number {
  const numeric = Number(total);
  if (!Number.isFinite(numeric)) return 0;
  return round2(numeric + gstOnTotal(numeric));
}
