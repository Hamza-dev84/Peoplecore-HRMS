"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS, type LeaveType } from "@/constants";
import { getErrorMessage } from "@/lib/errors";
import { leaveService } from "@/services/leave.service";

interface FormValues {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

interface ApplyLeaveModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const todayLocal = (): string => new Date().toLocaleDateString("en-CA");

const countDays = (start: string, end: string): number =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;

export function ApplyLeaveModal({ onClose, onSaved }: ApplyLeaveModalProps) {
  const [error, setError] = useState<string | null>(null);
  const today = todayLocal();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { leaveType: "casual", startDate: "", endDate: "", reason: "" },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const days = startDate && endDate && endDate >= startDate ? countDays(startDate, endDate) : null;

  const onSubmit = async (values: FormValues) => {
    setError(null);

    try {
      await leaveService.apply({ ...values, reason: values.reason.trim() });
      toast.success("Leave request submitted");
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Apply for leave"
      description="Your request will be sent to HR for approval"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="leave-form" loading={isSubmitting}>
            Submit request
          </Button>
        </>
      }
    >
      <form id="leave-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Select label="Leave type" error={errors.leaveType?.message} {...register("leaveType")}>
          {LEAVE_TYPES.map((type) => (
            <option key={type} value={type}>
              {LEAVE_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            min={today}
            error={errors.startDate?.message}
            {...register("startDate", {
              required: "Start date is required",
              validate: (value) => value >= today || "Leave cannot start in the past",
            })}
          />
          <Input
            label="End date"
            type="date"
            min={startDate || today}
            error={errors.endDate?.message}
            {...register("endDate", {
              required: "End date is required",
              validate: (value) =>
                value >= getValues("startDate") || "End date cannot be before start date",
            })}
          />
        </div>

        {days !== null && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
            Total: {days} day{days > 1 ? "s" : ""}
          </p>
        )}

        <Textarea
          label="Reason"
          placeholder="Briefly explain the reason for your leave"
          error={errors.reason?.message}
          {...register("reason", {
            required: "Reason is required",
            validate: (value) => value.trim().length >= 5 || "Reason must be at least 5 characters",
            maxLength: { value: 500, message: "Reason cannot exceed 500 characters" },
          })}
        />
      </form>
    </Modal>
  );
}