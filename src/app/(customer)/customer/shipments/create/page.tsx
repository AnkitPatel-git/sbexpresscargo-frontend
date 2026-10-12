"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { consigneeService } from "@/services/masters/consignee-service";
import { contentService } from "@/services/masters/content-service";
import { customerService } from "@/services/masters/customer-service";
import { productService } from "@/services/masters/product-service";
import { shipperService } from "@/services/masters/shipper-service";
import { shipmentService } from "@/services/transactions/shipment-service";

const PAYMENT_TYPES = [
  { value: "CREDIT", label: "Credit" },
  { value: "CASH", label: "Cash" },
  { value: "TO_PAY", label: "To pay" },
];

export default function CustomerBookShipmentPage() {
  const router = useRouter();
  const { effectiveCustomerIds, defaultCustomerId } = useAuth();
  const [customerId, setCustomerId] = useState(defaultCustomerId ? String(defaultCustomerId) : "");
  const [shipperId, setShipperId] = useState("");
  const [consigneeId, setConsigneeId] = useState("");
  const [productId, setProductId] = useState("");
  const [contentId, setContentId] = useState("");
  const [paymentType, setPaymentType] = useState("CREDIT");
  const [bookDate, setBookDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [referenceNo, setReferenceNo] = useState("");
  const [boxes, setBoxes] = useState("1");
  const [actualWeight, setActualWeight] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [ewaybillNumber, setEwaybillNumber] = useState("");

  const selectedCustomerId = Number(customerId) > 0 ? Number(customerId) : undefined;

  const { data: customersResp } = useQuery({
    queryKey: ["customer-booking-accounts"],
    queryFn: () => customerService.getCustomers({ page: 1, limit: 100, status: "ACTIVE" }),
    enabled: effectiveCustomerIds.length > 1,
  });

  const { data: shippersResp } = useQuery({
    queryKey: ["customer-booking-shippers"],
    queryFn: () => shipperService.getShippers({ page: 1, limit: 100 }),
  });
  const { data: consigneesResp } = useQuery({
    queryKey: ["customer-booking-consignees"],
    queryFn: () => consigneeService.getConsignees({ page: 1, limit: 100 }),
  });
  const { data: productsResp } = useQuery({
    queryKey: ["customer-booking-products"],
    queryFn: () => productService.getProducts({ page: 1, limit: 100, status: "ACTIVE" }),
  });
  const { data: contentsResp } = useQuery({
    queryKey: ["customer-booking-contents"],
    queryFn: () => contentService.getContents({ page: 1, limit: 100 }),
  });

  const accounts = useMemo(() => {
    const rows = customersResp?.data ?? [];
    return rows.filter((row) => effectiveCustomerIds.includes(row.id));
  }, [customersResp?.data, effectiveCustomerIds]);

  const save = useMutation({
    mutationFn: () => {
      if (!selectedCustomerId) throw new Error("Select an account");
      if (!shipperId || !consigneeId || !productId || !contentId) {
        throw new Error("Shipper, consignee, product, and content are required");
      }
      const weight = Number(actualWeight);
      const pieceCount = Number(boxes);
      if (!(weight > 0) || !(pieceCount > 0)) {
        throw new Error("Boxes and actual weight must be greater than 0");
      }
      return shipmentService.createShipment({
        bookDate,
        customerId: selectedCustomerId,
        clientId: selectedCustomerId,
        shipperId: Number(shipperId),
        consigneeId: Number(consigneeId),
        productId: Number(productId),
        paymentType,
        referenceNo: referenceNo.trim() || undefined,
        actualWeight: weight,
        invoiceNumber: invoiceNumber.trim() || undefined,
        shipmentTotalValue: invoiceAmount.trim() ? Number(invoiceAmount) : undefined,
        ewaybillNumber: ewaybillNumber.trim() || undefined,
        piecesRows: [
          {
            pieces: pieceCount,
            actualWeight: weight,
            items: [{ contentId: Number(contentId), quantity: pieceCount }],
          },
        ],
      } as never);
    },
    onSuccess: (response) => {
      toast.success("Shipment booked");
      const id = response?.data?.id;
      router.push(id ? `/customer/shipments/${id}` : "/customer/shipments");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to book shipment"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Book shipment</h1>
        <p className="text-sm text-muted-foreground">Rates and vendor details stay with the operations team.</p>
      </div>
      <form
        className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        {effectiveCustomerIds.length > 1 ? (
          <label className="space-y-1 text-sm">
            <span>Account</span>
            <select className="h-9 w-full rounded-md border px-2" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>
              <option value="">Select account</option>
              {(accounts.length > 0 ? accounts : effectiveCustomerIds.map((id) => ({ id, name: `Customer ${id}`, code: "" }))).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code ? `${account.code} - ${account.name}` : account.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="space-y-1 text-sm">
          <span>Book date</span>
          <Input type="date" value={bookDate} onChange={(event) => setBookDate(event.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Shipper</span>
          <select className="h-9 w-full rounded-md border px-2" value={shipperId} onChange={(event) => setShipperId(event.target.value)} required>
            <option value="">Select shipper</option>
            {(shippersResp?.data ?? []).map((shipper) => (
              <option key={shipper.id} value={shipper.id}>
                {shipper.shipperName || shipper.shipperCode}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Consignee</span>
          <select className="h-9 w-full rounded-md border px-2" value={consigneeId} onChange={(event) => setConsigneeId(event.target.value)} required>
            <option value="">Select consignee</option>
            {(consigneesResp?.data ?? []).map((consignee) => (
              <option key={consignee.id} value={consignee.id}>
                {consignee.name || consignee.code}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Product</span>
          <select className="h-9 w-full rounded-md border px-2" value={productId} onChange={(event) => setProductId(event.target.value)} required>
            <option value="">Select product</option>
            {(productsResp?.data ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.productName}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Content</span>
          <select className="h-9 w-full rounded-md border px-2" value={contentId} onChange={(event) => setContentId(event.target.value)} required>
            <option value="">Select content</option>
            {(contentsResp?.data ?? []).map((content: { id: number; contentName?: string; contentCode?: string }) => (
              <option key={content.id} value={content.id}>
                {content.contentName || content.contentCode}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Payment</span>
          <select className="h-9 w-full rounded-md border px-2" value={paymentType} onChange={(event) => setPaymentType(event.target.value)}>
            {PAYMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Reference no.</span>
          <Input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span>No. of boxes</span>
          <Input type="number" min="1" value={boxes} onChange={(event) => setBoxes(event.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Actual weight</span>
          <Input type="number" min="0.01" step="0.01" value={actualWeight} onChange={(event) => setActualWeight(event.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Invoice no.</span>
          <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Invoice amount</span>
          <Input type="number" min="0" step="0.01" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span>E-waybill no.</span>
          <Input value={ewaybillNumber} onChange={(event) => setEwaybillNumber(event.target.value)} />
        </label>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Booking..." : "Book shipment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
