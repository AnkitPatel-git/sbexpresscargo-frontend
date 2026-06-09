"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  Calendar,
  Package,
  RefreshCw,
  Search,
  Truck,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/dashboard-metrics";
import { ExpressOutboundSummary } from "@/components/dashboard/express-operation-summary";
import { dashboardService } from "@/services/dashboard-service";
import { useAuth } from "@/context/auth-context";
import type { OperationSummary } from "@/types/dashboard";

const CUSTOMER_INSIGHT_ITEMS: {
  key: keyof OperationSummary["outbound"]["buckets"];
  label: string;
  description: string;
}[] = [
  { key: "outForDelivery", label: "Out for delivery", description: "Shipments currently out for delivery" },
  { key: "delivered", label: "Delivered", description: "Successfully delivered in this period" },
  { key: "pending", label: "Pending", description: "Booked and awaiting movement" },
  { key: "rto", label: "RTO", description: "Return to origin in progress or completed" },
  { key: "unDelivered", label: "Delivery attempted", description: "Could not be delivered on attempt" },
  { key: "unManifest", label: "Not manifested", description: "Booked but not yet on a manifest" },
];

export function CustomerDashboard() {
  const { defaultCustomerId } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const scopedCustomerId =
    Number.isInteger(Number(defaultCustomerId)) && Number(defaultCustomerId) > 0
      ? Number(defaultCustomerId)
      : undefined;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: opsData, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-customer-ops", fromDate, toDate, scopedCustomerId],
    queryFn: () =>
      dashboardService.getOperationSummary({
        fromDate,
        toDate,
        customerId: scopedCustomerId,
      }),
    enabled: scopedCustomerId != null,
  });

  const buckets = opsData?.data.outbound.buckets;
  const summary = opsData?.data.outbound.summary;

  const applyFilters = () => void refetch();

  const resetFilters = () => {
    setFromDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
    void refetch();
  };

  if (!isMounted) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (!scopedCustomerId) {
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
        </p>
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
          value={summary?.booking ?? 0}
          icon={Package}
          color="purple"
          description="Shipments you booked in this period"
        />
        <StatsCard
          title="Out for delivery"
          value={buckets?.outForDelivery ?? 0}
          icon={Truck}
          color="blue"
          description="Currently with delivery executive"
        />
        <StatsCard
          title="Delivered"
          value={buckets?.delivered ?? 0}
          icon={MapPin}
          color="green"
          description="Completed deliveries"
        />
        <StatsCard
          title="Pending"
          value={buckets?.pending ?? 0}
          icon={Clock}
          color="orange"
          description="Awaiting pickup or movement"
        />
      </div>

      <Card className="shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status breakdown</CardTitle>
          <CardDescription>Counts for your shipments in the selected date range</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CUSTOMER_INSIGHT_ITEMS.map(({ key, label, description }) => (
              <li
                key={key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-muted/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <span className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
                  {buckets?.[key] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ExpressOutboundSummary data={opsData?.data} />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href="/transactions/shipment">View my shipments</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/transactions/tracking">Track AWB</Link>
        </Button>
      </div>
    </div>
  );
}
