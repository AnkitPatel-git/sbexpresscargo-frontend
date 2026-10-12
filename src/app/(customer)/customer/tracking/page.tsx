import { redirect } from "next/navigation";

export default function CustomerTrackingRedirect() {
  redirect("/transactions/tracking");
}
