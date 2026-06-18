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
