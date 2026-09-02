/** ShipmentStatusType values — keep in sync with backend Prisma enum. */
export const SHIPMENT_STATUS_OPTIONS = [
    { label: "Booked", value: "BOOKED" },
    { label: "Manifested", value: "MANIFESTED" },
    { label: "Picked up", value: "PICKED_UP" },
    { label: "Pickup failed", value: "PICKUP_FAILED" },
    { label: "In transit", value: "IN_TRANSIT" },
    { label: "Paper work inscan", value: "PAPER_WORK_INSCAN" },
    { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Delivery attempted (NDR)", value: "DELIVERY_ATTEMPTED" },
    { label: "Partial delivered", value: "PARTIAL_DELIVERED" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Lost", value: "LOST" },
    { label: "Return in transit", value: "RETURN_IN_TRANSIT" },
    { label: "Return out for delivery", value: "RETURN_OUT_FOR_DELIVERY" },
    { label: "Returned (RTO complete)", value: "RETURNED" },
] as const;
