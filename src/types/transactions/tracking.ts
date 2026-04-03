export interface TrackingListItem {
    masterAwbNo: string | null;
    awbNo: string;
    bookingDate: string;
    runNo: string | null;
    airline: string | null;
    shipper: string | null;
    consignee: string | null;
    city: string | null;
    destination: string | null;
    pieces: number;
    chargeWeight: number;
    totalAmount: number | null;
    forwarder: string | null;
    deliveryDate: string | null;
    paymentType: string;
    manifestType: string | null;
}

export interface TrackingListResponse {
    success: boolean;
    data: TrackingListItem[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TrackingDetailResponse {
    success: boolean;
    data: {
        awbNo: string;
        customerDetails: any;
        podDetails: any;
        forwardingDetails: any;
        shipperDetails: any;
        consigneeDetails: any;
        obcDetails: any;
        progress: Array<{
            userId: number | null;
            date: string;
            time: string;
            serviceCenter: string | null;
            statusDetails: string;
            remark: string;
        }>;
        comment: any[];
        shipmentLog: any[];
        shipmentDetails: {
            date: string;
            dispatchDate: string;
            origin: string;
            destination: string;
            productType: string;
            product: string;
            vendor: string | null;
            service: string | null;
            shipValue: number | null;
            pcs: number;
            weight: string;
            vWgt: string | null;
            content: string | null;
            instruction: string | null;
            cod: number;
            manifestNo: string | null;
            invoiceNo: string | null;
            payment: string;
            inscanWeight: string | null;
            inscanRemark: string | null;
            refNo: string | null;
            masterAwbNo: string | null;
            commercial: string | null;
            oda: string | null;
            shipmentType: string | null;
            pincodeType: string | null;
            customerInvoice: string | null;
            fieldExecutive: string | null;
        };
        volumetricDetails: any[];
        proformaDetails: any[];
        inscan: any[];
        manifest: any[];
        manifestInscan: any[];
        manifestDetails: any[];
        statusDetails: Array<{
            user: number | null;
            date: string;
            time: string;
            status: string;
            remarks: string;
        }>;
        ndrProgress: any[];
    }
}
export interface TrackingMetrics {
    totalShipments: number;
    inTransit: number;
    delivered: number;
    exceptions: number;
    lastUpdated: string;
}

export interface ManualUpdatePayload {
    awbNo: string;
    status: string;
    remark?: string;
    serviceCenterId?: number;
}

export interface DeadLetterLog {
    id: number;
    awbNo: string;
    carrier: string;
    status: string;
    error: string;
    payload: string;
    createdAt: string;
    retryCount: number;
}

export interface MetricsResponse {
    success: boolean;
    data: TrackingMetrics;
}

export interface DeadLettersResponse {
    success: boolean;
    data: DeadLetterLog[];
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface TrackingSummary {
    awbNo: string;
    currentStatus: string;
    lastStatusAt: string;
    origin: string;
    destination: string;
    pieces: number;
    weight: string;
    customerName: string;
    vendorName: string;
    productName: string;
    cod: boolean;
}

export interface TrackingSummaryResponse {
    success: boolean;
    data: TrackingSummary;
}
