import * as z from "zod"

const PINCODE_REGEX = /^\d{6}$/

type PincodeSource = {
    pinCodeId?: number | null
    serviceablePincode?: {
        pinCode?: string | null
    } | null
}

export function normalizePincodeInput(value: string): string {
    return value.replace(/\D/g, "").slice(0, 6)
}

export function getInitialPincode(source?: PincodeSource | null): string {
    const fromRelation = source?.serviceablePincode?.pinCode?.trim() || ""
    if (PINCODE_REGEX.test(fromRelation)) return fromRelation

    const fallback = source?.pinCodeId != null ? String(source.pinCodeId).trim() : ""
    return PINCODE_REGEX.test(fallback) ? fallback : ""
}

export function requiredPincodeField(message = "Pin code is required") {
    return z
        .string()
        .trim()
        .min(1, message)
        .regex(PINCODE_REGEX, "Pin code must be 6 digits")
}

export function optionalPincodeField() {
    return z
        .string()
        .trim()
        .refine((value) => value === "" || PINCODE_REGEX.test(value), {
            message: "Pin code must be 6 digits",
        })
        .optional()
        .nullable()
}

export function normalizeOptionalPincode(value?: string | null): string | undefined {
    const trimmed = value?.trim() ?? ""
    return trimmed === "" ? undefined : trimmed
}
