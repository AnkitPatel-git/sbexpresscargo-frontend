const GENERIC =
    "Something went wrong. Please try again or contact support."
const NOT_COMPLETED =
    "This request could not be completed. Please check the details or contact support."

const FIELD_LABELS: Record<string, string> = {
    serviceCenterId: "Service center",
    customerId: "Customer",
    productId: "Product",
    shipperId: "Shipper",
    consigneeId: "Consignee",
    shipmentTotalValue: "Invoice value",
    bookDate: "Booking date",
    actualWeight: "Actual weight",
    volumetricWeight: "Volumetric weight",
    floorCount: "Floor count",
    floorDelivery: "floor delivery",
    codAmount: "COD amount",
    isCod: "COD",
    ewaybillNumber: "E-waybill number",
    pinCodeId: "Pincode",
    fromZoneId: "Pickup zone",
    toZoneId: "Delivery zone",
}

const AUTH_MESSAGE =
    /session expired|session no longer valid|please login again|logged in on another device|unauthorized|invalid token|jwt expired|invalid credentials/i

const SENSITIVE =
    /\b(vendor|vendors|freight|rate|rates|baseFreight|chargeWeight|charge weight|prisma|sql|constraint|fkey|stacktrace|stack trace|secret|password|api[_ ]?key|bearer)\b|P20\d{2}|\/Users\/|\/home\/|node_modules|invocation|ECONN|ENOTFOUND|ETIMEDOUT|Unknown field|Invalid `prisma|allowed values:|invalid value for "|unknown argument|missing required value for "|non-JSON|API server is running|localhost/i

const INTERNAL_SETUP =
    /volumetric cft|not configured|fuel surcharge|service map/i

function rewriteFieldNames(part: string): string {
    let next = part.trim()
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
        next = next.replace(new RegExp(`\\b${field}\\b`, "g"), label)
    }
    return next.replace(/\s+/g, " ").replace(/\.$/, "").trim()
}

/** Plain message for a customer login. Rate, vendor, and database text is removed. */
export function toCustomerErrorMessage(message: string, status?: number): string {
    const trimmed = (message ?? "").trim()
    if (status != null && status >= 500) return GENERIC
    if (!trimmed) return GENERIC
    if (AUTH_MESSAGE.test(trimmed)) return trimmed
    if (SENSITIVE.test(trimmed) || INTERNAL_SETUP.test(trimmed)) return NOT_COMPLETED

    const rewritten = trimmed
        .split(/,\s*/)
        .map(rewriteFieldNames)
        .filter(Boolean)
        .join(". ")

    if (!rewritten || rewritten.length > 280 || SENSITIVE.test(rewritten)) {
        return NOT_COMPLETED
    }
    return rewritten
}

/** Keep staff messages unchanged. Customer logins get the plain version. */
export function presentCustomerError(message: string, status?: number): string {
    if (typeof window === "undefined") return message
    try {
        const raw = localStorage.getItem("user")
        if (!raw) return message
        const parsed = JSON.parse(raw) as { role?: { identifier?: string } }
        if (parsed?.role?.identifier !== "CUSTOMER") return message
        return toCustomerErrorMessage(message, status)
    } catch {
        return message
    }
}
