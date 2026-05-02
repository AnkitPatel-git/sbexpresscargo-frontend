import { redirect } from "next/navigation";

export default function EditClientRateRedirectPage() {
  redirect("/masters/rates?contract=customer");
}
