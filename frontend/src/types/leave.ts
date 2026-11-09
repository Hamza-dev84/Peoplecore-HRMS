import type { LeaveStatus, LeaveType } from "@/constants";
import type { UserSummary } from "./user";

export interface Leave {
  _id: string;
  user: string | UserSummary;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | { _id: string; name: string };
  reviewedAt?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}