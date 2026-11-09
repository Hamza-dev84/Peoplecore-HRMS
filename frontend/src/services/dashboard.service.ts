import { api, unwrap } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AdminDashboard, DashboardData } from "@/types/dashboard";

export const isAdminDashboard = (data: DashboardData): data is AdminDashboard =>
  "employees" in data;

export const dashboardService = {
  get: () => api.get<ApiResponse<DashboardData>>("/dashboard").then(unwrap),
};