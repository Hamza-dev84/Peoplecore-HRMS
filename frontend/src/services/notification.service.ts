import { api, toMessage, unwrap } from "@/lib/axios";
import type { ApiResponse, PageParams, Pagination } from "@/types/api";
import type { Notification } from "@/types/notification";

export interface NotificationListParams extends PageParams {
  unread?: boolean;
}

export interface AnnouncementPayload {
  title: string;
  message: string;
  audience?: "all" | "employee" | "hr";
}

export const notificationService = {
  list: (params?: NotificationListParams) =>
    api
      .get<ApiResponse<{ notifications: Notification[]; unreadCount: number; pagination: Pagination }>>(
        "/notifications",
        { params }
      )
      .then(unwrap),

  async getUnreadCount(): Promise<number> {
    const data = await api
      .get<ApiResponse<{ unreadCount: number }>>("/notifications/unread-count")
      .then(unwrap);
    return data.unreadCount;
  },

  async markRead(id: string): Promise<Notification> {
    const data = await api
      .patch<ApiResponse<{ notification: Notification }>>(`/notifications/${id}/read`)
      .then(unwrap);
    return data.notification;
  },

  markAllRead: () =>
    api.patch<ApiResponse<{ updated: number }>>("/notifications/read-all").then(unwrap),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/notifications/${id}`).then(toMessage),

  sendAnnouncement: (payload: AnnouncementPayload) =>
    api
      .post<ApiResponse<{ recipients: number }>>("/notifications/announcement", payload)
      .then(unwrap),
};