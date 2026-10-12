"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Search,
  Table2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/shipments/create", label: "Book shipment", icon: Package },
  { href: "/customer/shipments", label: "My shipments", icon: ClipboardList },
  { href: "/customer/mis", label: "MIS", icon: Table2 },
  { href: "/customer/tracking", label: "Track", icon: Search },
  { href: "/customer/profile", label: "Profile", icon: User },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isCustomerUser, isLoading } = useAuth();
  const isLogin = pathname === "/customer/login";

  useEffect(() => {
    if (isLoading || isLogin) return;
    if (!user || !isCustomerUser) {
      router.replace("/customer/login");
    }
  }, [isLoading, isLogin, user, isCustomerUser, router]);

  if (isLogin) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (isLoading || !isCustomerUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col bg-primary text-primary-foreground md:flex">
        <div className="border-b border-white/10 px-4 py-5">
          <p className="text-sm font-semibold tracking-wide">SB Express Cargo</p>
          <p className="text-xs text-primary-foreground/70">Customer panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/customer/shipments"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  active ? "bg-white/15" : "hover:bg-white/10",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/customer/change-password"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              pathname === "/customer/change-password" ? "bg-white/15" : "hover:bg-white/10",
            )}
          >
            Change password
          </Link>
        </nav>
        <div className="border-t border-white/10 p-3">
          <p className="mb-2 truncate px-3 text-xs text-primary-foreground/70">{user?.username}</p>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
          <p className="text-sm font-semibold">Customer panel</p>
          <Button type="button" variant="outline" size="sm" onClick={() => logout()}>
            Log out
          </Button>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b bg-white px-3 py-2 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md px-2 py-1 text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
