"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Filter, 
  RefreshCw,
  Download,
  LayoutDashboard
} from "lucide-react";
import { format, subDays } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { dashboardService } from "@/services/dashboard-service";
import { serviceCenterService } from "@/services/masters/service-center-service";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { SalesTrendChart, ServiceCenterSalesChart, OperationPieChart } from "@/components/dashboard/dashboard-charts";

export default function DashboardPage() {
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [serviceCenterId, setServiceCenterId] = useState<number | undefined>(undefined);

  // Fetch service centers for filter
  const { data: serviceCentersData } = useQuery({
    queryKey: ["service-centers-master"],
    queryFn: () => serviceCenterService.getServiceCenters({ limit: 100 }),
  });

  const serviceCenterOptions = serviceCentersData?.data.map(sc => ({
    label: `${sc.name} (${sc.code})`,
    value: sc.id
  })) || [];

  // Fetch Operation Summary
  const { data: opsData, isLoading: isLoadingOps, refetch: refetchOps } = useQuery({
    queryKey: ["dashboard-ops", fromDate, toDate, serviceCenterId],
    queryFn: () => dashboardService.getOperationSummary({ fromDate, toDate, serviceCenterId }),
  });

  // Fetch Sales Summary
  const { data: salesData, isLoading: isLoadingSales, refetch: refetchSales } = useQuery({
    queryKey: ["dashboard-sales", fromDate, toDate, serviceCenterId],
    queryFn: () => dashboardService.getSalesSummary({ fromDate, toDate, serviceCenterId }),
  });

  // Fetch Sales by Service Center (requires Year)
  const currentYear = new Date(fromDate).getFullYear();
  const { data: scSalesData, isLoading: isLoadingScSales, refetch: refetchScSales } = useQuery({
    queryKey: ["dashboard-sc-sales", currentYear, serviceCenterId],
    queryFn: () => dashboardService.getSalesByServiceCenters({ 
      year: currentYear, 
      serviceCenterId 
    }),
  });

  const refreshAll = () => {
    refetchOps();
    refetchSales();
    refetchScSales();
  };

  const isLoading = isLoadingOps || isLoadingSales || isLoadingScSales;

  // Prepare data for charts
  const salesTrend = salesData?.data.graph.series || [];
  const scSales = scSalesData?.data.rows?.map(row => ({
    name: row.serviceCenterName,
    sales: row.totalSales,
    count: row.shipmentCount
  })) || [];

  const inboundBreakdown = opsData ? [
    { name: 'Received', value: opsData.data.inbound.summary.incomingReceived },
    { name: 'Pending', value: opsData.data.inbound.summary.pendingIncoming },
    { name: 'Delivered', value: opsData.data.inbound.summary.delivered },
  ] : [];

  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Dashboard</h1>
          </div>
          <p className="text-slate-500">Real-time overview of your logistics performance and sales.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white/80 backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">From Date</label>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[180px] bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">To Date</label>
              <Input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                className="w-[180px] bg-white"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Center</label>
              <Combobox
                options={serviceCenterOptions}
                value={serviceCenterId}
                onChange={setServiceCenterId}
                placeholder="All Service Centers"
                className="bg-white"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => {
              setFromDate(format(subDays(new Date(), 30), "yyyy-MM-dd"));
              setToDate(format(new Date(), "yyyy-MM-dd"));
              setServiceCenterId(undefined);
            }} title="Reset Filters">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Section */}
      <DashboardMetrics 
        salesTotal={{
          totalSales: salesData?.data.totals.totalSales || 0,
          netSales: salesData?.data.totals.netSales || 0,
          cashOutstanding: salesData?.data.totals.cashOutstanding || 0,
        }}
        operationSummary={{
          booking: opsData?.data.outbound.summary.booking || 0,
          manifesting: opsData?.data.outbound.summary.manifesting || 0,
          delivered: opsData?.data.inbound.summary.delivered || 0,
        }}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <div className="lg:col-span-4">
          <SalesTrendChart data={salesTrend} />
        </div>
        <div className="lg:col-span-2">
          <OperationPieChart data={inboundBreakdown} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ServiceCenterSalesChart data={scSales.slice(0, 5)} />
        </div>
        
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Inbound Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <span className="text-sm font-medium">Pending Incoming</span>
                <span className="text-lg font-bold text-blue-700">{opsData?.data.inbound.summary.pendingIncoming || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                <span className="text-sm font-medium">Received Today</span>
                <span className="text-lg font-bold text-green-700">{opsData?.data.inbound.summary.incomingReceived || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-sm font-medium">Total Inbound</span>
                <span className="text-lg font-bold text-slate-700">{opsData?.data.inbound.summary.incoming || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
