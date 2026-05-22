export type HolidayStatus = "ACTIVE" | "INACTIVE";

export type Holiday = {
  id: number;
  holidayDate: string;
  name: string;
  description: string | null;
  status: HolidayStatus;
  createdAt: string;
  updatedAt: string;
};

export type HolidayFormData = {
  holidayDate: string;
  name: string;
  description?: string;
  status: HolidayStatus;
};

export type HolidayListResponse = {
  success: boolean;
  message: string;
  data: Holiday[];
  total: number;
  page: number;
  limit: number;
};

export type HolidaySingleResponse = {
  success: boolean;
  message: string;
  data: Holiday;
};
