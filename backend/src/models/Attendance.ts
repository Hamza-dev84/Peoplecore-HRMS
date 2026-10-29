import mongoose, { Schema, type Types } from "mongoose";

export interface IAttendance {
  user: Types.ObjectId;
  date: string;
  checkIn: Date;
  checkOut?: Date;
  workedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
    workedMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;