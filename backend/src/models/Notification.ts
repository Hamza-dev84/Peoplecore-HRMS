import mongoose, { Schema, type Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "leave_request",
  "leave_approved",
  "leave_rejected",
  "announcement",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: [...NOTIFICATION_TYPES], required: true },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;