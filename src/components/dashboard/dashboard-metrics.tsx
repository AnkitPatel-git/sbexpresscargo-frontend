import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, DollarSign, Package, Truck, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export function StatsCard({ title, value, icon: Icon, description, trend, color = "blue" }: StatsCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    purple: "text-purple-600 bg-purple-50",
    red: "text-red-600 bg-red-50",
  };

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">since last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  salesTotal: {
    totalSales: number;
    netSales: number;
    cashOutstanding: number;
  };
  operationSummary: {
    booking: number;
    manifesting: number;
    delivered: number;
  };
}

export function DashboardMetrics({ salesTotal, operationSummary }: DashboardMetricsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Sales"
        value={formatCurrency(salesTotal.totalSales)}
        icon={DollarSign}
        color="blue"
        description="Gross revenue before deductions"
      />
      <StatsCard
        title="Net Sales"
        value={formatCurrency(salesTotal.netSales)}
        icon={TrendingUp}
        color="green"
        description="Total sales after returns/discounts"
      />
      <StatsCard
        title="Cash Outstanding"
        value={formatCurrency(salesTotal.cashOutstanding)}
        icon={TrendingDown}
        color="orange"
        description="Uncollected cash payments"
      />
      <StatsCard
        title="Total Bookings"
        value={operationSummary.booking}
        icon={Package}
        color="purple"
        description="Number of shipments booked"
      />
      <StatsCard
        title="Manifesting"
        value={operationSummary.manifesting}
        icon={Package}
        color="blue"
        description="Active manifest events"
      />
      <StatsCard
        title="Delivered"
        value={operationSummary.delivered}
        icon={Truck}
        color="green"
        description="Successfully delivered"
      />
    </div>
  );
}
