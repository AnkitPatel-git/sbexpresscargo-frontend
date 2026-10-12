import { redirect } from "next/navigation";

export default function CustomerShipmentsRedirect() {
  redirect("/transactions/shipment");
}
