/** Human-readable label for `ShipmentStatusType` enum strings. */
export function formatShipmentStatusLabel(code: string | null | undefined): string {
    if (!code) return "—"
    return code.replace(/_/g, " ")
}
