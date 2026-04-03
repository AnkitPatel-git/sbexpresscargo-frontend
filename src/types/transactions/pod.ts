export interface PodRow {
    AWBNo: string;
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
