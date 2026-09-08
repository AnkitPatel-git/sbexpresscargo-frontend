import { SHIPMENT_STATUS_OPTIONS } from "@/lib/shipment-status-options"

/** Human-readable label for `ShipmentStatusType` enum strings. */
export function formatShipmentStatusLabel(code: string | null | undefined): string {
    if (!code) return "—"
    const hit = SHIPMENT_STATUS_OPTIONS.find((option) => option.value === code)
    if (hit) return hit.label
    return code.replace(/_/g, " ")
}
