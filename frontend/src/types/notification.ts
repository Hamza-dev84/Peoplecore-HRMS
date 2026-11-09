export type NotificationType =
  | "leave_request"
  | "leave_approved"
  | "leave_rejected"
  | "announcement";

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}