import type { ServiceablePincodeZone } from "@/types/utilities/serviceable-pincode";

/** First zone is the most recently mapped (API returns zones sorted by mapping id desc). */
export function pickPincodeZone(
  zones: ServiceablePincodeZone[] | null | undefined,
): { zoneId: number; label: string } | null {
  const zone = zones?.[0];
  if (!zone?.id) return null;
  const label = zone.name?.trim() || zone.code?.trim() || `Zone #${zone.id}`;
  return { zoneId: zone.id, label };
}

export function pincodeZoneMissingMessage(party: "shipper" | "consignee"): string {
  return `${party === "shipper" ? "Shipper" : "Consignee"} pincode doesn't have zone`;
}
