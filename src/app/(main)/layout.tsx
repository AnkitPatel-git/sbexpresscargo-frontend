"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Package2,
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  Layers,
  Map as MapIcon,
  Globe,
  Landmark,
  Building2,
  Box,
  Package,
  Building,
  MapPin,
  UserRound,
  Percent,
  AlertTriangle,
  Truck,
  Coins,
  Wrench,
  Calculator,
  Home,
  Search,
  Maximize,
  Bell,
  Info,
  Star,
  Wallet,
  FileText,
  ArrowLeftRight,
  BarChart3,
  Menu,
  ClipboardList,
  Car,
  Bike,
  Navigation,
  CheckSquare,
  CreditCard,
  Receipt,
  RefreshCw,
  Banknote,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarContentProps {
  pathname: string;
  isCollapsed?: boolean;
  onItemClick?: () => void;
}

const headerNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/masters/products", label: "Product" },
  { href: "/masters/zones", label: "Zone" },
  { href: "/utilities/serviceable-pincodes", label: "Serviceable Pincode" },
  { href: "/masters/countries", label: "Country" },
  { href: "/masters/states", label: "State Master" },
  { href: "/masters/contents", label: "Content Master" },
  { href: "/masters/banks", label: "Bank Master" },
  { href: "/masters/local-branches", label: "Local Branch Master" },
  { href: "/masters/service-centers", label: "Service Center Master" },
  { href: "/masters/customers", label: "Customer Master" },
  { href: "/masters/rates", label: "Rate Master" },
  { href: "/masters/consignee", label: "Consignee Master" },
  { href: "/masters/shipper", label: "Shipper Master" },
  { href: "/masters/vendor", label: "Vendor Master" },
  { href: "/masters/service-map", label: "Service Map Master" },
  { href: "/masters/exception", label: "Exception Master" },
  { href: "/masters/charge", label: "Charge Master" },
  { href: "/masters/vehicle", label: "Vehicle Master" },
  { href: "/masters/courier", label: "Courier Master" },
  { href: "/masters/vendor-config", label: "Vendor Config Master" },
  { href: "/transactions/shipment", label: "Shiment Booking" },
  { href: "/transactions/manifest", label: "Manifest" },
  { href: "/transactions/drs", label: "DRS" },
  { href: "/transactions/tracking", label: "Tracking" },
  { href: "/transactions/pod", label: "POD" },
  { href: "/transactions/customer-payment", label: "Customer Payment" },
  { href: "/transactions/receipt", label: "Receipts" },
  { href: "/document/invoice-generation", label: "Invoice Generation" },
  { href: "/document/invoice-print", label: "Invoice Print" },
  { href: "/document/invoice-finalise", label: "Invoice Finalise" },
  { href: "/profile", label: "Profile" },
  { href: "/change-password", label: "Change Password" },
  { href: "/utilities/users/user-setup", label: "User Setup" },
  { href: "/utilities/users/access-rights", label: "Access Rights" },
  { href: "/utilities/users/logged-in-users", label: "LoggedIn Users" },
  { href: "/utilities/permissions", label: "Permissions" },
  { href: "/utilities/roles", label: "Roles" },
];

const MASTER_GROUP_ITEMS = {
  sales: [
    {
      href: "/masters/products",
      label: "Product",
      icon: Box,
      permission: "master.product.read",
    },
    {
      href: "/masters/countries",
      label: "Country",
      icon: Globe,
      permission: "master.country.read",
    },
    {
      href: "/masters/states",
      label: "State",
      icon: Landmark,
      permission: "master.state.read",
    },
    {
      href: "/masters/zones",
      label: "Zone",
      icon: MapIcon,
      permission: "master.area.read",
    },
    {
      href: "/utilities/serviceable-pincodes",
      label: "Serviceable Pincode",
      icon: Search,
      permission: "utility.serviceable_pincode.read",
    },
    {
      href: "/masters/contents",
      label: "Content",
      icon: Package,
      permission: "master.content.read",
    },
    {
      href: "/masters/banks",
      label: "Bank",
      icon: Building,
      permission: "master.bank.read",
    },
    {
      href: "/masters/local-branches",
      label: "Local Branch",
      icon: MapPin,
      permission: "master.local_branch.read",
    },
    {
      href: "/masters/service-centers",
      label: "Service Center",
      icon: Settings,
      permission: "master.service_center.read",
    },
    {
      href: "/masters/charge",
      label: "Charge",
      icon: Coins,
      permission: "master.charge.read",
    },
  ],
  customer: [
    {
      href: "/masters/customers",
      label: "Customer",
      icon: UserRound,
      permission: "master.customer.read",
    },
    {
      href: "/masters/rates",
      label: "Rate",
      icon: Percent,
      permission: "master.rate.read",
    },
    {
      href: "/masters/consignee",
      label: "Consignee",
      icon: UserRound,
      permission: "master.consignee.read",
    },
    {
      href: "/masters/shipper",
      label: "Shipper",
      icon: UserRound,
      permission: "master.shipper.read",
    },
  ],
  vendor: [
    {
      href: "/masters/vendor",
      label: "Vendor",
      icon: Building2,
      permission: "master.vendor.read",
    },
    {
      href: "/masters/service-map",
      label: "Service Map",
      icon: MapIcon,
      permission: "master.service_map.read",
    },
    {
      href: "/masters/vendor-config",
      label: "Vendor Config",
      icon: Settings,
      permission: "master.vendor_config.read",
    },
  ],
  operations: [
    {
      href: "/masters/exception",
      label: "Exception",
      icon: AlertTriangle,
      permission: "master.exception.read",
    },
    {
      href: "/masters/vehicle",
      label: "Vehicle",
      icon: Truck,
      permission: "master.vehicle.read",
    },
    {
      href: "/masters/courier",
      label: "Courier",
      icon: Bike,
      permission: "master.courier.read",
    },
  ],
} as const;

