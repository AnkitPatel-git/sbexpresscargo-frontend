export interface PodRow {
    AWBNo: string;
    shipmentId?: number | null;
    hasPodProof?: boolean;
    DelvDate: string;
    DelvTime: string;
    Recivername: string;
    ReciverTelNo: string;
    Remark: string;
    Comment: string;
    MSG: string;
}

export interface PodViewResponse {
    success: boolean;
    message: string;
    data: {
        podRows: PodRow[];
    };
}

export interface PodUploadResponse {
    success: boolean;
    message: string;
    data: {
        awbNos: string[];
        podRows: PodRow[];
    };
}

export interface PodProofUploadResult {
    awbNo: string;
    filePath: string;
    shipmentStatus: unknown | null;
}

export interface PodBulkProofUploadResponse {
    success: boolean;
    message: string;
    data: {
        uploaded: Array<{ filename: string; awbNo: string; filePath: string }>;
        failed: Array<{ filename: string; reason: string }>;
        podRows: PodRow[];
    };
}
