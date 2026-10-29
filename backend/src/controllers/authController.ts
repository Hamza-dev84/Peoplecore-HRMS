import bcrypt from "bcrypt";
import type { HydratedDocument } from "mongoose";
import User, { type IUser } from "../models/User";
import asyncWrapper from "../utilities/asyncWrapper";
import ApiError from "../utilities/ApiError";
import sendEmail from "../utilities/sendEmail";
import { successResponse } from "../utilities/responseHandler";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
  getRefreshCookieOptions,
} from "../utilities/token";

const sanitizeUser = (user: HydratedDocument<IUser>) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  department: user.department,
  designation: user.designation,
  phone: user.phone,
  profileImage: user.profileImage,
});

const sendVerificationEmail = async (user: HydratedDocument<IUser>): Promise<void> => {
  const { token, hashedToken } = generateRandomToken();

  await User.updateOne(
    { _id: user._id },
    {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  );

  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    html: `<p>Hi ${user.name},</p>
<p>Click the link below to verify your email. This link is valid for 24 hours.</p>
<p><a href="${link}">${link}</a></p>`,
  });
};

const register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) {
    throw new ApiError(409, "Email already registered");
  }

  const isFirstUser = (await User.countDocuments()) === 0;
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: isFirstUser ? "super_admin" : "employee",
    isEmailVerified: isFirstUser,
  });

  if (!isFirstUser) {
    try {
      await sendVerificationEmail(user);
    } catch (error) {
      console.error("Verification email failed:", error);
    }
  }

  successResponse({
    res,
    status: 201,
    message: isFirstUser
      ? "Registered successfully"
      : "Registered successfully. Please check your email to verify your account",
    data: { user: sanitizeUser(user) },
  });
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  }).select("+password");

  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  await User.updateOne({ _id: user._id }, { refreshToken: hashToken(refreshToken) });

  res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

  successResponse({
    res,
    status: 200,
    message: "Login successful",
    data: { user: sanitizeUser(user), accessToken },
  });
});

const refreshToken = asyncWrapper(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(401, "Refresh token missing");
  }

  let payload: { id: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.id).select("+refreshToken");
  if (!user || !user.isActive || user.refreshToken !== hashToken(token)) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const accessToken = signAccessToken(user.id);
  const newRefreshToken = signRefreshToken(user.id);

  await User.updateOne({ _id: user._id }, { refreshToken: hashToken(newRefreshToken) });

  res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions());

  successResponse({
    res,
    status: 200,
    message: "Token refreshed",
    data: { accessToken },
  });
});

const logout = asyncWrapper(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.id }, { $unset: { refreshToken: 1 } });
    } catch {
      // token already invalid, bas cookie clear karni hai
    }
  }

  res.clearCookie("refreshToken", getRefreshCookieOptions());

  successResponse({ res, status: 200, message: "Logged out successfully", data: null });
});

const getMe = asyncWrapper(async (req, res) => {
  successResponse({
    res,
    status: 200,
    message: "Profile fetched",
    data: { user: sanitizeUser(req.user!) },
  });
});

const verifyEmail = asyncWrapper(async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Token is required");
  }

  const user = await User.findOne({
    emailVerificationToken: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification link");
  }

  await User.updateOne(
    { _id: user._id },
    {
      isEmailVerified: true,
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    }
  );

  successResponse({ res, status: 200, message: "Email verified successfully", data: null });
});

const resendVerification = asyncWrapper(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user && user.isActive && !user.isEmailVerified) {
    try {
      await sendVerificationEmail(user);
    } catch (error) {
      console.error("Verification email failed:", error);
    }
  }

  successResponse({
    res,
    status: 200,
    message: "If the account exists and is not verified, a verification email has been sent",
    data: null,
  });
});

const forgotPassword = asyncWrapper(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  if (user && user.isActive) {
    try {
      const { token, hashedToken } = generateRandomToken();

      await User.updateOne(
        { _id: user._id },
        {
          passwordResetToken: hashedToken,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        }
      );

      const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Hi ${user.name},</p>
<p>Click the link below to reset your password. This link is valid for 1 hour.</p>
<p><a href="${link}">${link}</a></p>
<p>If you did not request this, you can ignore this email.</p>`,
      });
    } catch (error) {
      console.error("Password reset email failed:", error);
    }
  }

  successResponse({
    res,
    status: 200,
    message: "If an account with that email exists, a password reset link has been sent",
    data: null,
  });
});

const resetPassword = asyncWrapper(async (req, res) => {
  const { token, password } = req.body;

  if (!token || typeof token !== "string" || !password) {
    throw new ApiError(400, "Token and new password are required");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset link");
  }

  const isSamePassword = await bcrypt.compare(password, user.password);
  if (isSamePassword) {
    throw new ApiError(400, "New password must be different from your old password");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.updateOne(
    { _id: user._id },
    {
      password: hashedPassword,
      $unset: { passwordResetToken: 1, passwordResetExpires: 1, refreshToken: 1 },
    }
  );

  successResponse({
    res,
    status: 200,
    message: "Password reset successful. Please login with your new password",
    data: null,
  });
});

const changePassword = asyncWrapper(async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await User.findById(req.user!.id).select("+password");

  if (!user || !(await bcrypt.compare(String(currentPassword), user.password))) {
    throw new ApiError(400, "Current password is incorrect");
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    throw new ApiError(400, "New password must be different from your old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await User.updateOne(
    { _id: user._id },
    { password: hashedPassword, $unset: { refreshToken: 1 } }
  );

  res.clearCookie("refreshToken", getRefreshCookieOptions());

  successResponse({
    res,
    status: 200,
    message: "Password changed successfully. Please login again",
    data: null,
  });
});

export {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};