export type HrmsEmployeeStatus =
  | "PROBATION"
  | "ACTIVE"
  | "INACTIVE"
  | "RESIGNED"
  | "SEPARATED";

export type HrmsGender = "MALE" | "FEMALE" | "OTHER";

export type HrmsLeaveType = "CASUAL" | "SICK" | "EARNED" | "UNPAID" | "OTHER";

export type EmployeeEducation = {
  qualification: string;
  institution?: string;
  yearOfPassing?: number;
  grade?: string;
};

export type EmployeeJob = {
  companyName: string;
  designation?: string;
  fromDate?: string;
  toDate?: string;
};

export type EmployeeFamily = {
  name: string;
  relation: string;
  dateOfBirth?: string;
  phone?: string;
};

export type EmployeeDocument = {
  documentType: string;
  documentNumber?: string;
  fileName?: string;
  filePath?: string;
};

export type LinkableUser = {
  id: number;
  username: string;
  email: string;
  mobile: string | null;
  birthDate: string | null;
  joiningDate: string | null;
};

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  status: HrmsEmployeeStatus;
  dateOfBirth: string;
  gender: HrmsGender | "";
  personalEmail: string;
  workEmail: string;
  mobile: string;
  alternateMobile: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  department: string;
  designation: string;
  reportingManagerId: string;
  joiningDate: string;
  photographPath: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  aadhaarNumber: string;
  panNumber: string;
  userId: string;
  educations: EmployeeEducation[];
  previousJobs: EmployeeJob[];
  familyMembers: EmployeeFamily[];
  documents: EmployeeDocument[];
};

export type EmployeeListItem = {
  id: number;
  employeeCode: string;
  fullName: string;
  status: HrmsEmployeeStatus;
  department: string | null;
  designation: string | null;
  mobile: string | null;
  joiningDate: string | null;
  version: number;
  reportingManagerName: string | null;
};

export type EmployeeDetail = EmployeeFormValues & {
  id: number;
  employeeCode: string;
  fullName: string;
  version: number;
  confirmationDate: string | null;
  resignationDate: string | null;
  exitDate: string | null;
  exitReason: string | null;
  reportingManagerName: string | null;
  history: Array<{
    id: number;
    event: string;
    summary: string;
    createdAt: string;
  }>;
};

export type HrmsDashboard = {
  asOf: string;
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newJoinings: number;
  resignations: number;
  attendance: {
    present: number;
    absent: number;
    onLeave: number;
  };
  upcomingBirthdays: Array<{
    id: number;
    employeeCode: string;
    fullName: string;
    department: string | null;
    on: string;
  }>;
  upcomingAnniversaries: Array<{
    id: number;
    employeeCode: string;
    fullName: string;
    department: string | null;
    on: string;
    years: number;
  }>;
  pendingLeaveApprovals: Array<{
    id: number;
    leaveType: HrmsLeaveType;
    fromDate: string;
    toDate: string;
    reason: string | null;
    employee: {
      id: number;
      employeeCode: string;
      fullName: string;
      department: string | null;
    };
  }>;
};
