/** URL `contract` for rate master list / create flows (sidebar + filters). */
export type RateMasterContract = "customer" | "vendor";

export function parseRateContractParam(value: string | null): RateMasterContract {
  return value === "vendor" ? "vendor" : "customer";
}

export function rateMasterListPath(contract: RateMasterContract): string {
  return contract === "vendor"
    ? "/masters/rates?contract=vendor"
    : "/masters/rates?contract=customer";
}

/** Default list filter `updateType` per contract (user can change in filters dialog). */
export function defaultRateListUpdateType(contract: RateMasterContract): string {
  return contract === "vendor" ? "VENDOR_RATE" : "AWB_ENTRY_RATE";
}

export function isVendorRateMasterRow(row: {
  updateType?: string | null;
  vendorId?: number | null;
}): boolean {
  const vid = row.vendorId != null && Number(row.vendorId) > 0;
  const ut = row.updateType;
  return (
    vid ||
    ut === "VENDOR_RATE" ||
    ut === "VENDOR_OBC_RATE"
  );
}

/** Which Masters flyout section should open for the current path + rate list `contract` query. */
export function resolveMastersNavSection(
  path: string,
  contractParam: string | null,
): "sales" | "customer" | "vendor" | "operations" {
  if (path === "/masters/rates" || path.startsWith("/masters/rates/")) {
    return parseRateContractParam(contractParam) === "vendor" ? "vendor" : "customer";
  }
  if (
    path.startsWith("/masters/customers") ||
    path.startsWith("/masters/customer-groups") ||
    path.startsWith("/masters/client-rates") ||
    path.startsWith("/masters/consignee") ||
    path.startsWith("/masters/shipper")
  ) {
    return "customer";
  }
  if (path.startsWith("/masters/vendor") || path.startsWith("/masters/service-map")) {
    return "vendor";
  }
  if (
    path.startsWith("/masters/exception") ||
    path.startsWith("/masters/vehicle") ||
    path.startsWith("/masters/courier")
  ) {
    return "operations";
  }
  return "sales";
}

/** Active state for sidebar links (handles `/masters/rates?contract=` vs create/edit). */
export function masterNavItemActive(
  pathname: string,
  contractParam: string | null,
  href: string,
): boolean {
  try {
    const u = new URL(href, "http://local");
    const itemPath = u.pathname;
    if (itemPath === "/masters/rates") {
      const onRates = pathname === "/masters/rates" || pathname.startsWith("/masters/rates/");
      if (!onRates) return false;
      const wantVendor = u.searchParams.get("contract") === "vendor";
      const curVendor = parseRateContractParam(contractParam) === "vendor";
      return wantVendor === curVendor;
    }
    const pathNoQuery = href.split("?")[0];
    return pathname === pathNoQuery || pathname.startsWith(`${pathNoQuery}/`);
  } catch {
    const pathNoQuery = href.split("?")[0];
    return pathname === pathNoQuery || pathname.startsWith(`${pathNoQuery}/`);
  }
}
