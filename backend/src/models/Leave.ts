import mongoose, { Schema, type Types } from "mongoose";

export const LEAVE_TYPES = ["casual", "sick", "annual", "unpaid"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface ILeave {
  user: Types.ObjectId;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: { type: String, enum: [...LEAVE_TYPES], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalDays: { type: Number, required: true, min: 1 },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    status: { type: String, enum: [...LEAVE_STATUSES], default: "pending" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewComment: {
      type: String,
      trim: true,
      maxlength: [300, "Comment cannot exceed 300 characters"],
    },
  },
  { timestamps: true }
);

leaveSchema.index({ user: 1, startDate: -1 });
leaveSchema.index({ status: 1 });

const Leave = mongoose.model<ILeave>("Leave", leaveSchema);

export default Leave;