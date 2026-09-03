/** India (Asia/Kolkata) date-only helpers. Calendar dates are stored as UTC midnight. */
export const INDIA_TIMEZONE = "Asia/Kolkata";

export function getTodayIndiaYyyyMmDd(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: INDIA_TIMEZONE }).format(now);
}

export function toDateInputValue(
    value?: string | null,
    fallback = getTodayIndiaYyyyMmDd(),
): string {
    return value?.split("T")[0] || fallback;
}

export function toOptionalDateInputValue(value?: string | null): string {
    return value?.split("T")[0] ?? "";
}

/** Format an instant as `dd MMM yyyy, HH:mm` in Asia/Kolkata. */
export function formatIndiaDateTime(
    value: string | Date | null | undefined,
    fallback = "—",
): string {
    if (value == null || value === "") return fallback;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: INDIA_TIMEZONE,
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";
    return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}

/** Format `HH:mm` in Asia/Kolkata. Accepts stored HH:mm or an ISO instant. */
export function formatIndiaTime(
    value: string | Date | null | undefined,
    fallback = "—",
): string {
    if (value == null || value === "") return fallback;
    const trimmed = String(value).trim();
    const hhmm = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (hhmm) {
        return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
    }
    const date = value instanceof Date ? value : new Date(trimmed);
    if (Number.isNaN(date.getTime())) return fallback;
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: INDIA_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? "";
    return `${get("hour")}:${get("minute")}`;
}

/**
 * Treat a datetime-local / naive `YYYY-MM-DDTHH:mm` value as Mumbai wall clock.
 */
export function naiveDateTimeToIndiaIso(value: string): string {
    const trimmed = value.trim();
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        return new Date(trimmed).toISOString();
    }
    const withSeconds =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
            ? `${trimmed}:00`
            : trimmed;
    return new Date(`${withSeconds}+05:30`).toISOString();
}
