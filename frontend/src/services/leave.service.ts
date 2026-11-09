import { api, unwrap } from "@/lib/axios";
import type { LeaveStatus, LeaveType } from "@/constants";
import type { ApiResponse, PageParams, Pagination } from "@/types/api";
import type { Leave } from "@/types/leave";

export interface ApplyLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveListParams extends PageParams {
  status?: LeaveStatus;
  userId?: string;
}

type LeaveList = { leaves: Leave[]; pagination: Pagination };
type LeaveOne = { leave: Leave };

export const leaveService = {
  async apply(payload: ApplyLeavePayload): Promise<Leave> {
    const data = await api.post<ApiResponse<LeaveOne>>("/leaves", payload).then(unwrap);
    return data.leave;
  },

  list: (params?: LeaveListParams) =>
    api.get<ApiResponse<LeaveList>>("/leaves", { params }).then(unwrap),

  myLeaves: (params?: LeaveListParams) =>
    api.get<ApiResponse<LeaveList>>("/leaves/my", { params }).then(unwrap),

  async getById(id: string): Promise<Leave> {
    const data = await api.get<ApiResponse<LeaveOne>>(`/leaves/${id}`).then(unwrap);
    return data.leave;
  },

  async approve(id: string, comment?: string): Promise<Leave> {
    const data = await api
      .patch<ApiResponse<LeaveOne>>(`/leaves/${id}/approve`, { comment })
      .then(unwrap);
    return data.leave;
  },

  async reject(id: string, comment: string): Promise<Leave> {
    const data = await api
      .patch<ApiResponse<LeaveOne>>(`/leaves/${id}/reject`, { comment })
      .then(unwrap);
    return data.leave;
  },

  async cancel(id: string): Promise<Leave> {
    const data = await api.patch<ApiResponse<LeaveOne>>(`/leaves/${id}/cancel`).then(unwrap);
    return data.leave;
  },
};