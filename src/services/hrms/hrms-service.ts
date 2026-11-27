import { API_BASE_URL, bearerHeaders } from "@/lib/api-base";
import { apiFetch } from "@/lib/api-fetch";
import type {
  EmployeeDetail,
  EmployeeFormValues,
  EmployeeListItem,
  LinkableUser,
  HrmsDashboard,
  HrmsEmployeeStatus,
  HrmsLeaveType,
} from "@/types/hrms/employee";

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const err = await response.json();
    const message = err?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message || fallback;
  } catch {
    return fallback;
  }
}

function payload(values: EmployeeFormValues, version?: number) {
  const optional = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };
  const numberOrUndefined = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? Number(trimmed) : undefined;
  };
  return {
    ...(version != null ? { version } : {}),
    employeeCode: optional(values.employeeCode),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    status: values.status,
    dateOfBirth: optional(values.dateOfBirth),
    gender: values.gender || undefined,
    personalEmail: optional(values.personalEmail),
    workEmail: optional(values.workEmail),
    mobile: optional(values.mobile),
    alternateMobile: optional(values.alternateMobile),
    addressLine1: optional(values.addressLine1),
    addressLine2: optional(values.addressLine2),
    city: optional(values.city),
    state: optional(values.state),
    pinCode: optional(values.pinCode),
    emergencyName: optional(values.emergencyName),
    emergencyPhone: optional(values.emergencyPhone),
    emergencyRelation: optional(values.emergencyRelation),
    department: optional(values.department),
    designation: optional(values.designation),
    organizationName: values.organizationName,
    reportingManagerId: numberOrUndefined(values.reportingManagerId),
    joiningDate: values.joiningDate,
    photographPath: optional(values.photographPath),
    bankAccountHolder: optional(values.bankAccountHolder),
    bankName: optional(values.bankName),
    bankAccountNumber: optional(values.bankAccountNumber),
    bankIfsc: optional(values.bankIfsc),
    aadhaarNumber: optional(values.aadhaarNumber),
    panNumber: optional(values.panNumber),
    userId: Number(values.userId),
    educations: values.educations.filter((row) => row.qualification.trim()),
    previousJobs: values.previousJobs.filter((row) => row.companyName.trim()),
    familyMembers: values.familyMembers.filter(
      (row) => row.name.trim() && row.relation.trim(),
    ),
    documents: values.documents.filter((row) => row.documentType.trim()),
  };
}

export const hrmsService = {
  async dashboard(): Promise<HrmsDashboard> {
    const response = await apiFetch(`${API_BASE_URL}/hrms/dashboard`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to load HR"));
    }
    const body = await response.json();
    return body.data;
  },

  async listEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: HrmsEmployeeStatus | "";
  }): Promise<{ data: EmployeeListItem[]; total: number }> {
    const q = new URLSearchParams();
    q.set("page", String(params?.page ?? 1));
    q.set("limit", String(params?.limit ?? 20));
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees?${q}`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to load employees"));
    }
    const body = await response.json();
    return { data: body.data ?? [], total: body.meta?.total ?? 0 };
  },

  async exportEmployees(params?: {
    search?: string;
    status?: HrmsEmployeeStatus | "";
  }): Promise<{ blob: Blob; filename: string }> {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    const suffix = q.toString() ? `?${q}` : "";
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/export${suffix}`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to download employees"));
    }
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename="?([^";\n]+)"?/i);
    return {
      blob: await response.blob(),
      filename: match?.[1]?.trim() || "employees.xlsx",
    };
  },

  async linkableUsers(includeUserId?: number): Promise<LinkableUser[]> {
    const q = new URLSearchParams();
    if (includeUserId) q.set("includeUserId", String(includeUserId));
    const suffix = q.toString() ? `?${q}` : "";
    const response = await apiFetch(
      `${API_BASE_URL}/hrms/employees/linkable-users${suffix}`,
      { headers: bearerHeaders(false) },
    );
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to load users"));
    }
    const body = await response.json();
    return body.data ?? [];
  },

  async employeeOptions(): Promise<
    Array<{
      id: number;
      employeeCode: string;
      fullName: string;
      status: string;
      department: string | null;
      username: string;
      email: string;
    }>
  > {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/options`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to load employees"));
    }
    const body = await response.json();
    return body.data ?? [];
  },

  async lookupPincode(pinCode: string): Promise<{ pinCode: string; city: string | null; state: string | null }> {
    const response = await apiFetch(
      `${API_BASE_URL}/hrms/employees/pincode-lookup?pinCode=${encodeURIComponent(pinCode)}`,
      { headers: bearerHeaders(false) },
    );
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to look up pincode"));
    }
    const body = await response.json();
    return body.data;
  },

  async uploadEmployeeDocument(
    file: File,
    kind: "document" | "photo" = "document",
  ): Promise<{ filePath: string; fileName: string }> {
    const body = new FormData();
    body.append("file", file);
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/documents/upload?kind=${kind}`, {
      method: "POST",
      headers: bearerHeaders(false),
      body,
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to upload image"));
    }
    const payload = await response.json();
    return payload.data;
  },

  employeeDocumentUrl(filePath: string, own = false) {
    const base = own
      ? `${API_BASE_URL}/hrms/employees/me/documents/file`
      : `${API_BASE_URL}/hrms/employees/documents/file`;
    return `${base}?path=${encodeURIComponent(filePath)}`;
  },

  async getMyEmployee(): Promise<EmployeeDetail | null> {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/me`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to load employee details"));
    }
    const body = await response.json();
    return body.data ?? null;
  },

  async getEmployee(id: number): Promise<EmployeeDetail> {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/${id}`, {
      headers: bearerHeaders(false),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to load employee"));
    }
    const body = await response.json();
    return body.data;
  },

  async createEmployee(values: EmployeeFormValues): Promise<EmployeeDetail> {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify(payload(values)),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to add employee"));
    }
    const body = await response.json();
    return body.data;
  },

  async updateEmployee(
    id: number,
    values: EmployeeFormValues,
    version: number,
  ): Promise<EmployeeDetail> {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/${id}`, {
      method: "PUT",
      headers: bearerHeaders(),
      body: JSON.stringify(payload(values, version)),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to update employee"));
    }
    const body = await response.json();
    return body.data;
  },

  async changeEmployeeStatus(id: number, version: number, status: HrmsEmployeeStatus) {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/${id}/status`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify({ version, status }),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to change status"));
    }
  },

  async confirmEmployee(id: number, version: number, confirmationDate: string) {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/${id}/confirm`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify({ version, confirmationDate }),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to confirm employee"));
    }
  },

  async exitEmployee(
    id: number,
    body: {
      version: number;
      status: "RESIGNED" | "SEPARATED";
      exitDate: string;
      resignationDate?: string;
      exitReason?: string;
    },
  ) {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/${id}/exit`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to record exit"));
    }
  },

  async transferEmployee(
    id: number,
    body: {
      version: number;
      department?: string;
      designation?: string;
      reportingManagerId?: number | null;
    },
  ) {
    const response = await apiFetch(`${API_BASE_URL}/hrms/employees/${id}/transfer`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to transfer employee"));
    }
  },

  async decideLeave(id: number, status: "APPROVED" | "REJECTED") {
    const response = await apiFetch(`${API_BASE_URL}/hrms/leave/${id}/decide`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to update leave"));
    }
  },

  async createLeave(body: {
    employeeId: number;
    leaveType: HrmsLeaveType;
    fromDate: string;
    toDate: string;
    reason?: string;
  }) {
    const response = await apiFetch(`${API_BASE_URL}/hrms/leave`, {
      method: "POST",
      headers: bearerHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Failed to record leave"));
    }
  },
};

