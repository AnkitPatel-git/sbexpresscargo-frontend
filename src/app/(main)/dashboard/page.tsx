"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Package,
  DollarSign,
  Search,
  Calendar,
  Truck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { dashboardService } from "@/services/dashboard-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { StatsCard } from "@/components/dashboard/dashboard-metrics";
import { SalesTrendChart, ServiceCenterSalesChart } from "@/components/dashboard/dashboard-charts";
import { ExpressInboundSummary, ExpressOutboundSummary } from "@/components/dashboard/express-operation-summary";

export default function DashboardPage() {
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [serviceCenterId, setServiceCenterId] = useState<number | undefined>(undefined);

  const { data: serviceCentersData } = useQuery({
    queryKey: ["service-centers-master"],
    queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
  });

  const serviceCenterOptions = serviceCentersData?.data.map((sc) => ({
    label: `${sc.name} (${sc.code})`,
    value: sc.id,
  })) || [];

  const { data: opsData, isLoading: isLoadingOps, refetch: refetchOps } = useQuery({
    queryKey: ["dashboard-ops", fromDate, toDate, serviceCenterId],
    queryFn: () => dashboardService.getOperationSummary({ fromDate, toDate, serviceCenterId }),
  });

  const { data: salesData, isLoading: isLoadingSales, refetch: refetchSales } = useQuery({
    queryKey: ["dashboard-sales", fromDate, toDate, serviceCenterId],
    queryFn: () => dashboardService.getSalesSummary({ fromDate, toDate, serviceCenterId }),
  });

  const currentYear = new Date(fromDate).getFullYear();
  const { data: scSalesData, isLoading: isLoadingScSales, refetch: refetchScSales } = useQuery({
    queryKey: ["dashboard-sc-sales", currentYear, serviceCenterId],
    queryFn: () =>
      dashboardService.getSalesByServiceCenters({
        year: currentYear,
        serviceCenterId,
      }),
  });

  const refreshAll = () => {
    refetchOps();
    refetchSales();
    refetchScSales();
  };

  const applyFilters = () => {
    refetchOps();
    refetchSales();
    refetchScSales();
  };

  const isLoading = isLoadingOps || isLoadingSales || isLoadingScSales;

  const salesTrend = salesData?.data.graph.series || [];
  const scSales =
    scSalesData?.data.rows?.map((row) => ({
      name: row.serviceCenterName,
      sales: row.totalSales,
      count: row.shipmentCount,
    })) || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="operation" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <TabsList className="h-10 p-1">
            <TabsTrigger value="operation" className="gap-2 px-5 data-[state=active]:shadow-none">
              <Package className="h-4 w-4" />
              Operation
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2 px-5 data-[state=active]:shadow-none">
              <DollarSign className="h-4 w-4" />
              Sales
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="gap-0 py-4 shadow-[0_1px_3px_rgba(23,42,69,0.08)]">
          <CardContent className="space-y-4 px-4 py-0 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="h-9 bg-background pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="h-9 bg-background pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Origin
                  </label>
                  <div className="flex gap-1">
                    <Input className="h-9 flex-1 bg-background" placeholder="Code" />
                    <Input className="h-9 flex-1 bg-background" placeholder="Name" />
                    <Button type="button" size="icon" variant="default" className="h-9 w-9 shrink-0" title="Search">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Service Center
                  </label>
                  <div className="flex gap-1">
                    <Combobox
                      options={serviceCenterOptions}
                      value={serviceCenterId}
                      onChange={(value) =>
                        setServiceCenterId(value === "" ? undefined : typeof value === "number" ? value : Number(value))
                      }
                      placeholder="All"
                      className="h-9 flex-1 border bg-background"
                    />
                    <Button type="button" size="icon" variant="default" className="h-9 w-9 shrink-0" title="Search">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-3 xl:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </label>
                  <Input className="h-9 bg-background" defaultValue="Dashboard Summary" readOnly />
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center xl:flex-col xl:items-end">
                <p className="hidden text-right text-xs text-muted-foreground lg:block max-w-[200px]">
                  Click on search to View Dashboard
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="success" className="min-w-[100px] font-semibold" onClick={applyFilters} disabled={isLoading}>
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                  <Button
                    type="button"
                    variant="expressDanger"
                    className="min-w-[100px] font-semibold"
                    onClick={() => {
                      setFromDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
                      setToDate(format(new Date(), "yyyy-MM-dd"));
                      setServiceCenterId(undefined);
                      refreshAll();
                    }}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="operation" className="mt-0 space-y-6 outline-none">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Total Bookings"
              value={opsData?.data.outbound.summary.booking ?? 0}
              icon={Package}
              color="purple"
              description="Number of shipments booked"
            />
            <StatsCard
              title="Manifesting"
              value={opsData?.data.outbound.summary.manifesting ?? 0}
              icon={Package}
              color="blue"
              description="Active manifest events"
            />
            <StatsCard
              title="Successful Deliveries"
              value={opsData?.data.inbound.summary.delivered ?? 0}
              icon={Truck}
              color="green"
              description="Completed deliveries"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ExpressOutboundSummary data={opsData?.data} />
            <ExpressInboundSummary data={opsData?.data} />
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-0 space-y-6 outline-none">
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              title="Total Sales"
              value={formatCurrency(salesData?.data.totals.totalSales || 0)}
              icon={DollarSign}
              color="blue"
              description="Gross revenue before deductions"
            />
            <StatsCard
              title="Net Sales"
              value={formatCurrency(salesData?.data.totals.netSales || 0)}
              icon={TrendingUp}
              color="green"
              description="Total sales after returns/discounts"
            />
            <StatsCard
              title="Cash Outstanding"
              value={formatCurrency(salesData?.data.totals.cashOutstanding || 0)}
              icon={TrendingDown}
              color="orange"
              description="Uncollected cash payments"
            />
          </div>

          <SalesTrendChart data={salesTrend} />
          <ServiceCenterSalesChart data={scSales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
