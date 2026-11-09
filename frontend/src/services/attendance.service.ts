import { api, unwrap } from "@/lib/axios";
import type { ApiResponse, PageParams, Pagination } from "@/types/api";
import type { Attendance, MonthlyReportRow } from "@/types/attendance";

export interface AttendanceListParams extends PageParams {
  from?: string;
  to?: string;
  userId?: string;
}

export const attendanceService = {
  async checkIn(): Promise<Attendance> {
    const data = await api
      .post<ApiResponse<{ attendance: Attendance }>>("/attendance/check-in")
      .then(unwrap);
    return data.attendance;
  },

  async checkOut(): Promise<Attendance> {
    const data = await api
      .post<ApiResponse<{ attendance: Attendance }>>("/attendance/check-out")
      .then(unwrap);
    return data.attendance;
  },

  async getToday(): Promise<Attendance | null> {
    const data = await api
      .get<ApiResponse<{ attendance: Attendance | null }>>("/attendance/today")
      .then(unwrap);
    return data.attendance;
  },

  list: (params?: AttendanceListParams) =>
    api
      .get<ApiResponse<{ records: Attendance[]; pagination: Pagination }>>("/attendance", { params })
      .then(unwrap),

  monthlyReport: (params?: { month?: string; userId?: string }) =>
    api
      .get<ApiResponse<{ month: string; report: MonthlyReportRow[] }>>("/attendance/report", { params })
      .then(unwrap),
};