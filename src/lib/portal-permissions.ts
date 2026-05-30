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
