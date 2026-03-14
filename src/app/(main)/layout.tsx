"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Package2, Users, LayoutDashboard, Settings, LogOut, User, ChevronDown, ChevronRight, Layers, Plane, Map as MapIcon, Globe, Landmark, Building2, Box, Package, Building, MapPin, UserRound, Percent, Truck, AlertTriangle, Coins, Wrench, Calculator, Droplet, Home, Search, Maximize, Bell, Info, Star, Link as LinkIcon, Wallet, FileText, ArrowLeftRight, BarChart3, Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarContentProps {
    pathname: string;
    isCollapsed?: boolean;
    onItemClick?: () => void;
}

const SidebarContent = ({ pathname, isCollapsed = false, onItemClick }: SidebarContentProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith('/settings'));
    const [isMastersOpen, setIsMastersOpen] = useState(pathname.startsWith('/masters'));
    const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(pathname.startsWith('/utilities'));
    const [isTaxChargesOpen, setIsTaxChargesOpen] = useState(pathname.startsWith('/tax-charges'));
    const [isSalesOpen, setIsSalesOpen] = useState(false);

    useEffect(() => {
        if (pathname.startsWith('/settings')) setIsSettingsOpen(true);
        if (pathname.startsWith('/masters')) setIsMastersOpen(true);
        if (pathname.startsWith('/utilities')) setIsUtilitiesOpen(true);
        if (pathname.startsWith('/tax-charges')) setIsTaxChargesOpen(true);
    }, [pathname]);

    const isActive = (path: string) => pathname === path;
    const isSettingsActive = pathname.startsWith('/settings');
    const isMastersActive = pathname.startsWith('/masters');
    const isUtilitiesActive = pathname.startsWith('/utilities');
    const isTaxChargesActive = pathname.startsWith('/tax-charges');

    const navItemClasses = (active: boolean, isSubItem: boolean = false) =>
        cn(
            "flex items-center rounded-lg px-3 py-2 transition-all group relative",
            isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "gap-3",
            active
                ? cn(
                    "bg-white text-[#0c1e35] font-semibold",
                    isCollapsed ? "rounded-lg" : "border-r-4 border-blue-600 rounded-r-none"
                )
                : "text-gray-400 hover:text-white hover:bg-[#1a2e45]",
            isSubItem && !isCollapsed && "ml-4"
        );

    const groupButtonClasses = (active: boolean, open: boolean) =>
        cn(
            "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-all hover:bg-[#1a2e45] text-gray-400 hover:text-white group",
            isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "",
            (active || open) && "text-white"
        );

    const LinkItem = ({ href, children, icon: Icon, active, subItem }: any) => (
        <Link href={href} className={navItemClasses(active, subItem)} onClick={onItemClick}>
            <Icon className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
            {!isCollapsed && children}
            {isCollapsed && (
                <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    {children}
                </div>
            )}
        </Link>
    );

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <LinkItem href="/dashboard" icon={Home} active={isActive('/dashboard')}>Dashboard</LinkItem>

            {/* Masters Menu */}
            <div className="flex flex-col">
                <button
                    onClick={() => !isCollapsed && setIsMastersOpen(!isMastersOpen)}
                    className={groupButtonClasses(isMastersActive, isMastersOpen)}
                    title={isCollapsed ? "Master" : ""}
                >
                    <div className="flex items-center gap-3">
                        <Layers className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
                        {!isCollapsed && <span>Master</span>}
                    </div>
                    {!isCollapsed && (isMastersOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                    {isCollapsed && (
                        <div className="absolute left-14 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                            Master
                        </div>
                    )}
                </button>

                {isMastersOpen && !isCollapsed && (
                    <div className="mt-1 flex flex-col gap-1 border-l border-gray-700 ml-4 pl-1">
                        <button
                            onClick={() => setIsSalesOpen(!isSalesOpen)}
                            className="flex items-center justify-between w-full px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#1a2e45] rounded-md transition-all"
                        >
                            <span>Sales</span>
                            {isSalesOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>

                        {isSalesOpen && (
                            <div className="flex flex-col gap-1">
                                <PermissionGuard permission="product_master_list">
                                    <LinkItem href="/masters/products" subItem active={isActive('/masters/products')} icon={Box}>Product</LinkItem>
                                </PermissionGuard>
                            </div>
                        )}

                        <PermissionGuard permission="product_master_list">
                            <LinkItem href="/masters/products" subItem active={isActive('/masters/products')} icon={Box}>Product Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="zone_master_list">
                            <LinkItem href="/masters/zones" subItem active={isActive('/masters/zones')} icon={MapIcon}>Zone</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="country_master_list">
                            <LinkItem href="/masters/countries" subItem active={isActive('/masters/countries')} icon={Globe}>Country</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="state_master_list">
                            <LinkItem href="/masters/states" subItem active={isActive('/masters/states')} icon={Landmark}>State Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="industry_master_list">
                            <LinkItem href="/masters/industries" subItem active={isActive('/masters/industries')} icon={Building2}>Industry Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="flight_master_list">
                            <LinkItem href="/masters/flights" subItem active={isActive('/masters/flights')} icon={Plane}>Flight Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="content_master_list">
                            <LinkItem href="/masters/contents" subItem active={isActive('/masters/contents')} icon={Package}>Content Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="bank_master_list">
                            <LinkItem href="/masters/banks" subItem active={isActive('/masters/banks')} icon={Building}>Bank Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="local_branch_master_list">
                            <LinkItem href="/masters/local-branches" subItem active={isActive('/masters/local-branches')} icon={MapPin}>Local Branch Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="service_center_master_list">
                            <LinkItem href="/masters/service-centers" subItem active={isActive('/masters/service-centers')} icon={Settings}>Service Center Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="customer_master_list">
                            <LinkItem href="/masters/customers" subItem active={isActive('/masters/customers')} icon={UserRound}>Customer Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="client_rate_master_list">
                            <LinkItem href="/masters/client-rates" subItem active={isActive('/masters/client-rates')} icon={Percent}>Client Rate Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="consignee_master_list">
                            <LinkItem href="/masters/consignee" subItem active={isActive('/masters/consignee')} icon={UserRound}>Consignee Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="shipper_master_list">
                            <LinkItem href="/masters/shipper" subItem active={isActive('/masters/shipper')} icon={UserRound}>Shipper Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="vendor_master_list">
                            <LinkItem href="/masters/vendor" subItem active={isActive('/masters/vendor')} icon={Building2}>Vendor Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="courier_master_list">
                            <LinkItem href="/masters/courier" subItem active={isActive('/masters/courier')} icon={Truck}>Courier Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="area_master_list">
                            <LinkItem href="/masters/area" subItem active={isActive('/masters/area')} icon={MapPin}>Area Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="exception_master_list">
                            <LinkItem href="/masters/exception" subItem active={isActive('/masters/exception')} icon={AlertTriangle}>Exception Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="service_map_master_list">
                            <LinkItem href="/masters/service-map" subItem active={isActive('/masters/service-map')} icon={MapIcon}>Service Map Master</LinkItem>
                        </PermissionGuard>
                        <PermissionGuard permission="charge_master_list">
                            <LinkItem href="/masters/charge" subItem active={isActive('/masters/charge')} icon={Coins}>Charge Master</LinkItem>
                        </PermissionGuard>
                    </div>
                )}
            </div>

            {/* Utilities Menu */}
            <div className="flex flex-col">
                <button
                    onClick={() => !isCollapsed && setIsUtilitiesOpen(!isUtilitiesOpen)}
                    className={groupButtonClasses(isUtilitiesActive, isUtilitiesOpen)}
                >
                    <div className="flex items-center gap-3">
                        <Wrench className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
                        {!isCollapsed && <span>Utilities</span>}
                    </div>
                    {!isCollapsed && (isUtilitiesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>

                {isUtilitiesOpen && !isCollapsed && (
                    <div className="mt-1 flex flex-col gap-1 border-l border-gray-700 ml-4 pl-1">
                        <PermissionGuard permission="serviceable_pincode_list">
                            <LinkItem href="/utilities/serviceable-pincodes" subItem active={isActive('/utilities/serviceable-pincodes')} icon={MapPin}>Serviceable Pincodes</LinkItem>
                        </PermissionGuard>
                    </div>
                )}
            </div>

            {/* Tax & Charges Setup */}
            <div className="flex flex-col">
                <button
                    onClick={() => !isCollapsed && setIsTaxChargesOpen(!isTaxChargesOpen)}
                    className={groupButtonClasses(isTaxChargesActive, isTaxChargesOpen)}
                >
                    <div className="flex items-center gap-3">
                        <Calculator className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
                        {!isCollapsed && <span>Tax & Charges Setup</span>}
                    </div>
                    {!isCollapsed && (isTaxChargesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>

                {isTaxChargesOpen && !isCollapsed && (
                    <div className="mt-1 flex flex-col gap-1 border-l border-gray-700 ml-4 pl-1">
                        <PermissionGuard permission="fuel_setup_list">
                            <LinkItem href="/tax-charges/fuel-setup" subItem active={isActive('/tax-charges/fuel-setup')} icon={Droplet}>Fuel Setup</LinkItem>
                        </PermissionGuard>
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="flex flex-col">
                <button
                    onClick={() => !isCollapsed && setIsSettingsOpen(!isSettingsOpen)}
                    className={groupButtonClasses(isSettingsActive, isSettingsOpen)}
                >
                    <div className="flex items-center gap-3">
                        <Settings className={cn("h-5 w-5", isCollapsed ? "" : "h-4 w-4")} />
                        {!isCollapsed && <span>Settings</span>}
                    </div>
                    {!isCollapsed && (isSettingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </button>

                {isSettingsOpen && !isCollapsed && (
                    <div className="mt-1 flex flex-col gap-1 border-l border-gray-700 ml-4 pl-1">
                        <PermissionGuard permission="permission_list">
                            <LinkItem href="/settings/permissions" subItem active={isActive('/settings/permissions')} icon={Settings}>Permissions</LinkItem>
                        </PermissionGuard>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const initials = user?.username?.substring(0, 2).toUpperCase() || 'US';

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "hidden md:flex flex-col bg-[#0c1e35] text-white transition-all duration-300 ease-in-out h-full overflow-hidden",
                isSidebarCollapsed ? "w-20" : "w-64"
            )}>
                <div className="flex h-14 items-center justify-between px-4 lg:h-[60px] bg-[#0c1e35] border-b border-gray-800/50">
                    {!isSidebarCollapsed && (
                        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                            <div className="bg-white p-1 rounded">
                                <span className="text-red-600 font-black text-xs uppercase px-1 border-b-2 border-red-600">SB</span>
                            </div>
                            <span className="text-white text-sm">Express Cargo</span>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-gray-400 hover:text-white hover:bg-[#1a2e45]", isSidebarCollapsed && "mx-auto")}
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
                    <SidebarContent pathname={pathname} isCollapsed={isSidebarCollapsed} />
                </div>
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetContent side="left" className="p-0 bg-[#0c1e35] text-white border-none w-64">
                    <div className="flex h-14 items-center px-4 border-b border-gray-800/50">
                        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                            <div className="bg-white p-1 rounded">
                                <span className="text-red-600 font-black text-xs uppercase px-1 border-b-2 border-red-600">SB</span>
                            </div>
                            <span className="text-white text-sm">Express Cargo</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto py-4">
                        <SidebarContent pathname={pathname} onItemClick={() => setIsMobileMenuOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <header className="flex h-14 items-center justify-between gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6 shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-gray-500"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>

                        {/* Left: Nav Links */}
                        <div className="hidden sm:flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Home
                            </Link>
                            <Link href="/masters/products" className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2">
                                <Box className="h-4 w-4" />
                                Product
                            </Link>
                        </div>
                    </div>

                    {/* Center: Tracking Search */}
                    <div className="flex-1 max-w-md mx-auto hidden sm:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <Search className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-24 py-2 border border-gray-200 rounded-full bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm"
                                placeholder="Tracking Search"
                            />
                            <button className="absolute right-1 top-1 bottom-1 px-4 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Right: Utility Icons & User Profiles */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="hidden lg:flex items-center gap-1 pr-4 border-r border-gray-100">
                            {[
                                { icon: Truck, label: 'Shipment' },
                                { icon: BarChart3, label: 'Analytics' },
                                { icon: Calculator, label: 'Rates' },
                                { icon: Wallet, label: 'Wallet' },
                                { icon: FileText, label: 'Records' },
                                { icon: User, label: 'User' },
                                { icon: ArrowLeftRight, label: 'Activity' },
                            ].map((item, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title={item.label}>
                                    <item.icon className="h-4 w-4" />
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-yellow-500">
                                <Star className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 relative">
                                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                                <Bell className="h-4 w-4" />
                            </Button>

                            {/* User menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 h-9 hover:bg-gray-100 rounded-full border border-transparent hover:border-gray-200 transition-all">
                                        <div className="bg-blue-100 text-blue-700 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                            {initials}
                                        </div>
                                        <ChevronDown className="h-3 w-3 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-1" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal border-b pb-2 mb-2">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold leading-none">{user?.username}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    )
}
