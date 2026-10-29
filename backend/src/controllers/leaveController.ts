import mongoose, { type QueryFilter } from "mongoose";
import type { Request } from "express";
import Leave, { LEAVE_TYPES, LEAVE_STATUSES, type ILeave, type LeaveStatus } from "../models/Leave";
import User from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import { successResponse } from "../utilities/responseHandler";
import { getToday, isValidDateString } from "../utilities/date";

const getId = (req: Request): string => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid leave id");
    }
    return id;
};

const calculateDays = (start: string, end: string): number =>
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;

const fetchLeaves = async (req: Request, ownOnly: boolean) => {
    const page = Math.max(parseInt(String(req.query.page), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: QueryFilter<ILeave> = {};

    if (ownOnly) {
        filter.user = req.user!._id;
    } else if (req.query.userId) {
        const userId = String(req.query.userId);
        if (!mongoose.isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user id");
        }
        filter.user = new mongoose.Types.ObjectId(userId);
    }

    if (req.query.status) {
        const status = String(req.query.status);
        if (!(LEAVE_STATUSES as readonly string[]).includes(status)) {
            throw new ApiError(400, `Status must be one of: ${LEAVE_STATUSES.join(", ")}`);
        }
        filter.status = status as LeaveStatus;
    }

    const [leaves, total] = await Promise.all([
        Leave.find(filter)
            .populate("user", "name email department")
            .populate("reviewedBy", "name")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit),
        Leave.countDocuments(filter),
    ]);

    return {
        leaves,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
};

const applyLeave = asyncWrapper(async (req, res) => {
    const { leaveType, startDate, endDate, reason } = req.body ?? {};

    if (!leaveType || !startDate || !endDate || !reason) {
        throw new ApiError(400, "Leave type, start date, end date and reason are required");
    }
    if (!(LEAVE_TYPES as readonly string[]).includes(String(leaveType))) {
        throw new ApiError(400, `Leave type must be one of: ${LEAVE_TYPES.join(", ")}`);
    }

    const start = String(startDate);
    const end = String(endDate);

    if (!isValidDateString(start) || !isValidDateString(end)) {
        throw new ApiError(400, "Dates must be in YYYY-MM-DD format");
    }
    if (end < start) {
        throw new ApiError(400, "End date cannot be before start date");
    }
    if (start < getToday()) {
        throw new ApiError(400, "Leave cannot start in the past");
    }

    const overlap = await Leave.findOne({
        user: req.user!._id,
        status: { $in: ["pending", "approved"] },
        startDate: { $lte: end },
        endDate: { $gte: start },
    });
    if (overlap) {
        throw new ApiError(400, "You already have a leave request for these dates");
    }

    const leave = await Leave.create({
        user: req.user!._id,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays: calculateDays(start, end),
        reason,
    });

    successResponse({
        res,
        status: 201,
        message: "Leave request submitted successfully",
        data: { leave },
    });
});

const listLeaves = asyncWrapper(async (req, res) => {
    const data = await fetchLeaves(req, req.user!.role === "employee");

    successResponse({
        res,
        status: 200,
        message: "Leave requests fetched successfully",
        data,
    });
});

const myLeaves = asyncWrapper(async (req, res) => {
    const data = await fetchLeaves(req, true);

    successResponse({
        res,
        status: 200,
        message: "Your leave history fetched successfully",
        data,
    });
});

const getLeave = asyncWrapper(async (req, res) => {
    const leave = await Leave.findById(getId(req));

    if (!leave) {
        throw new ApiError(404, "Leave request not found");
    }
    if (req.user!.role === "employee" && leave.user.toString() !== req.user!.id) {
        throw new ApiError(404, "Leave request not found");
    }

    await leave.populate([
        { path: "user", select: "name email department" },
        { path: "reviewedBy", select: "name" },
    ]);

    successResponse({
        res,
        status: 200,
        message: "Leave request fetched successfully",
        data: { leave },
    });
});

const reviewLeave = (status: "approved" | "rejected") =>
    asyncWrapper(async (req, res) => {
        const id = getId(req);
        const comment = req.body?.comment ? String(req.body.comment).trim() : undefined;

        if (status === "rejected" && !comment) {
            throw new ApiError(400, "Please provide a comment when rejecting a leave request");
        }

        const leave = await Leave.findById(id);
        if (!leave) {
            throw new ApiError(404, "Leave request not found");
        }
        if (leave.user.toString() === req.user!.id) {
            throw new ApiError(403, "You cannot review your own leave request");
        }
        if (req.user!.role === "hr") {
            const owner = await User.findById(leave.user).select("role");
            if (!owner || owner.role !== "employee") {
                throw new ApiError(403, "HR can only review employee leave requests");
            }
        }
        if (leave.status !== "pending") {
            throw new ApiError(400, `Leave request is already ${leave.status}`);
        }

        const updated = await Leave.findOneAndUpdate(
            { _id: id, status: "pending" },
            {
                status,
                reviewedBy: req.user!._id,
                reviewedAt: new Date(),
                reviewComment: comment,
            },
            { new: true, runValidators: true }
        )
            .populate("user", "name email department")
            .populate("reviewedBy", "name");

        if (!updated) {
            throw new ApiError(400, "Leave request is no longer pending");
        }

        successResponse({
            res,
            status: 200,
            message: status === "approved" ? "Leave approved successfully" : "Leave rejected successfully",
            data: { leave: updated },
        });
    });

const approveLeave = reviewLeave("approved");
const rejectLeave = reviewLeave("rejected");

const cancelLeave = asyncWrapper(async (req, res) => {
    const leave = await Leave.findById(getId(req));

    if (!leave) {
        throw new ApiError(404, "Leave request not found");
    }
    if (leave.user.toString() !== req.user!.id) {
        throw new ApiError(403, "You can only cancel your own leave requests");
    }
    if (leave.status === "approved" && leave.startDate <= getToday()) {
        throw new ApiError(400, "Approved leave that has already started cannot be cancelled");
    }
    if (leave.status !== "pending" && leave.status !== "approved") {
        throw new ApiError(400, `Leave request is already ${leave.status}`);
    }

    leave.status = "cancelled";
    await leave.save();

    successResponse({
        res,
        status: 200,
        message: "Leave request cancelled successfully",
        data: { leave },
    });
});

export {
    applyLeave,
    listLeaves,
    myLeaves,
    getLeave,
    approveLeave,
    rejectLeave,
    cancelLeave,
};