export interface OperationSummary {
    summary: string;
    reportGeneratedAt?: string;
    filters: {
        fromDate: string;
        toDate: string;
        serviceCenterId?: number | null;
        serviceCenterCode?: string | null;
        serviceCenterName?: string | null;
    };
    outbound: {
        summary: {
            pickupInscan: number;
            booking: number;
            manifesting: number;
        };
        buckets: {
            pickupInscan: number;
            booking: number;
            manifesting: number;
            outForDelivery: number;
            delivered: number;
            rto: number;
            pending: number;
            unDelivered: number;
            obc: number;
            hold: number;
            voidShipments: number;
            appointment: number;
            unManifest: number;
        };
    };
    inbound: {
        summary: {
            incoming: number;
            incomingReceived: number;
            pendingIncoming: number;
            delivered: number;
        };
        buckets: {
            incoming: number;
            incomingReceived: number;
            pendingIncoming: number;
            delivered: number;
            pending: number;
            unDelivered: number;
            onForwarding: number;
        };
    };
}

export interface SalesSummary {
    success: boolean;
    data: {
        summary: string;
        reportGeneratedAt: string;
        filters: {
            fromDate: string;
            toDate: string;
            serviceCenterId?: number | null;
        };
        totals: {
            totalSales: number;
            netSales: number;
            cashOutstanding: number;
        };
        graph: {
            metric: string;
            series: {
                date: string;
                value: number;
            }[];
        };
    };
}

export interface ServiceCenterSalesRow {
    serviceCenterId: number;
    serviceCenterCode: string;
    serviceCenterName: string;
    totalSales: number;
    shipmentCount: number;
}

export interface ServiceCenterSalesSummary {
    summary: string;
    reportGeneratedAt: string;
    filters: {
        year: number;
        month?: number;
        customerId?: number;
        serviceCenterId?: number;
    };
    rows: ServiceCenterSalesRow[];
}

export interface DashboardData {
    operations: OperationSummary;
    sales: SalesSummary["data"];
    serviceCenterSales: ServiceCenterSalesSummary;
}
