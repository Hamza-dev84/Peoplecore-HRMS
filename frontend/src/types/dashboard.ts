import type { LeaveStatus, Role } from "@/constants";
import type { Attendance } from "./attendance";
import type { Leave } from "./leave";

export interface EmployeeDashboard {
  role: Role;
  today: { date: string; attendance: Attendance | null };
  month: { month: string; presentDays: number; totalWorkedMinutes: number };
  leaves: { year: number; byStatus: Record<LeaveStatus, number>; upcoming: Leave[] };
  unreadNotifications: number;
  recentAttendance: Attendance[];
  recentLeaves: Leave[];
}

export interface AdminDashboard {
  role: Role;
  employees: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    byDepartment: { department: string; count: number }[];
    byRole?: { role: Role; count: number }[];
  };
  attendanceToday: {
    date: string;
    present: number;
    checkedOut: number;
    onLeave: number;
    absent: number;
  };
  attendanceLast7Days: { date: string; present: number }[];
  leaves: { pending: number; thisMonth: Record<LeaveStatus, number> };
  recentLeaves: Leave[];
  recentCheckIns: Attendance[];
  unreadNotifications: number;
}

export type DashboardData = EmployeeDashboard | AdminDashboard;