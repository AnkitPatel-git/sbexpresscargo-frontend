import * as z from "zod";

/**
 * Master record codes (productCode, vendorCode, etc.): leave blank and the backend
 * may auto-generate. If the user types a value, it must meet minimum length.
 */
export function optionalMasterCode(minLen: number) {
  return z.string().refine(
    (s) => {
      const t = s.trim();
      return t.length === 0 || t.length >= minLen;
    },
    { message: `Must be at least ${minLen} characters when provided` },
  );
}

/** Drop string keys that are empty/whitespace so the API can assign codes. */
export function omitEmptyCodeFields<T extends object>(data: T, keys: (keyof T)[]): T {
  const out = { ...data } as T;
  for (const k of keys) {
    const v = out[k];
    if (typeof v === "string" && v.trim() === "") {
      delete (out as Record<string, unknown>)[k as string];
    }
  }
  return out;
}
