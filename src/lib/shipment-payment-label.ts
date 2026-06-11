/** Display label for COD / To Pay shipment payment mode. */
export const SHIPMENT_COD_TOPAY_LABEL = "COD/To Pay";

export const SHIPMENT_COD_TOPAY_AMOUNT_LABEL = "COD/To Pay Amount";

export function formatShipmentPaymentTypeLabel(
  paymentType: string | null | undefined,
): string {
  const normalized = (paymentType ?? "").trim().toUpperCase();
  if (!normalized) return "—";
  if (normalized === "CREDIT") return "Credit";
  if (normalized === "CASH") return "Cash";
  if (normalized === "TO_PAY") return SHIPMENT_COD_TOPAY_LABEL;
  return normalized.replace(/_/g, " ");
}
