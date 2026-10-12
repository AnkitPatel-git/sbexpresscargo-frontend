import { redirect } from "next/navigation";

export default async function CustomerShipmentRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/transactions/shipment/${id}`);
}
