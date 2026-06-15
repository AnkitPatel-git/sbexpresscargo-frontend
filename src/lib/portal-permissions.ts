/** Master list/detail APIs: `master.<subModule>.read` */
export const MASTER_READ = {
  customer: "master.customer.read",
  product: "master.product.read",
  shipper: "master.shipper.read",
  consignee: "master.consignee.read",
  content: "master.content.read",
  vendor: "master.vendor.read",
  serviceCenter: "master.service_center.read",
  serviceMap: "master.service_map.read",
  zone: "master.zone.read",
} as const;

/** Shipment APIs used for booking-screen master lookups (no Masters nav). */
export const SHIPMENT_CORE = {
  read: "shipment.core.read",
  create: "shipment.core.create",
  update: "shipment.core.update",
} as const;

export const TRANSACTION_SHIPMENT = {
  read: "transaction.shipment.read",
  create: "transaction.shipment.create",
  update: "transaction.shipment.update",
} as const;

/** Portal nav/buttons: accept legacy transaction.* or API shipment.core.* (Operations role). */
export const SHIPMENT_BOOKING_PORTAL = {
  read: [TRANSACTION_SHIPMENT.read, SHIPMENT_CORE.read] as const,
  create: [TRANSACTION_SHIPMENT.create, SHIPMENT_CORE.create] as const,
  update: [TRANSACTION_SHIPMENT.update, SHIPMENT_CORE.update] as const,
};

/** Alternate permissions that may load master dropdowns without master nav access. */
const PORTAL_TRANSACTION_MASTER_LOOKUP = [
  SHIPMENT_CORE.read,
  SHIPMENT_CORE.create,
  SHIPMENT_CORE.update,
  "shipment.tracking.read",
  TRANSACTION_SHIPMENT.read,
  TRANSACTION_SHIPMENT.create,
  TRANSACTION_SHIPMENT.update,
  "transaction.tracking.read",
  "transaction.tracking.update",
  "transaction.tracking.all",
  "transaction.manifest.read",
  "transaction.manifest.create",
  "transaction.manifest.update",
  "transaction.manifest.all",
  "transaction.pod.read",
  "transaction.pod.all",
  "transaction.customer_payment.read",
  "transaction.customer_payment.create",
  "transaction.customer_payment.update",
  "transaction.customer_payment.all",
  "report.mis.read",
  "report.dp_batch.read",
  "report.attendance.read",
  "dashboard.core.read",
] as const;

/**
 * True when user may load a master dropdown on transaction/report screens
 * without master module nav access.
 */
export function hasMasterLookupForPortalTransaction(
  hasPermission: (permission: string) => boolean,
  masterReadPermission: string,
): boolean {
  if (hasPermission(masterReadPermission)) return true;
  return PORTAL_TRANSACTION_MASTER_LOOKUP.some(hasPermission);
}

/** @deprecated Use {@link hasMasterLookupForPortalTransaction}. */
export const hasMasterLookupForShipmentBooking = hasMasterLookupForPortalTransaction;

export const UTILITY_READ = {
  serviceablePincode: "utility.serviceable_pincode.read",
} as const;

/** Shipment commercial / charge calculator (separate from shipment.core.*). */
export const SHIPMENT_CHARGE = {
  read: "shipment.charge.read",
  calculate: "shipment.charge.calculate",
} as const;

export function isSuperAdminRole(roleIdentifier?: string | null): boolean {
  const id = roleIdentifier?.toUpperCase();
  return id === "SUPER_ADMIN" || id === "SUPERUSER";
}

export function hasPortalPermission(
  permissions: string[] | undefined,
  roleIdentifier: string | undefined,
  permission: string,
): boolean {
  if (isSuperAdminRole(roleIdentifier)) return true;
  return permissions?.includes(permission) ?? false;
}
