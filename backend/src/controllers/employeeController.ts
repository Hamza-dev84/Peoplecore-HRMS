import crypto from "crypto";
import bcrypt from "bcrypt";
// import mongoose, { type UpdateQuery, type FilterQuery } from "mongoose";
import mongoose, { type UpdateQuery, type QueryFilter } from "mongoose";
import type { Request } from "express";
import User, { ROLES, type IUser } from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import sendEmail from "../utilities/sendEmail";
import { successResponse } from "../utilities/responseHandler";
import fs from "fs";
import path from "path";

const EDITABLE_FIELDS = ["name", "department", "designation", "phone", "joiningDate"] as const;
const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getId = (req: Request): string => {
    const id = String(req.params.id);
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid employee id");
    }
    return id;
};

const pickFields = (body: Record<string, unknown>): Record<string, unknown> => {
    const data: Record<string, unknown> = {};

    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) {
            data[field] = body[field];
        }
    }

    if (
        data.joiningDate !== undefined &&
        Number.isNaN(new Date(String(data.joiningDate)).getTime())
    ) {
        throw new ApiError(400, "Invalid joining date");
    }

    return data;
};

const listEmployees = asyncWrapper(async (req, res) => {
    const page = Math.max(parseInt(String(req.query.page), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const search = String(req.query.search ?? "").trim();
    const department = String(req.query.department ?? "").trim();

    const filter: QueryFilter<IUser> = {};

    if (search) {
        const regex = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ name: regex }, { email: regex }];
    }
    if (department) {
        filter.department = department;
    }

    const [employees, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    successResponse({
        res,
        status: 200,
        message: "Employees fetched successfully",
        data: {
            employees,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
});

const listDepartments = asyncWrapper(async (req, res) => {
    const departments = (await User.distinct("department", {
        department: { $nin: [null, ""] },
    })) as string[];

    successResponse({
        res,
        status: 200,
        message: "Departments fetched successfully",
        data: { departments: departments.sort() },
    });
});

const getEmployee = asyncWrapper(async (req, res) => {
    const employee = await User.findById(getId(req));

    if (!employee) {
        throw new ApiError(404, "Employee not found");
    }

    successResponse({
        res,
        status: 200,
        message: "Employee fetched successfully",
        data: { employee },
    });
});

const createEmployee = asyncWrapper(async (req, res) => {
    const body = req.body ?? {};
    const { name, email } = body;

    if (!name || !email) {
        throw new ApiError(400, "Name and email are required");
    }

    const fields = pickFields(body);
    const normalizedEmail = String(email).toLowerCase().trim();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
        throw new ApiError(409, "Email already registered");
    }

    const role =
        req.user!.role === "super_admin" && (ROLES as readonly string[]).includes(body.role)
            ? body.role
            : "employee";

    const temporaryPassword = crypto.randomBytes(9).toString("base64url");
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    const created = await User.create({
        ...fields,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        isEmailVerified: true,
    });

    let emailSent = true;
    try {
        await sendEmail({
            to: normalizedEmail,
            subject: "Your HRMS account has been created",
            html: `<p>Hi ${created.name},</p>
<p>An account has been created for you on HRMS.</p>
<p><b>Login:</b> ${process.env.FRONTEND_URL}/login<br/>
<b>Email:</b> ${normalizedEmail}<br/>
<b>Temporary password:</b> ${temporaryPassword}</p>
<p>Please login and change your password immediately.</p>`,
        });
    } catch (error) {
        emailSent = false;
        console.error("Welcome email failed:", error);
    }

    const employee = await User.findById(created._id);

    successResponse({
        res,
        status: 201,
        message: emailSent
            ? "Employee created. Login details sent by email"
            : "Employee created, but the email could not be sent. Share the temporary password manually",
        data: { employee, ...(emailSent ? {} : { temporaryPassword }) },
    });
});

const updateEmployee = asyncWrapper(async (req, res) => {
    const id = getId(req);
    const body = req.body ?? {};

    const target = await User.findById(id);
    if (!target) {
        throw new ApiError(404, "Employee not found");
    }
    if (req.user!.role === "hr" && target.role === "super_admin") {
        throw new ApiError(403, "HR cannot modify a Super Admin account");
    }

    const update: UpdateQuery<IUser> = { ...pickFields(body) };

    if (body.isActive !== undefined) {
        if (req.user!.role !== "super_admin") {
            throw new ApiError(403, "Only Super Admin can activate or deactivate accounts");
        }
        if (typeof body.isActive !== "boolean") {
            throw new ApiError(400, "isActive must be true or false");
        }
        if (req.user!.id === id && body.isActive === false) {
            throw new ApiError(400, "You cannot deactivate your own account");
        }
        update.isActive = body.isActive;
        if (body.isActive === false) {
            update.$unset = { refreshToken: 1 };
        }
    }

    if (Object.keys(update).length === 0) {
        throw new ApiError(400, "No valid fields to update");
    }

    const employee = await User.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
    });

    successResponse({
        res,
        status: 200,
        message: "Employee updated successfully",
        data: { employee },
    });
});

const deleteEmployee = asyncWrapper(async (req, res) => {
    const id = getId(req);

    if (req.user!.id === id) {
        throw new ApiError(400, "You cannot deactivate your own account");
    }

    const employee = await User.findByIdAndUpdate(
        id,
        { isActive: false, $unset: { refreshToken: 1 } },
        { new: true }
    );

    if (!employee) {
        throw new ApiError(404, "Employee not found");
    }

    successResponse({
        res,
        status: 200,
        message: "Employee deactivated successfully",
        data: null,
    });
});

const getProfile = asyncWrapper(async (req, res) => {
    successResponse({
        res,
        status: 200,
        message: "Profile fetched successfully",
        data: { user: req.user },
    });
});

const updateProfile = asyncWrapper(async (req, res) => {
    const body = req.body ?? {};
    const update: UpdateQuery<IUser> = {};

    if (body.name !== undefined) update.name = body.name;
    if (body.phone !== undefined) update.phone = body.phone;

    if (Object.keys(update).length === 0) {
        throw new ApiError(400, "Only name and phone can be updated");
    }

    const user = await User.findByIdAndUpdate(req.user!.id, update, {
        new: true,
        runValidators: true,
    });

    successResponse({
        res,
        status: 200,
        message: "Profile updated successfully",
        data: { user },
    });
});

const updateProfileImage = asyncWrapper(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Image file is required (field name: image)");
    }

    const newPath = `/uploads/profile-images/${req.file.filename}`;
    const oldPath = req.user!.profileImage;

    const user = await User.findByIdAndUpdate(
        req.user!.id,
        { profileImage: newPath },
        { new: true }
    );

    if (oldPath && oldPath.startsWith("/uploads/profile-images/")) {
        fs.unlink(path.join(process.cwd(), oldPath), () => { });
    }

    successResponse({
        res,
        status: 200,
        message: "Profile image updated successfully",
        data: { user },
    });
});

export {
    listEmployees,
    listDepartments,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getProfile,
    updateProfile,
    updateProfileImage
};