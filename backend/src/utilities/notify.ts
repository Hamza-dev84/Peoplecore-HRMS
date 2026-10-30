import type { Types } from "mongoose";
import Notification, { type NotificationType } from "../models/Notification";
import User from "../models/User";
import sendEmail from "./sendEmail";

interface NotifyData {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const sendNotification = async (
  userId: string | Types.ObjectId,
  data: NotifyData,
  email = false
): Promise<void> => {
  try {
    await Notification.create({ user: userId, ...data });

    if (email) {
      const user = await User.findById(userId).select("name email");
      if (user) {
        await sendEmail({
          to: user.email,
          subject: data.title,
          html: `<p>Hi ${escapeHtml(user.name)},</p><p>${escapeHtml(data.message)}</p>`,
        });
      }
    }
  } catch (error) {
    console.error("Notification failed:", error);
  }
};

export const sendNotificationToMany = async (
  userIds: (string | Types.ObjectId)[],
  data: NotifyData
): Promise<void> => {
  if (userIds.length === 0) return;

  try {
    await Notification.insertMany(userIds.map((userId) => ({ user: userId, ...data })));
  } catch (error) {
    console.error("Notification failed:", error);
  }
};