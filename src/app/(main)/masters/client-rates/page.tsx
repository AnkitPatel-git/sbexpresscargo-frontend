import { redirect } from "next/navigation";

/** Legacy URL; Client Rate Master API was removed — use Rate Master. */
export default function ClientRatesRedirectPage() {
  redirect("/masters/rates");
}
