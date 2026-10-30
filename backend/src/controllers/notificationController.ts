import mongoose, { type QueryFilter } from "mongoose";
import Notification, { type INotification } from "../models/Notification";
import User, { type Role, type IUser } from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import { successResponse } from "../utilities/responseHandler";
import { sendNotificationToMany } from "../utilities/notify";

const getId = (id: unknown): string => {
  const value = String(id);
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, "Invalid notification id");
  }
  return value;
};

const listNotifications = asyncWrapper(async (req, res) => {
  const page = Math.max(parseInt(String(req.query.page), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: QueryFilter<INotification> = { user: req.user!._id };
  if (req.query.unread === "true") {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user!._id, isRead: false }),
  ]);

  successResponse({
    res,
    status: 200,
    message: "Notifications fetched successfully",
    data: {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

const getUnreadCount = asyncWrapper(async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    user: req.user!._id,
    isRead: false,
  });

  successResponse({
    res,
    status: 200,
    message: "Unread count fetched successfully",
    data: { unreadCount },
  });
});

const markAsRead = asyncWrapper(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: getId(req.params.id), user: req.user!._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  successResponse({
    res,
    status: 200,
    message: "Notification marked as read",
    data: { notification },
  });
});

const markAllAsRead = asyncWrapper(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user!._id, isRead: false },
    { isRead: true }
  );

  successResponse({
    res,
    status: 200,
    message: "All notifications marked as read",
    data: { updated: result.modifiedCount },
  });
});

const deleteNotification = asyncWrapper(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: getId(req.params.id),
    user: req.user!._id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  successResponse({
    res,
    status: 200,
    message: "Notification deleted successfully",
    data: null,
  });
});

const sendAnnouncement = asyncWrapper(async (req, res) => {
  const { title, message } = req.body ?? {};
  const audience = req.body?.audience ? String(req.body.audience) : "all";

  if (!title || !message) {
    throw new ApiError(400, "Title and message are required");
  }
  if (!["all", "employee", "hr"].includes(audience)) {
    throw new ApiError(400, "Audience must be one of: all, employee, hr");
  }


  const filter: QueryFilter<IUser> = {
    isActive: true,
    _id: { $ne: req.user!._id },
  };
  if (audience !== "all") {
    filter.role = audience as Role;
  }

  if (audience !== "all") {
    filter.role = audience as Role;
  }

  const recipients = await User.find(filter).select("_id");
  if (recipients.length === 0) {
    throw new ApiError(400, "No recipients found for this audience");
  }

  await sendNotificationToMany(
    recipients.map((user) => user._id),
    { type: "announcement", title: String(title), message: String(message) }
  );

  successResponse({
    res,
    status: 201,
    message: "Announcement sent successfully",
    data: { recipients: recipients.length },
  });
});

export {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendAnnouncement,
};