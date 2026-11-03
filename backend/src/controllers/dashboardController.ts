import type { Request } from "express";
import Attendance from "../models/Attendance";
import Leave, { type LeaveStatus } from "../models/Leave";
import Notification from "../models/Notification";
import User from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import { successResponse } from "../utilities/responseHandler";
import { getToday, getMonthRange, getLastDays } from "../utilities/date";

type StatusRow = { _id: LeaveStatus; count: number };

const toStatusCounts = (rows: StatusRow[]): Record<LeaveStatus, number> => {
    const counts: Record<LeaveStatus, number> = {
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
    };

    rows.forEach((row) => {
        counts[row._id] = row.count;
    });
    return counts;
};

const buildEmployeeDashboard = async (req: Request) => {
    const userId = req.user!._id;
    const today = getToday();
    const month = today.slice(0, 7);
    const { start, end } = getMonthRange(month);
    const year = Number(today.slice(0, 4));

    const [
        todayAttendance,
        monthRows,
        leaveRows,
        upcomingLeaves,
        unreadNotifications,
        recentAttendance,
        recentLeaves,
    ] = await Promise.all([
        Attendance.findOne({ user: userId, date: today }),
        Attendance.aggregate<{ presentDays: number; totalWorkedMinutes: number }>([
            { $match: { user: userId, date: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: null,
                    presentDays: { $sum: 1 },
                    totalWorkedMinutes: { $sum: "$workedMinutes" },
                },
            },
        ]),
        Leave.aggregate<StatusRow>([
            {
                $match: {
                    user: userId,
                    startDate: { $gte: `${year}-01-01`, $lt: `${year + 1}-01-01` },
                },
            },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Leave.find({ user: userId, status: "approved", endDate: { $gte: today } })
            .sort({ startDate: 1 })
            .limit(3),
        Notification.countDocuments({ user: userId, isRead: false }),
        Attendance.find({ user: userId }).sort({ date: -1 }).limit(5),
        Leave.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    return {
        role: req.user!.role,
        today: { date: today, attendance: todayAttendance },
        month: {
            month,
            presentDays: monthRows[0]?.presentDays ?? 0,
            totalWorkedMinutes: monthRows[0]?.totalWorkedMinutes ?? 0,
        },
        leaves: { year, byStatus: toStatusCounts(leaveRows), upcoming: upcomingLeaves },
        unreadNotifications,
        recentAttendance,
        recentLeaves,
    };
};

const buildAdminDashboard = async (req: Request) => {
    const isSuperAdmin = req.user!.role === "super_admin";
    const today = getToday();
    const month = today.slice(0, 7);
    const { start, end } = getMonthRange(month);
    const days = getLastDays(7);

    const [
        totalUsers,
        activeUsers,
        newThisMonth,
        byDepartment,
        byRole,
        presentToday,
        checkedOutToday,
        onLeaveToday,
        last7Rows,
        pendingLeaves,
        monthLeaveRows,
        recentLeaves,
        recentCheckIns,
        unreadNotifications,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: new Date(`${start}T00:00:00Z`) } }),
        User.aggregate<{ _id: string; count: number }>([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $gt: [{ $strLenCP: { $ifNull: ["$department", ""] } }, 0] },
                            "$department",
                            "Unassigned",
                        ],
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]),
        isSuperAdmin
            ? User.aggregate<{ _id: string; count: number }>([
                { $group: { _id: "$role", count: { $sum: 1 } } },
            ])
            : Promise.resolve([]),
        Attendance.countDocuments({ date: today }),
        Attendance.countDocuments({ date: today, checkOut: { $exists: true } }),
        Leave.countDocuments({
            status: "approved",
            startDate: { $lte: today },
            endDate: { $gte: today },
        }),
        Attendance.aggregate<{ _id: string; present: number }>([
            { $match: { date: { $in: days } } },
            { $group: { _id: "$date", present: { $sum: 1 } } },
        ]),
        Leave.countDocuments({ status: "pending" }),
        Leave.aggregate<StatusRow>([
            { $match: { startDate: { $gte: start, $lt: end } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Leave.find()
            .populate("user", "name email department")
            .sort({ createdAt: -1 })
            .limit(5),
        Attendance.find({ date: today })
            .populate("user", "name email department")
            .sort({ checkIn: -1 })
            .limit(5),
        Notification.countDocuments({ user: req.user!._id, isRead: false }),
    ]);

    const presentByDate = new Map(last7Rows.map((row) => [row._id, row.present]));

    return {
        role: req.user!.role,
        employees: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            newThisMonth,
            byDepartment: byDepartment.map((row) => ({ department: row._id, count: row.count })),
            ...(isSuperAdmin && {
                byRole: byRole.map((row) => ({ role: row._id, count: row.count })),
            }),
        },
        attendanceToday: {
            date: today,
            present: presentToday,
            checkedOut: checkedOutToday,
            onLeave: onLeaveToday,
            absent: Math.max(activeUsers - presentToday - onLeaveToday, 0),
        },
        attendanceLast7Days: days.map((date) => ({
            date,
            present: presentByDate.get(date) ?? 0,
        })),
        leaves: {
            pending: pendingLeaves,
            thisMonth: toStatusCounts(monthLeaveRows),
        },
        recentLeaves,
        recentCheckIns,
        unreadNotifications,
    };
};

const getDashboard = asyncWrapper(async (req, res) => {
    const data =
        req.user!.role === "employee"
            ? await buildEmployeeDashboard(req)
            : await buildAdminDashboard(req);

    successResponse({
        res,
        status: 200,
        message: "Dashboard fetched successfully",
        data,
    });
});

export { getDashboard };