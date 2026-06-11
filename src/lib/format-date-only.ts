/** Format date-only API values (UTC midnight) without local timezone shift. */
export function formatDateOnlyDdMmYyyy(
    value: string | Date | null | undefined,
    fallback = "—",
): string {
    if (value == null || value === "") return fallback;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return fallback;
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
