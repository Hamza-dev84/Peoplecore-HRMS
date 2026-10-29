import mongoose, { type QueryFilter } from "mongoose";
import type { Request } from "express";
import Attendance, { type IAttendance } from "../models/Attendance";
import User from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import { successResponse } from "../utilities/responseHandler";
import {
  getToday,
  isValidDateString,
  isValidMonth,
  getMonthRange,
} from "../utilities/date";

const resolveUserId = (req: Request): string | undefined => {
  if (req.user!.role === "employee") {
    return req.user!.id;
  }

  const userId = req.query.userId ? String(req.query.userId) : undefined;
  if (userId && !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }
  return userId;
};

const checkIn = asyncWrapper(async (req, res) => {
  const today = getToday();

  const existing = await Attendance.findOne({ user: req.user!._id, date: today });
  if (existing) {
    throw new ApiError(400, "You have already checked in today");
  }

  const attendance = await Attendance.create({
    user: req.user!._id,
    date: today,
    checkIn: new Date(),
  });

  successResponse({
    res,
    status: 201,
    message: "Checked in successfully",
    data: { attendance },
  });
});

const checkOut = asyncWrapper(async (req, res) => {
  const attendance = await Attendance.findOne({
    user: req.user!._id,
    date: getToday(),
  });

  if (!attendance) {
    throw new ApiError(400, "You have not checked in today");
  }

  const now = new Date();
  attendance.checkOut = now;
  attendance.workedMinutes = Math.max(
    Math.round((now.getTime() - attendance.checkIn.getTime()) / 60000),
    0
  );
  await attendance.save();

  successResponse({
    res,
    status: 200,
    message: "Checked out successfully",
    data: { attendance },
  });
});

const getTodayAttendance = asyncWrapper(async (req, res) => {
  const attendance = await Attendance.findOne({
    user: req.user!._id,
    date: getToday(),
  });

  successResponse({
    res,
    status: 200,
    message: "Today's attendance fetched successfully",
    data: { attendance },
  });
});

const listAttendance = asyncWrapper(async (req, res) => {
  const page = Math.max(parseInt(String(req.query.page), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const userId = resolveUserId(req);
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;

  if ((from && !isValidDateString(from)) || (to && !isValidDateString(to))) {
    throw new ApiError(400, "from and to must be in YYYY-MM-DD format");
  }

  const filter: QueryFilter<IAttendance> = {};
  if (userId) {
    filter.user = new mongoose.Types.ObjectId(userId);
  }
  if (from || to) {
    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.$gte = from;
    if (to) dateFilter.$lte = to;
    filter.date = dateFilter;
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("user", "name email department")
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  successResponse({
    res,
    status: 200,
    message: "Attendance fetched successfully",
    data: {
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});

const monthlyReport = asyncWrapper(async (req, res) => {
  const month = req.query.month ? String(req.query.month) : getToday().slice(0, 7);

  if (!isValidMonth(month)) {
    throw new ApiError(400, "month must be in YYYY-MM format");
  }

  const userId = resolveUserId(req);
  const { start, end } = getMonthRange(month);

  const match: Record<string, unknown> = { date: { $gte: start, $lt: end } };
  if (userId) {
    match.user = new mongoose.Types.ObjectId(userId);
  }

  const totals = await Attendance.aggregate<{
    _id: mongoose.Types.ObjectId;
    presentDays: number;
    totalWorkedMinutes: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: "$user",
        presentDays: { $sum: 1 },
        totalWorkedMinutes: { $sum: "$workedMinutes" },
      },
    },
  ]);

  const users = await User.find({ _id: { $in: totals.map((t) => t._id) } }).select(
    "name email department"
  );

  const report = totals
    .map((t) => ({
      user: users.find((u) => u.id === t._id.toString()) ?? null,
      presentDays: t.presentDays,
      totalWorkedMinutes: t.totalWorkedMinutes,
      averageMinutesPerDay: Math.round(t.totalWorkedMinutes / t.presentDays),
    }))
    .sort((a, b) => (a.user?.name ?? "").localeCompare(b.user?.name ?? ""));

  successResponse({
    res,
    status: 200,
    message: "Monthly report fetched successfully",
    data: { month, report },
  });
});

export { checkIn, checkOut, getTodayAttendance, listAttendance, monthlyReport };