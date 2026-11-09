import type { UserSummary } from "./user";

export interface Attendance {
  _id: string;
  user: string | UserSummary;
  date: string;
  checkIn: string;
  checkOut?: string;
  workedMinutes: number;
}

export interface MonthlyReportRow {
  user: UserSummary | null;
  presentDays: number;
  totalWorkedMinutes: number;
  averageMinutesPerDay: number;
}