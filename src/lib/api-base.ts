/** Single source for API root (matches Bruno `baseUrl`, e.g. `http://localhost:3001/api`). */
export const API_BASE_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:3000/api";

export function bearerHeaders(json = true): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : ""}`,
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}
