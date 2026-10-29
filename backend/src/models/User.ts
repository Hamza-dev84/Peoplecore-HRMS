import mongoose, { Schema } from "mongoose";

export const ROLES = ["super_admin", "hr", "employee"] as const;
export type Role = (typeof ROLES)[number];

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  department?: string;
  designation?: string;
  phone?: string;
  joiningDate?: Date;
  profileImage: string;
  refreshToken?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: [...ROLES],
      default: "employee",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    joiningDate: { type: Date },
    profileImage: { type: String, default: "" },
    refreshToken: { type: String, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ department: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;