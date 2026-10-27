"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  Ban,
  Calendar,
  Package,
  RefreshCw,
  Search,
  Truck,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/dashboard-metrics";
import { TatSummaryCard } from "@/components/dashboard/tat-summary";
import { dashboardService } from "@/services/dashboard-service";
import { useAuth } from "@/context/auth-context";

export function CustomerDashboard() {
  const { effectiveCustomerIds } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const customerKey = effectiveCustomerIds.join(",");
  const hasCustomers = effectiveCustomerIds.length > 0;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: opsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-customer-ops", fromDate, toDate, customerKey],
    queryFn: () =>
      dashboardService.getOperationSummary({
        fromDate,
        toDate,
      }),
    enabled: hasCustomers,
  });

  const { data: tatData, isLoading: tatLoading, isError: tatError, error: tatQueryError, refetch: refetchTat } = useQuery({
    queryKey: ["dashboard-customer-tat", fromDate, toDate, customerKey],
    queryFn: () =>
      dashboardService.getTatSummary({
        fromDate,
        toDate,
      }),
    enabled: hasCustomers,
  });

  const kpis = opsData?.data.kpis;

  const applyFilters = () => {
    void refetch();
    void refetchTat();
  };

  const resetFilters = () => {
    setFromDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
    void refetch();
    void refetchTat();
  };

  if (!isMounted) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (!hasCustomers) {
    return (
      <Card className="shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
        <CardHeader>
          <CardTitle>Shipment insights</CardTitle>
          <CardDescription>
            Your account is not linked to a customer profile yet. Contact support if this persists after login.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Shipment insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your bookings and delivery status for the selected period.
          {isLoading || tatLoading ? " Loading your shipments…" : ""}
        </p>
        {isError || tatError ? (
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error
              ? error.message
              : tatQueryError instanceof Error
                ? tatQueryError.message
                : "Could not load your dashboard. Please try again."}
          </p>
        ) : null}
      </div>

      <Card className="gap-0 py-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
        <CardContent className="px-4 py-0 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="customer-dashboard-from-date"
                  className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  From date
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-dashboard-from-date"
                    name="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 bg-background pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="customer-dashboard-to-date"
                  className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  To date
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-dashboard-to-date"
                    name="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 bg-background pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="success"
                className="min-w-[100px] font-semibold"
                onClick={applyFilters}
                disabled={isLoading}
              >
                <Search className="h-4 w-4" />
                Apply
              </Button>
              <Button
                type="button"
                variant="expressDanger"
                className="min-w-[100px] font-semibold"
                onClick={resetFilters}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total bookings"
          value={kpis?.totalBooking ?? 0}
          icon={Package}
          color="purple"
          description="All shipment booking"
        />
        <StatsCard
          title="In transit"
          value={kpis?.inTransit ?? 0}
          icon={Truck}
          color="blue"
          description="All bookings before delivery or cancel"
        />
        <StatsCard
          title="Delivered"
          value={kpis?.successfulDeliveries ?? 0}
          icon={MapPin}
          color="green"
          description="Delivered shipments"
        />
        <StatsCard
          title="Cancelled"
          value={kpis?.cancelled ?? 0}
          icon={Ban}
          color="orange"
          description="Cancelled shipments"
        />
      </div>

      <TatSummaryCard data={tatData?.data} />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href="/transactions/shipment/create">Book shipment</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/transactions/shipment">View my shipments</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/transactions/tracking">Track AWB</Link>
        </Button>
      </div>
    </div>
  );
}