const resolveMasterGroupFromPath = (
  path: string,
): "sales" | "customer" | "vendor" | "operations" => {
  if (
    path.startsWith("/masters/customers") ||
    path.startsWith("/masters/rates") ||
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
};

const SidebarContent = ({
  pathname,
  isCollapsed = false,
  onItemClick,
}: SidebarContentProps) => {
  const collapsedSubmenuScrollClass = "max-h-[20rem] overflow-y-auto pr-1";
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(
    !isCollapsed && pathname.startsWith("/document"),
  );
  const [isReportsOpen, setIsReportsOpen] = useState(
    !isCollapsed && pathname.startsWith("/report"),
  );
  const [isMastersOpen, setIsMastersOpen] = useState(
    !isCollapsed && pathname.startsWith("/masters"),
  );
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(
    !isCollapsed && pathname.startsWith("/utilities"),
  );
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(
    !isCollapsed && pathname.startsWith("/transactions"),
  );
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isCustomerSubmenuOpen, setIsCustomerSubmenuOpen] = useState(false);
  const [isVendorSubmenuOpen, setIsVendorSubmenuOpen] = useState(false);
  const [isOperationSubmenuOpen, setIsOperationSubmenuOpen] = useState(false);
  const [isUsersSubmenuOpen, setIsUsersSubmenuOpen] = useState(false);
  const [mastersHovered, setMastersHovered] = useState(false);
  const [transactionsHovered, setTransactionsHovered] = useState(false);
  const [documentsHovered, setDocumentsHovered] = useState(false);
  const [reportsHovered, setReportsHovered] = useState(false);
  const [utilitiesHovered, setUtilitiesHovered] = useState(false);
  const closeDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isCollapsed) return;
    setIsDocumentsOpen(pathname.startsWith("/document"));
    setIsReportsOpen(pathname.startsWith("/report"));
    setIsMastersOpen(pathname.startsWith("/masters"));
    setIsUtilitiesOpen(pathname.startsWith("/utilities"));
    setIsTransactionsOpen(pathname.startsWith("/transactions"));
    if (pathname.startsWith("/masters")) {
      const section = resolveMasterGroupFromPath(pathname);
      setIsSalesOpen(section === "sales");
      setIsCustomerSubmenuOpen(section === "customer");
      setIsVendorSubmenuOpen(section === "vendor");
      setIsOperationSubmenuOpen(section === "operations");
    } else {
      setIsSalesOpen(false);
      setIsCustomerSubmenuOpen(false);
      setIsVendorSubmenuOpen(false);
      setIsOperationSubmenuOpen(false);
    }
    setIsUsersSubmenuOpen(pathname.startsWith("/utilities/users"));
  }, [pathname, isCollapsed]);

  useEffect(() => {
    return () => {
      if (closeDelayRef.current) clearTimeout(closeDelayRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isCollapsed) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!navRef.current) return;
      const target = event.target as Node | null;
      if (target && navRef.current.contains(target)) return;
      setIsMastersOpen(false);
      setIsTransactionsOpen(false);
      setIsDocumentsOpen(false);
      setIsReportsOpen(false);
      setIsUtilitiesOpen(false);
      setMastersHovered(false);
      setTransactionsHovered(false);
      setDocumentsHovered(false);
      setReportsHovered(false);
      setUtilitiesHovered(false);
      setIsSalesOpen(false);
      setIsCustomerSubmenuOpen(false);
      setIsVendorSubmenuOpen(false);
      setIsOperationSubmenuOpen(false);
      setIsUsersSubmenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCollapsed]);

  const clearCloseDelay = () => {
    if (closeDelayRef.current) {
      clearTimeout(closeDelayRef.current);
      closeDelayRef.current = null;
    }
  };

  const scheduleClose = (cb: () => void) => {
    clearCloseDelay();
    closeDelayRef.current = setTimeout(cb, 260);
  };

  function closeAllCollapsedMenus() {
    setIsMastersOpen(false);
    setIsTransactionsOpen(false);
    setIsDocumentsOpen(false);
    setIsReportsOpen(false);
    setIsUtilitiesOpen(false);
    setMastersHovered(false);
    setTransactionsHovered(false);
    setDocumentsHovered(false);
    setReportsHovered(false);
    setUtilitiesHovered(false);
    setIsSalesOpen(false);
    setIsCustomerSubmenuOpen(false);
    setIsVendorSubmenuOpen(false);
    setIsOperationSubmenuOpen(false);
    setIsUsersSubmenuOpen(false);
  }

  useEffect(() => {
    if (!isCollapsed) return;
    // Prevent auto-open flyouts when toggling sidebar to collapsed mode.
    closeAllCollapsedMenus();
  }, [isCollapsed]);

  const toggleMasterSubmenu = (
    section: "sales" | "customer" | "vendor" | "operations",
  ) => {
    const current = {
      sales: isSalesOpen,
      customer: isCustomerSubmenuOpen,
      vendor: isVendorSubmenuOpen,
      operations: isOperationSubmenuOpen,
    }[section];

    // Close all first (accordion behavior)
    setIsSalesOpen(false);
    setIsCustomerSubmenuOpen(false);
    setIsVendorSubmenuOpen(false);
    setIsOperationSubmenuOpen(false);

    // Toggle selected section
    if (!current) {
      if (section === "sales") setIsSalesOpen(true);
      if (section === "customer") setIsCustomerSubmenuOpen(true);
      if (section === "vendor") setIsVendorSubmenuOpen(true);
      if (section === "operations") setIsOperationSubmenuOpen(true);
    }
  };

  function openMasterSubmenu(
    section: "sales" | "customer" | "vendor" | "operations",
  ) {
    setIsSalesOpen(section === "sales");
    setIsCustomerSubmenuOpen(section === "customer");
    setIsVendorSubmenuOpen(section === "vendor");
    setIsOperationSubmenuOpen(section === "operations");
  }

  const openSingleSection = (
    section: "masters" | "transactions" | "documents" | "reports" | "utilities",
  ) => {
    setIsMastersOpen(section === "masters");
    setIsTransactionsOpen(section === "transactions");
    setIsDocumentsOpen(section === "documents");
    setIsReportsOpen(section === "reports");
    setIsUtilitiesOpen(section === "utilities");
  };

  const toggleCollapsedMasterSubmenu = (
    section: "sales" | "customer" | "vendor" | "operations",
  ) => {
    setIsMastersOpen(true);
    setMastersHovered(true);
    toggleMasterSubmenu(section);
  };

  const toggleCollapsedUsersSubmenu = () => {
    setIsUtilitiesOpen(true);
    setUtilitiesHovered(true);
    setIsUsersSubmenuOpen((prev) => !prev);
  };

  const toggleSection = (
    section: "masters" | "transactions" | "documents" | "reports" | "utilities",
  ) => {
    if (isCollapsed) return;
    const current = {
      masters: isMastersOpen,
      transactions: isTransactionsOpen,
      documents: isDocumentsOpen,
      reports: isReportsOpen,
      utilities: isUtilitiesOpen,
    }[section];

    if (current) {
      setIsMastersOpen(false);
      setIsTransactionsOpen(false);
      setIsDocumentsOpen(false);
      setIsReportsOpen(false);
      setIsUtilitiesOpen(false);
      setIsUsersSubmenuOpen(false);
      return;
    }

    openSingleSection(section);
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");
  const isDocumentsActive = pathname.startsWith("/document");
  const isReportsActive = pathname.startsWith("/report");
  const isMastersActive = pathname.startsWith("/masters");
  const isUtilitiesActive = pathname.startsWith("/utilities");
  const isTransactionsActive = pathname.startsWith("/transactions");

  const navItemClasses = (
    active: boolean,
    isSubItem: boolean = false,
    forceExpanded: boolean = false,
    inFlyout: boolean = false,
  ) =>
    cn(
      "flex items-center rounded-lg px-3 py-2 transition-all group relative",
      isCollapsed && !forceExpanded
        ? "justify-center px-0 h-10 w-10 mx-auto"
        : "gap-3",
      active
        ? isSubItem
          ? "bg-primary/10 text-primary font-semibold"
          : cn(
              inFlyout
                ? "bg-primary/10 text-primary font-semibold"
                : "bg-white text-primary font-semibold",
              isCollapsed && !forceExpanded
                ? "rounded-lg"
                : "border-r-4 border-[var(--express-link)] rounded-r-none",
            )
        : inFlyout
          ? "text-slate-700 hover:text-primary hover:bg-slate-100"
          : isSubItem && !isCollapsed
            ? "text-slate-700 hover:text-primary hover:bg-slate-100"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
      !isSubItem && !isCollapsed && "text-[15px]",
      isSubItem &&
        (!isCollapsed || forceExpanded) &&
        "ml-6 px-4 py-2 text-[15px]",
    );

  const groupButtonClasses = (active: boolean, open: boolean) =>
    cn(
      "flex items-center justify-between w-full rounded-lg px-3 py-2 text-[15px] transition-all text-sidebar-foreground/80 hover:text-sidebar-foreground group",
      isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "h-10",
      !isCollapsed && "hover:bg-sidebar-accent/60",
      !isCollapsed && (active || open) && "bg-white text-primary font-semibold",
      isCollapsed &&
        (active || open) &&
        "text-sidebar-foreground bg-sidebar-accent/70",
    );

  const utilityMenuItemClasses = (active: boolean) =>
    cn(
      "block rounded-md px-4 py-2 text-[15px] transition-colors",
      active
        ? "text-primary font-semibold"
        : "text-slate-900 hover:text-primary",
    );

  const utilitySubmenuItemClasses = (active: boolean) =>
    cn(
      "block rounded-md px-4 py-2 text-[15px] transition-colors",
      active
        ? "text-primary font-semibold"
        : "text-slate-900 hover:text-primary",
    );

  interface LinkItemProps {
    href: string;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    subItem?: boolean;
    showTextOverride?: boolean;
    inFlyout?: boolean;
  }

  const LinkItem = ({
    href,
    children,
    icon: Icon,
    active,
    subItem,
    showTextOverride = false,
    inFlyout = false,
  }: LinkItemProps) => (
    <Link
      href={href}
      className={navItemClasses(active, subItem, showTextOverride, inFlyout)}
      onClick={onItemClick}
    >
      {!subItem && (
        <Icon
          className={cn(
            "h-5 w-5",
            isCollapsed && !showTextOverride ? "" : "h-4 w-4",
          )}
        />
      )}
      {(!isCollapsed || showTextOverride) && children}
      {isCollapsed && !showTextOverride && !subItem && (
        <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
          {children}
        </div>
      )}
    </Link>
  );

  const renderMasterGroupItems = (
    group: keyof typeof MASTER_GROUP_ITEMS,
    opts?: { inFlyout?: boolean; subItem?: boolean },
  ) => {
    return MASTER_GROUP_ITEMS[group].map((item) => (
      <PermissionGuard key={item.href} permission={item.permission}>
        <LinkItem
          href={item.href}
          active={isActive(item.href)}
          icon={item.icon}
          showTextOverride={opts?.inFlyout}
          inFlyout={opts?.inFlyout}
          subItem={opts?.subItem}
        >
          {item.label}
        </LinkItem>
      </PermissionGuard>
    ));
  };

  return (
    <nav
      ref={navRef}
      className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1"
    >
      <Link
        href="/dashboard"
        className={groupButtonClasses(
          pathname.startsWith("/dashboard"),
          pathname.startsWith("/dashboard"),
        )}
        onClick={onItemClick}
        title={isCollapsed ? "Dashboard" : ""}
      >
        <div className="flex items-center gap-3">
          <Home className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
          {!isCollapsed && <span>Dashboard</span>}
        </div>
      </Link>

      {/* Masters Menu */}
      <div
        className="flex flex-col relative"
        onMouseEnter={() => {
          if (!isCollapsed) return;
          clearCloseDelay();
          closeAllCollapsedMenus();
          setMastersHovered(true);
        }}
        onMouseLeave={() => {
          if (!isCollapsed || isMastersOpen) return;
          scheduleClose(() => {
            setMastersHovered(false);
            setIsSalesOpen(false);
          });
        }}
      >
        <button
          onClick={() => {
            if (isCollapsed) {
              const nextOpen = !isMastersOpen;
              closeAllCollapsedMenus();
              setIsMastersOpen(nextOpen);
              setMastersHovered(nextOpen);
              if (nextOpen)
                openMasterSubmenu(resolveMasterGroupFromPath(pathname));
              return;
            }
            toggleSection("masters");
          }}
          className={groupButtonClasses(isMastersActive, isMastersOpen)}
          title={isCollapsed ? "Master" : ""}
        >
          <div className="flex items-center gap-3">
            <Layers className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
            {!isCollapsed && <span>Master</span>}
          </div>
          {!isCollapsed &&
            (isMastersOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
          {isCollapsed && (
            <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
              Master
            </div>
          )}
        </button>

        {isMastersOpen && !isCollapsed && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-md bg-white p-1 shadow-sm">
            <button
              onClick={() => toggleMasterSubmenu("sales")}
              className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
            >
              <span>Sales</span>
              {isSalesOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {isSalesOpen && (
              <div className="flex flex-col gap-1">
                {renderMasterGroupItems("sales", { subItem: true })}
              </div>
            )}
            <button
              onClick={() => toggleMasterSubmenu("customer")}
              className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
            >
              <span>Customer</span>
              {isCustomerSubmenuOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {isCustomerSubmenuOpen && (
              <div className="flex flex-col gap-1">
                {renderMasterGroupItems("customer", { subItem: true })}
              </div>
            )}
            <button
              onClick={() => toggleMasterSubmenu("vendor")}
              className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
            >
              <span>Vendor</span>
              {isVendorSubmenuOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {isVendorSubmenuOpen && (
              <div className="flex flex-col gap-1">
                {renderMasterGroupItems("vendor", { subItem: true })}
              </div>
            )}
            <button
              onClick={() => toggleMasterSubmenu("operations")}
              className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
            >
              <span>Operations</span>
              {isOperationSubmenuOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {isOperationSubmenuOpen && (
              <div className="flex flex-col gap-1">
                {renderMasterGroupItems("operations", { subItem: true })}
              </div>
            )}
          </div>
        )}

        {isCollapsed && (mastersHovered || isMastersOpen) && (
          <div
            className="absolute left-14 top-0 z-50 w-72 rounded-md border border-border bg-white p-2 text-foreground shadow-xl"
            onMouseEnter={() => clearCloseDelay()}
          >
            <div className="mb-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Master
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="mt-1 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleCollapsedMasterSubmenu("sales")}
                  className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
                >
                  <span>Sales</span>
                  {isSalesOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isSalesOpen && (
                  <div className={cn("flex flex-col gap-1", collapsedSubmenuScrollClass)}>
                                  {renderMasterGroupItems("sales", {
                                    inFlyout: true,
                                    subItem: true,
                                  })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleCollapsedMasterSubmenu("customer")}
                  className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
                >
                  <span>Customer</span>
                  {isCustomerSubmenuOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isCustomerSubmenuOpen && (
                  <div className={cn("flex flex-col gap-1", collapsedSubmenuScrollClass)}>
                                  {renderMasterGroupItems("customer", {
                                    inFlyout: true,
                                    subItem: true,
                                  })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleCollapsedMasterSubmenu("vendor")}
                  className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
                >
                  <span>Vendor</span>
                  {isVendorSubmenuOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isVendorSubmenuOpen && (
                  <div className={cn("flex flex-col gap-1", collapsedSubmenuScrollClass)}>
                                  {renderMasterGroupItems("vendor", {
                                    inFlyout: true,
                                    subItem: true,
                                  })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleCollapsedMasterSubmenu("operations")}
                  className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary hover:bg-slate-100"
                >
                  <span>Operations</span>
                  {isOperationSubmenuOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isOperationSubmenuOpen && (
                  <div className={cn("flex flex-col gap-1", collapsedSubmenuScrollClass)}>
                                  {renderMasterGroupItems("operations", {
                                    inFlyout: true,
                                    subItem: true,
                                  })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Menu */}
      <div
        className="flex flex-col relative"
        onMouseEnter={() => {
          if (!isCollapsed) return;
          clearCloseDelay();
          closeAllCollapsedMenus();
          setTransactionsHovered(true);
        }}
        onMouseLeave={() => {
          if (!isCollapsed || isTransactionsOpen) return;
          scheduleClose(() => setTransactionsHovered(false));
        }}
      >
        <button
          onClick={() => {
            if (isCollapsed) {
              const nextOpen = !isTransactionsOpen;
              closeAllCollapsedMenus();
              setIsTransactionsOpen(nextOpen);
              setTransactionsHovered(nextOpen);
              return;
            }
            toggleSection("transactions");
          }}
          className={groupButtonClasses(
            isTransactionsActive,
            isTransactionsOpen,
          )}
          title={isCollapsed ? "Transactions" : ""}
        >
          <div className="flex items-center gap-3">
            <ArrowLeftRight
              className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")}
            />
            {!isCollapsed && <span>Transaction</span>}
          </div>
          {!isCollapsed &&
            (isTransactionsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
          {isCollapsed && (
            <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
              Transactions
            </div>
          )}
        </button>

        {isTransactionsOpen && !isCollapsed && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-md bg-white p-1 shadow-sm">
            <PermissionGuard permission="transaction.shipment.read">
              <LinkItem
                href="/transactions/shipment"
                subItem
                active={isActive("/transactions/shipment")}
                icon={Package}
              >
                Shiment Booking
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="transaction.manifest.read">
              <LinkItem
                href="/transactions/manifest"
                subItem
                active={isActive("/transactions/manifest")}
                icon={ClipboardList}
              >
                Manifest
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="transaction.drs.read">
              <LinkItem
                href="/transactions/drs"
                subItem
                active={isActive("/transactions/drs")}
                icon={Car}
              >
                DRS
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="transaction.tracking.read">
              <LinkItem
                href="/transactions/tracking"
                subItem
                active={isActive("/transactions/tracking")}
                icon={Navigation}
              >
                Tracking
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="transaction.pod.read">
              <LinkItem
                href="/transactions/pod"
                subItem
                active={isActive("/transactions/pod")}
                icon={CheckSquare}
              >
                POD
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="transaction.customer-payment.read">
              <LinkItem
                href="/transactions/customer-payment"
                subItem
                active={isActive("/transactions/customer-payment")}
                icon={CreditCard}
              >
                Customer Payment
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="transaction.shipment.read">
              <LinkItem
                href="/transactions/receipt"
                subItem
                active={isActive("/transactions/receipt")}
                icon={Banknote}
              >
                Receipts
              </LinkItem>
            </PermissionGuard>
          </div>
        )}

        {isCollapsed && (transactionsHovered || isTransactionsOpen) && (
          <div
            className="absolute left-14 top-0 z-50 w-72 rounded-md border border-border bg-white p-2 text-foreground shadow-xl"
            onMouseEnter={() => clearCloseDelay()}
          >
            <div className="mb-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Transaction
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="mt-1 flex flex-col gap-1">
                <PermissionGuard permission="transaction.shipment.read">
                  <LinkItem
                    href="/transactions/shipment"
                    subItem
                    active={isActive("/transactions/shipment")}
                    icon={Package}
                    showTextOverride
                    inFlyout
                  >
                    Shiment Booking
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="transaction.manifest.read">
                  <LinkItem
                    href="/transactions/manifest"
                    subItem
                    active={isActive("/transactions/manifest")}
                    icon={ClipboardList}
                    showTextOverride
                    inFlyout
                  >
                    Manifest
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="transaction.drs.read">
                  <LinkItem
                    href="/transactions/drs"
                    subItem
                    active={isActive("/transactions/drs")}
                    icon={Car}
                    showTextOverride
                    inFlyout
                  >
                    DRS
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="transaction.tracking.read">
                  <LinkItem
                    href="/transactions/tracking"
                    subItem
                    active={isActive("/transactions/tracking")}
                    icon={Navigation}
                    showTextOverride
                    inFlyout
                  >
                    Tracking
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="transaction.pod.read">
                  <LinkItem
                    href="/transactions/pod"
                    subItem
                    active={isActive("/transactions/pod")}
                    icon={CheckSquare}
                    showTextOverride
                    inFlyout
                  >
                    POD
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="transaction.customer-payment.read">
                  <LinkItem
                    href="/transactions/customer-payment"
                    subItem
                    active={isActive("/transactions/customer-payment")}
                    icon={CreditCard}
                    showTextOverride
                    inFlyout
                  >
                    Customer Payment
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="transaction.shipment.read">
                  <LinkItem
                    href="/transactions/receipt"
                    subItem
                    active={isActive("/transactions/receipt")}
                    icon={Banknote}
                    showTextOverride
                    inFlyout
                  >
                    Receipts
                  </LinkItem>
                </PermissionGuard>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documents Menu */}
      <div
        className="flex flex-col relative"
        onMouseEnter={() => {
          if (!isCollapsed) return;
          clearCloseDelay();
          closeAllCollapsedMenus();
          setDocumentsHovered(true);
        }}
        onMouseLeave={() => {
          if (!isCollapsed || isDocumentsOpen) return;
          scheduleClose(() => setDocumentsHovered(false));
        }}
      >
        <button
          onClick={() => {
            if (isCollapsed) {
              const nextOpen = !isDocumentsOpen;
              closeAllCollapsedMenus();
              setIsDocumentsOpen(nextOpen);
              setDocumentsHovered(nextOpen);
              return;
            }
            toggleSection("documents");
          }}
          className={groupButtonClasses(isDocumentsActive, isDocumentsOpen)}
        >
          <div className="flex items-center gap-3">
            <FileText className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
            {!isCollapsed && <span>Document</span>}
          </div>
          {!isCollapsed &&
            (isDocumentsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>

        {isDocumentsOpen && !isCollapsed && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-md bg-white p-1 shadow-sm">
            <PermissionGuard permission="invoice.core.create">
              <LinkItem
                href="/document/invoice-generation"
                subItem
                active={isActive("/document/invoice-generation")}
                icon={FileText}
              >
                Invoice Generation
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="invoice.core.read">
              <LinkItem
                href="/document/invoice-print"
                subItem
                active={isActive("/document/invoice-print")}
                icon={FileText}
              >
                Invoice Print
              </LinkItem>
            </PermissionGuard>
            <PermissionGuard permission="invoice.core.create">
              <LinkItem
                href="/document/invoice-finalise"
                subItem
                active={isActive("/document/invoice-finalise")}
                icon={FileText}
              >
                Invoice Finalise
              </LinkItem>
            </PermissionGuard>
          </div>
        )}

        {isCollapsed && (documentsHovered || isDocumentsOpen) && (
          <div
            className="absolute left-14 top-0 z-50 w-72 rounded-md border border-border bg-white p-2 text-foreground shadow-xl"
            onMouseEnter={() => clearCloseDelay()}
          >
            <div className="mb-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Document
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="mt-1 flex flex-col gap-1">
                <PermissionGuard permission="invoice.core.create">
                  <LinkItem
                    href="/document/invoice-generation"
                    subItem
                    active={isActive("/document/invoice-generation")}
                    icon={FileText}
                    showTextOverride
                    inFlyout
                  >
                    Invoice Generation
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="invoice.core.read">
                  <LinkItem
                    href="/document/invoice-print"
                    subItem
                    active={isActive("/document/invoice-print")}
                    icon={FileText}
                    showTextOverride
                    inFlyout
                  >
                    Invoice Print
                  </LinkItem>
                </PermissionGuard>
                <PermissionGuard permission="invoice.core.create">
                  <LinkItem
                    href="/document/invoice-finalise"
                    subItem
                    active={isActive("/document/invoice-finalise")}
                    icon={FileText}
                    showTextOverride
                    inFlyout
                  >
                    Invoice Finalise
                  </LinkItem>
                </PermissionGuard>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reports Menu */}
      <div
        className="flex flex-col relative"
        onMouseEnter={() => {
          if (!isCollapsed) return;
          clearCloseDelay();
          closeAllCollapsedMenus();
          setReportsHovered(true);
        }}
        onMouseLeave={() => {
          if (!isCollapsed || isReportsOpen) return;
          scheduleClose(() => setReportsHovered(false));
        }}
      >
        <button
          onClick={() => {
            if (isCollapsed) {
              const nextOpen = !isReportsOpen;
              closeAllCollapsedMenus();
              setIsReportsOpen(nextOpen);
              setReportsHovered(nextOpen);
              return;
            }
            toggleSection("reports");
          }}
          className={groupButtonClasses(isReportsActive, isReportsOpen)}
        >
          <div className="flex items-center gap-3">
            <BarChart3
              className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")}
            />
            {!isCollapsed && <span>Reports</span>}
          </div>
          {!isCollapsed &&
            (isReportsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>

        {isReportsOpen && !isCollapsed && (
          <div className="mt-1 flex flex-col gap-0.5 rounded-md bg-white p-1 shadow-sm">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No menu items configured
            </div>
          </div>
        )}

        {isCollapsed && (reportsHovered || isReportsOpen) && (
          <div
            className="absolute left-14 top-0 z-50 w-72 rounded-md border border-border bg-white p-2 text-foreground shadow-xl"
            onMouseEnter={() => clearCloseDelay()}
          >
            <div className="mb-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Reports
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="mt-1 flex flex-col gap-1">
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No menu items configured
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Utilities Menu */}
      <div
        className="flex flex-col relative"
        onMouseEnter={() => {
          if (!isCollapsed) return;
          clearCloseDelay();
          closeAllCollapsedMenus();
          setUtilitiesHovered(true);
        }}
        onMouseLeave={() => {
          if (!isCollapsed || isUtilitiesOpen) return;
          scheduleClose(() => setUtilitiesHovered(false));
        }}
      >
        <button
          onClick={() => {
            if (isCollapsed) {
              const nextOpen = !isUtilitiesOpen;
              closeAllCollapsedMenus();
              setIsUtilitiesOpen(nextOpen);
              setUtilitiesHovered(nextOpen);
              return;
            }
            toggleSection("utilities");
          }}
          className={groupButtonClasses(
            isUtilitiesActive,
            isUtilitiesOpen,
          )}
        >
          <div className="flex items-center gap-3">
            <Wrench className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
            {!isCollapsed && <span>Utility</span>}
          </div>
          {!isCollapsed &&
            (isUtilitiesOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>

        {isUtilitiesOpen && !isCollapsed && (
          <div className="mt-1 flex flex-col gap-1 rounded-md bg-white p-3 shadow-sm">
            <button
              type="button"
              onClick={() => setIsUsersSubmenuOpen((prev) => !prev)}
              className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary"
            >
              <span>Users</span>
              {isUsersSubmenuOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            {isUsersSubmenuOpen && (
              <div className="ml-6 flex flex-col gap-1">
                <Link
                  href="/utilities/users/user-setup"
                  className={utilitySubmenuItemClasses(
                    isActive("/utilities/users/user-setup"),
                  )}
                  onClick={onItemClick}
                >
                  User Setup
                </Link>
                <Link
                  href="/utilities/users/access-rights"
                  className={utilitySubmenuItemClasses(
                    isActive("/utilities/users/access-rights"),
                  )}
                  onClick={onItemClick}
                >
                  Access Rights
                </Link>
                <Link
                  href="/utilities/users/logged-in-users"
                  className={utilitySubmenuItemClasses(
                    isActive("/utilities/users/logged-in-users"),
                  )}
                  onClick={onItemClick}
                >
                  LoggedIn Users
                </Link>
              </div>
            )}
            <PermissionGuard permission="settings.permissions.read">
              <Link
                href="/utilities/permissions"
                className={utilityMenuItemClasses(
                  isActive("/utilities/permissions"),
                )}
                onClick={onItemClick}
              >
                Permissions
              </Link>
            </PermissionGuard>
            <PermissionGuard permission="settings.permissions.read">
              <Link
                href="/utilities/roles"
                className={utilityMenuItemClasses(
                  isActive("/utilities/roles"),
                )}
                onClick={onItemClick}
              >
                Roles
              </Link>
            </PermissionGuard>
          </div>
        )}

        {isCollapsed && (utilitiesHovered || isUtilitiesOpen) && (
          <div
            className="absolute left-14 top-0 z-50 w-72 rounded-md border border-border bg-white p-2 text-foreground shadow-xl"
            onMouseEnter={() => clearCloseDelay()}
          >
            <div className="mb-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Utility
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="mt-1 flex flex-col gap-1 p-1">
                <button
                  type="button"
                  onClick={toggleCollapsedUsersSubmenu}
                  className="flex items-center justify-between w-full rounded-md px-4 py-2 text-[15px] text-slate-700 transition-colors hover:text-primary"
                >
                  <span>Users</span>
                  {isUsersSubmenuOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {isUsersSubmenuOpen && (
                  <div className={cn("ml-6 flex flex-col gap-1", collapsedSubmenuScrollClass)}>
                    <Link
                      href="/utilities/users/user-setup"
                      className={utilitySubmenuItemClasses(
                        isActive("/utilities/users/user-setup"),
                      )}
                      onClick={onItemClick}
                    >
                      User Setup
                    </Link>
                    <Link
                      href="/utilities/users/access-rights"
                      className={utilitySubmenuItemClasses(
                        isActive("/utilities/users/access-rights"),
                      )}
                      onClick={onItemClick}
                    >
                      Access Rights
                    </Link>
                    <Link
                      href="/utilities/users/logged-in-users"
                      className={utilitySubmenuItemClasses(
                        isActive("/utilities/users/logged-in-users"),
                      )}
                      onClick={onItemClick}
                    >
                      LoggedIn Users
                    </Link>
                  </div>
                )}
                <PermissionGuard permission="settings.permissions.read">
                  <Link
                    href="/utilities/permissions"
                    className={utilityMenuItemClasses(
                      isActive("/utilities/permissions"),
                    )}
                    onClick={onItemClick}
                  >
                    Permissions
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="settings.permissions.read">
                  <Link
                    href="/utilities/roles"
                    className={utilityMenuItemClasses(
                      isActive("/utilities/roles"),
                    )}
                    onClick={onItemClick}
                  >
                    Roles
                  </Link>
                </PermissionGuard>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [showMenuSuggestions, setShowMenuSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const initials = user?.username?.substring(0, 2).toUpperCase() || "US";
  const activeHeaderItem =
    [...headerNavItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      ) ?? headerNavItems[0];

  const filteredMenuItems = headerNavItems
    .filter((item) =>
      item.label.toLowerCase().includes(menuSearch.trim().toLowerCase()),
    )
    .slice(0, 8);

  const navigateFromSearch = (searchValue: string) => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return;

    const exact = headerNavItems.find(
      (item) => item.label.toLowerCase() === query,
    );
    const startsWith = headerNavItems.find((item) =>
      item.label.toLowerCase().startsWith(query),
    );
    const contains = headerNavItems.find((item) =>
      item.label.toLowerCase().includes(query),
    );
    const target = exact ?? startsWith ?? contains;

    if (!target) return;
    setShowMenuSuggestions(false);
    setMenuSearch(target.label);
    router.push(target.href);
  };

  const refreshCurrentPage = () => {
    // Ensures both App Router data and page state are refreshed.
    router.refresh();
    window.location.reload();
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchBoxRef.current) return;
      const target = event.target as Node | null;
      if (target && searchBoxRef.current.contains(target)) return;
      setShowMenuSuggestions(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-primary text-primary-foreground transition-all duration-300 ease-in-out h-full overflow-visible",
          isSidebarCollapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div className="flex h-14 items-center justify-between px-2 lg:h-[60px] bg-primary border-b border-sidebar-border">
          {!isSidebarCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold tracking-tight bg-white px-3 py-1.5 rounded-md"
            >
              <img
                src="/logo/logo.png"
                alt="SB Express Cargo"
                className="h-7 w-auto object-contain"
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              isSidebarCollapsed && "mx-auto",
            )}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div
          className={cn(
            "flex-1 py-4 scrollbar-hide",
            isSidebarCollapsed
              ? "overflow-visible"
              : "overflow-y-auto overflow-x-hidden",
          )}
        >
          <SidebarContent
            pathname={pathname}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="left"
          className="p-0 bg-primary text-primary-foreground border-none w-64"
        >
          <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold tracking-tight bg-white px-3 py-1.5 rounded-md"
            >
              <img
                src="/logo/logo.png"
                alt="SB Express Cargo"
                className="h-7 w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <SidebarContent
              pathname={pathname}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 lg:h-[60px] lg:px-5 shrink-0 shadow-[0_1px_0_rgba(23,42,69,0.06)]">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0 text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {isSidebarCollapsed && (
              <Link
                href="/dashboard"
                className="hidden shrink-0 items-center sm:flex"
              >
                <img
                  src="/logo/logo.png"
                  alt="SB Express Cargo"
                  className="h-8 w-auto max-w-[160px] object-contain lg:max-w-[200px]"
                />
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 shrink-0 text-[#1f2d3d] hover:bg-slate-100 sm:flex"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </Button>

            <div className="hidden min-w-0 items-center gap-1 text-sm sm:flex">
              <Link
                href="/dashboard"
                className="font-medium text-muted-foreground hover:text-[var(--express-link)]"
              >
                Home
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link
                href={activeHeaderItem.href}
                className="truncate font-medium text-[var(--express-link)] hover:underline"
              >
                {activeHeaderItem.label}
              </Link>
            </div>
          </div>

          <div className="hidden max-w-md flex-1 px-2 md:block">
            <div ref={searchBoxRef} className="relative">
              <div className="flex w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => {
                    setMenuSearch(e.target.value);
                    setShowMenuSuggestions(true);
                  }}
                  onFocus={() => setShowMenuSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      navigateFromSearch(menuSearch);
                    }
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none focus:ring-0"
                  placeholder="Tracking"
                  aria-label="Menu search"
                />
                <button
                  type="button"
                  onClick={() => navigateFromSearch(menuSearch)}
                  className="flex shrink-0 items-center justify-center bg-[#1f2d3d] px-3 text-white hover:bg-[#162231]"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {showMenuSuggestions && menuSearch.trim().length > 0 && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-lg">
                  {filteredMenuItems.length > 0 ? (
                    filteredMenuItems.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowMenuSuggestions(false);
                          setMenuSearch(item.label);
                          router.push(item.href);
                        }}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.href}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No menu found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-0.5 rounded-full border border-[#1f2d3d] bg-white px-1 py-0.5 lg:flex">
              {[
                {
                  icon: Truck,
                  label: "Shiment Booking",
                  href: "/transactions/shipment",
                },
                { icon: BarChart3, label: "Analytics", href: "/dashboard" },
                {
                  icon: Calculator,
                  label: "Rates",
                  href: "/masters/rates",
                },
                {
                  icon: Wallet,
                  label: "Wallet",
                  href: "/transactions/customer-payment",
                },
                {
                  icon: FileText,
                  label: "Records",
                  href: "/document/invoice-print",
                },
                {
                  icon: User,
                  label: "User",
                  href: "/utilities/users/user-setup",
                },
                {
                  icon: ArrowLeftRight,
                  label: "Activity",
                  href: "/transactions/tracking",
                },
              ].map((item, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#1f2d3d] hover:bg-slate-100"
                  title={item.label}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#1f2d3d] hover:bg-slate-100"
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#1f2d3d] hover:bg-slate-100"
              onClick={refreshCurrentPage}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-[#1f2d3d] hover:bg-slate-100"
            >
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--express-danger)] ring-2 ring-card" />
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 text-[#1f2d3d] hover:bg-slate-100 sm:flex"
            >
              <Info className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id="user-menu-trigger"
                  variant="ghost"
                  className="flex h-9 max-w-[220px] items-center gap-2 rounded-md px-2 hover:bg-slate-100"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#1f2d3d]">
                    {initials}
                  </div>
                  <span className="hidden truncate text-sm font-medium text-[#1f2d3d] lg:inline">
                    {user?.username ?? "Admin"}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-1" align="end" forceMount>
                <DropdownMenuLabel className="font-normal border-b pb-2 mb-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {user?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <Link href="/profile" className="w-full">
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <Link href="/change-password" className="w-full">
                    <span>Change Password</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-[var(--express-danger)]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-auto bg-background">
          <div className="flex-1 p-4 lg:p-6">{children}</div>
          <footer className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground sm:flex-row">
            <span className="font-semibold tracking-wide text-primary/80">
              SBtechnoworld On Cloud
            </span>
            <span suppressHydrationWarning>
              © {new Date().getFullYear()} SBtechnoworld. All rights reserved.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
