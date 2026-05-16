"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { isCustomerUser, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (isCustomerUser) {
    return <CustomerDashboard />;
  }

  return <AdminDashboard />;
}
