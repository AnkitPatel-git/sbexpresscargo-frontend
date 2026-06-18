/** Format date-only API values (IST calendar dates stored as UTC midnight). */
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

/** Report display format: dd-mm-yyyy */
export function formatReportDate(
    value: string | Date | null | undefined,
    fallback = "—",
): string {
    if (value == null || value === "") return fallback;
    const raw = String(value).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
    const formatted = formatDateOnlyDdMmYyyy(value, "");
    if (!formatted) return fallback;
    return formatted.replace(/\//g, "-");
}

/** Report display format for timestamps: dd-mm-yyyy HH:mm (IST). */
export function formatReportDateTime(
    value: string | Date | null | undefined,
    fallback = "—",
): string {
    if (value == null || value === "") return fallback;
    const raw = String(value).trim();
    if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/.test(raw)) return raw;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return fallback;
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";
    return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")}`;
}