function text(value: unknown) {
  return value == null ? "" : String(value);
}

export function employeeToForm(row: Record<string, unknown>): EmployeeFormValues {
  const list = <T,>(value: unknown, map: (item: Record<string, unknown>) => T) =>
    Array.isArray(value) ? value.map((item) => map(item as Record<string, unknown>)) : [];
  return {
    ...emptyEmployeeForm(),
    employeeCode: text(row.employeeCode),
    firstName: text(row.firstName),
    lastName: text(row.lastName),
    status: (text(row.status) || "PROBATION") as EmployeeFormValues["status"],
    dateOfBirth: text(row.dateOfBirth),
    gender: text(row.gender) as EmployeeFormValues["gender"],
    personalEmail: text(row.personalEmail),
    workEmail: text(row.workEmail),
    mobile: text(row.mobile),
    alternateMobile: text(row.alternateMobile),
    addressLine1: text(row.addressLine1),
    addressLine2: text(row.addressLine2),
    city: text(row.city),
    state: text(row.state),
    pinCode: text(row.pinCode),
    emergencyName: text(row.emergencyName),
    emergencyPhone: text(row.emergencyPhone),
    emergencyRelation: text(row.emergencyRelation),
    department: text(row.department),
    designation: text(row.designation),
    organizationName: text(row.organizationName) as EmployeeFormValues["organizationName"],
    reportingManagerId: row.reportingManagerId ? String(row.reportingManagerId) : "",
    joiningDate: text(row.joiningDate),
    photographPath: text(row.photographPath).startsWith("hrms-employee-photos/")
      ? text(row.photographPath)
      : "",
    bankAccountHolder: text(row.bankAccountHolder),
    bankName: text(row.bankName),
    bankAccountNumber: text(row.bankAccountNumber),
    bankIfsc: text(row.bankIfsc),
    aadhaarNumber: text(row.aadhaarNumber),
    panNumber: text(row.panNumber),
    userId: row.userId ? String(row.userId) : "",
    educations: list(row.educations, (item) => ({
      qualification: text(item.qualification),
      institution: text(item.institution),
      yearOfPassing: item.yearOfPassing == null ? undefined : Number(item.yearOfPassing),
      grade: text(item.grade),
    })),
    previousJobs: list(row.previousJobs, (item) => ({
      companyName: text(item.companyName),
      designation: text(item.designation),
      fromDate: text(item.fromDate),
      toDate: text(item.toDate),
    })),
    familyMembers: list(row.familyMembers, (item) => ({
      name: text(item.name),
      relation: text(item.relation),
      dateOfBirth: text(item.dateOfBirth),
      phone: text(item.phone),
    })),
    documents: list(row.documents, (item) => ({
      documentType: text(item.documentType),
      documentNumber: text(item.documentNumber),
      fileName: text(item.fileName),
      filePath: text(item.filePath),
    })),
  };
}

export function emptyEmployeeForm(): EmployeeFormValues {
  return {
    employeeCode: "",
    firstName: "",
    lastName: "",
    status: "PROBATION",
    dateOfBirth: "",
    gender: "",
    personalEmail: "",
    workEmail: "",
    mobile: "",
    alternateMobile: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    department: "",
    designation: "",
    organizationName: "",
    reportingManagerId: "",
    joiningDate: "",
    photographPath: "",
    bankAccountHolder: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    aadhaarNumber: "",
    panNumber: "",
    userId: "",
    educations: [],
    previousJobs: [],
    familyMembers: [],
    documents: [],
  };
}
