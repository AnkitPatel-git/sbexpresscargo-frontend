import { redirect } from "next/navigation";

export default function CustomerBookShipmentRedirect() {
  redirect("/transactions/shipment/create");
}
