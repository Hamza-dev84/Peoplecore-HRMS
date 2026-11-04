import mongoose, { type QueryFilter } from "mongoose";
import type { Request } from "express";
import Attendance, { type IAttendance } from "../models/Attendance";
import Leave, { LEAVE_STATUSES, type ILeave, type LeaveStatus } from "../models/Leave";
import User, { type IUser } from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import { sendReport } from "../utilities/report";
import {
    getToday,
    isValidDateString,
    isValidMonth,
    getMonthRange,
    formatTime,
} from "../utilities/date";

const MAX_ROWS = 5000;

type PopulatedUser = { name: string; email: string; department?: string } | null;

const getFormat = (req: Request): "csv" | "pdf" => {
    const format = req.query.format ? String(req.query.format).toLowerCase() : "csv";
    if (format !== "csv" && format !== "pdf") {
        throw new ApiError(400, "format must be csv or pdf");
    }
    return format;
};

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

const formatMinutes = (minutes: number): string =>
    `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const employeesReport = asyncWrapper(async (req, res) => {
    const format = getFormat(req);
    const department = req.query.department ? String(req.query.department).trim() : "";

    const filter: QueryFilter<IUser> = {};
    if (department) {
        filter.department = department;
    }

    const users = await User.find(filter).sort({ name: 1 }).limit(MAX_ROWS);

    sendReport(res, format, {
        filename: `employees-${getToday()}`,
        title: "Employees Report",
        subtitle: `Generated on ${getToday()}${department ? ` | Department: ${department}` : ""} | Total: ${users.length}`,
        headers: ["Name", "Email", "Role", "Department", "Designation", "Phone", "Joining Date", "Status"],
        rows: users.map((user) => [
            user.name,
            user.email,
            user.role,
            user.department,
            user.designation,
            user.phone,
            user.joiningDate ? user.joiningDate.toISOString().slice(0, 10) : "",
            user.isActive ? "Active" : "Inactive",
        ]),
    });
});

const attendanceReport = asyncWrapper(async (req, res) => {
    const format = getFormat(req);
    const month = req.query.month ? String(req.query.month) : getToday().slice(0, 7);

    if (!isValidMonth(month)) {
        throw new ApiError(400, "month must be in YYYY-MM format");
    }

    const userId = resolveUserId(req);
    const { start, end } = getMonthRange(month);

    const filter: QueryFilter<IAttendance> = { date: { $gte: start, $lt: end } };
    if (userId) {
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    const records = await Attendance.find(filter)
        .populate("user", "name email department")
        .sort({ date: 1 })
        .limit(MAX_ROWS);

    sendReport(res, format, {
        filename: `attendance-${month}`,
        title: "Attendance Report",
        subtitle: `Month: ${month} | Records: ${records.length}`,
        headers: ["Date", "Name", "Email", "Department", "Check In", "Check Out", "Worked"],
        rows: records.map((record) => {
            const user = record.user as unknown as PopulatedUser;
            return [
                record.date,
                user?.name,
                user?.email,
                user?.department,
                formatTime(record.checkIn),
                formatTime(record.checkOut),
                record.checkOut ? formatMinutes(record.workedMinutes) : "",
            ];
        }),
    });
});

const leavesReport = asyncWrapper(async (req, res) => {
    const format = getFormat(req);
    const from = req.query.from ? String(req.query.from) : undefined;
    const to = req.query.to ? String(req.query.to) : undefined;

    if ((from && !isValidDateString(from)) || (to && !isValidDateString(to))) {
        throw new ApiError(400, "from and to must be in YYYY-MM-DD format");
    }

    const filter: QueryFilter<ILeave> = {};

    const userId = resolveUserId(req);
    if (userId) {
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    if (req.query.status) {
        const status = String(req.query.status);
        if (!(LEAVE_STATUSES as readonly string[]).includes(status)) {
            throw new ApiError(400, `Status must be one of: ${LEAVE_STATUSES.join(", ")}`);
        }
        filter.status = status as LeaveStatus;
    }

    if (from || to) {
        const dateFilter: Record<string, string> = {};
        if (from) dateFilter.$gte = from;
        if (to) dateFilter.$lte = to;
        filter.startDate = dateFilter;
    }

    const leaves = await Leave.find(filter)
        .populate("user", "name email department")
        .populate("reviewedBy", "name")
        .sort({ startDate: -1 })
        .limit(MAX_ROWS);

    sendReport(res, format, {
        filename: `leaves-${getToday()}`,
        title: "Leave Report",
        subtitle: `Generated on ${getToday()} | Records: ${leaves.length}`,
        headers: ["Name", "Email", "Type", "Start", "End", "Days", "Status", "Reason", "Reviewed By", "Comment"],
        rows: leaves.map((leave) => {
            const user = leave.user as unknown as PopulatedUser;
            const reviewer = leave.reviewedBy as unknown as { name: string } | null | undefined;
            return [
                user?.name,
                user?.email,
                leave.leaveType,
                leave.startDate,
                leave.endDate,
                leave.totalDays,
                leave.status,
                leave.reason,
                reviewer?.name,
                leave.reviewComment,
            ];
        }),
    });
});

export { employeesReport, attendanceReport, leavesReport };