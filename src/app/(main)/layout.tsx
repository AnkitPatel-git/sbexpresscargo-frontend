"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Package2, Users, LayoutDashboard, Settings, LogOut, User, ChevronDown, ChevronRight, Layers, Plane, Map as MapIcon, Globe, Landmark, Building2, Box, Package, Building, MapPin, UserRound, Percent, Truck, AlertTriangle, Coins } from 'lucide-react';
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

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith('/settings'));
    const [isMastersOpen, setIsMastersOpen] = useState(pathname.startsWith('/masters'));

    // Update open states when pathname changes (e.g. on hard reload or direct nav)
    useEffect(() => {
        if (pathname.startsWith('/settings')) {
            setIsSettingsOpen(true);
        }
        if (pathname.startsWith('/masters')) {
            setIsMastersOpen(true);
        }
    }, [pathname]);

    const initials = user?.username?.substring(0, 2).toUpperCase() || 'US';

    const isActive = (path: string) => pathname === path;
    const isSettingsActive = pathname.startsWith('/settings');
    const isMastersActive = pathname.startsWith('/masters');

    const navItemClasses = (active: boolean) =>
        cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-gray-900",
            active
                ? "bg-gray-100 text-gray-900 font-semibold"
                : "text-gray-500 hover:bg-gray-50"
        );

    return (
        <div className="flex h-screen w-full bg-gray-100">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-white md:flex">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                        <Package2 className="h-6 w-6" />
                        <span className="">SB Express</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                        <Link
                            href="/dashboard"
                            className={navItemClasses(isActive('/dashboard'))}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <PermissionGuard permission="user_master_list">
                            <Link
                                href="/users"
                                className={navItemClasses(isActive('/users'))}
                            >
                                <Users className="h-4 w-4" />
                                Users
                            </Link>
                        </PermissionGuard>

                        {/* Masters Menu */}
                        <div className="flex flex-col">
                            <button
                                onClick={() => setIsMastersOpen(!isMastersOpen)}
                                className={cn(
                                    "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-50 text-gray-500 hover:text-gray-900",
                                    isMastersActive && "text-gray-900 font-semibold"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Layers className="h-4 w-4" />
                                    Masters
                                </div>
                                {isMastersOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            {isMastersOpen && (
                                <div className="mt-1 flex flex-col gap-1">
                                    <PermissionGuard permission="product_master_list">
                                        <Link
                                            href="/masters/products"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/products')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Box className="h-4 w-4" />
                                            Product Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="country_master_list">
                                        <Link
                                            href="/masters/countries"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/countries')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Globe className="h-4 w-4" />
                                            Country Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="state_master_list">
                                        <Link
                                            href="/masters/states"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/states')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Landmark className="h-4 w-4" />
                                            State Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="industry_master_list">
                                        <Link
                                            href="/masters/industries"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/industries')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Building2 className="h-4 w-4" />
                                            Industry Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="flight_master_list">
                                        <Link
                                            href="/masters/flights"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/flights')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Plane className="h-4 w-4" />
                                            Flight Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="zone_master_list">
                                        <Link
                                            href="/masters/zones"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/zones')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <MapIcon className="h-4 w-4" />
                                            Zone Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="content_master_list">
                                        <Link
                                            href="/masters/contents"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/contents')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Package className="h-4 w-4" />
                                            Content Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="bank_master_list">
                                        <Link
                                            href="/masters/banks"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/banks')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Building className="h-4 w-4" />
                                            Bank Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="local_branch_master_list">
                                        <Link
                                            href="/masters/local-branches"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/local-branches')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <MapPin className="h-4 w-4" />
                                            Local Branch Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="service_center_master_list">
                                        <Link
                                            href="/masters/service-centers"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/service-centers')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Settings className="h-4 w-4" />
                                            Service Center Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="customer_master_list">
                                        <Link
                                            href="/masters/customers"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/customers')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <UserRound className="h-4 w-4" />
                                            Customer Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="client_rate_master_list">
                                        <Link
                                            href="/masters/client-rates"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/client-rates')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Percent className="h-4 w-4" />
                                            Client Rate Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="consignee_master_list">
                                        <Link
                                            href="/masters/consignee"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/consignee')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <UserRound className="h-4 w-4" />
                                            Consignee Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="shipper_master_list">
                                        <Link
                                            href="/masters/shipper"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/shipper')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <UserRound className="h-4 w-4" />
                                            Shipper Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="vendor_master_list">
                                        <Link
                                            href="/masters/vendor"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/vendor')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Building2 className="h-4 w-4" />
                                            Vendor Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="courier_master_list">
                                        <Link
                                            href="/masters/courier"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/courier')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Truck className="h-4 w-4" />
                                            Courier Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="area_master_list">
                                        <Link
                                            href="/masters/area"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/area')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <MapPin className="h-4 w-4" />
                                            Area Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="exception_master_list">
                                        <Link
                                            href="/masters/exception"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/exception')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <AlertTriangle className="h-4 w-4" />
                                            Exception Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="service_map_master_list">
                                        <Link
                                            href="/masters/service-map"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/service-map')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <MapIcon className="h-4 w-4" />
                                            Service Map Master
                                        </Link>
                                    </PermissionGuard>
                                    <PermissionGuard permission="charge_master_list">
                                        <Link
                                            href="/masters/charge"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/masters/charge')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            <Coins className="h-4 w-4" />
                                            Charge Master
                                        </Link>
                                    </PermissionGuard>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={cn(
                                    "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-50 text-gray-500 hover:text-gray-900",
                                    isSettingsActive && "text-gray-900 font-semibold"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </div>
                                {isSettingsOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            {isSettingsOpen && (
                                <div className="mt-1 flex flex-col gap-1">
                                    <PermissionGuard permission="permission_list">
                                        <Link
                                            href="/settings/permissions"
                                            className={cn(
                                                "ml-7 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                                                isActive('/settings/permissions')
                                                    ? "bg-gray-100 text-gray-900 font-semibold"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                            )}
                                        >
                                            Permissions
                                        </Link>
                                    </PermissionGuard>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6">
                    <div className="w-full flex-1">
                        <form>
                            <div className="relative">
                                {/* Search input placeholder if needed */}
                            </div>
                        </form>
                    </div>
                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
