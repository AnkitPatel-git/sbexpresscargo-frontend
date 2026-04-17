/** Single source for the browser-facing API root. Next rewrites `/api/*` to the backend. */
export const API_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "/api";

export function bearerHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}
