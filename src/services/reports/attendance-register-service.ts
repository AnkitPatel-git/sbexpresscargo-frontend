import { apiFetch } from "@/lib/api-fetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  };
}

function parseFilename(response: Response, fallback: string) {
  const cd = response.headers.get("content-disposition");
  const match = cd?.match(/filename="?([^";\n]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

async function readError(response: Response, fallback: string) {
  try {
    const err = await response.json();
    return err?.message || fallback;
  } catch {
    return fallback;
  }
}

export type AttendanceRegisterExportParams = {
  year: number;
  month: number;
  serviceCenterId?: number;
  customerId?: number;
};

export type AttendanceRegisterSummary = {
  p: number;
  halfDay: number;
  a: number;
  h: number;
  wo: number;
  hp: number;
  wop: number;
  leave: number;
  payDays: number;
};

export type AttendanceRegisterRow = {
  serial: number;
  userId: number;
  name: string;
  location: string;
  company: string;
  dayCodes: string[];
  summary: AttendanceRegisterSummary;
  status: string;
};

export type AttendanceRegisterDayHeader = {
  day: number;
  weekday: string;
};

export type AttendanceRegisterPreview = {
  year: number;
  month: number;
  monthTitle: string;
  daysInMonth: number;
  dayHeaders: AttendanceRegisterDayHeader[];
  summaryColumnKeys: readonly string[];
  rows: AttendanceRegisterRow[];
};

function buildQuery(params: AttendanceRegisterExportParams) {
  const q = new URLSearchParams();
  q.append("year", String(params.year));
  q.append("month", String(params.month));
  if (params.serviceCenterId != null) {
    q.append("serviceCenterId", String(params.serviceCenterId));
  }
  if (params.customerId != null) {
    q.append("customerId", String(params.customerId));
  }
  return q.toString();
}

export const attendanceRegisterService = {
  async fetchMonthRegisterPreview(
    params: AttendanceRegisterExportParams,
  ): Promise<AttendanceRegisterPreview> {
    const response = await apiFetch(
      `${API_URL}/mobile/attendance-admin/register?${buildQuery(params)}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to load attendance register"));
    }
    const body = (await response.json()) as { data?: AttendanceRegisterPreview };
    if (!body.data) {
      throw new Error("Invalid attendance register response");
    }
    return body.data;
  },

  async downloadMonthRegister(
    params: AttendanceRegisterExportParams,
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await apiFetch(
      `${API_URL}/mobile/attendance-admin/register.xlsx?${buildQuery(params)}`,
      { headers: authHeaders() },
    );
    if (!response.ok) {
      throw new Error(await readError(response, "Failed to download attendance register"));
    }
    const fallback = `attendance-register-${params.year}-${String(params.month).padStart(2, "0")}.xlsx`;
    return {
      blob: await response.blob(),
      filename: parseFilename(response, fallback),
    };
  },
};
