"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { LEAVE_TYPE_LABELS } from "@/constants";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { leaveService } from "@/services/leave.service";
import type { Leave } from "@/types/leave";

interface ReviewLeaveModalProps {
    leave: Leave;
    action: "approve" | "reject";
    onClose: () => void;
    onDone: () => void;
}

export function ReviewLeaveModal({ leave, action, onClose, onDone }: ReviewLeaveModalProps) {
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);

    const isReject = action === "reject";
    const employee = typeof leave.user === "string" ? "this employee" : leave.user.name;

    const submit = async () => {
        const trimmed = comment.trim();

        if (isReject && !trimmed) {
            setError("Please provide a comment when rejecting a leave request");
            return;
        }
        if (trimmed.length > 300) {
            setError("Comment cannot exceed 300 characters");
            return;
        }

        setSaving(true);
        try {
            if (isReject) {
                await leaveService.reject(leave._id, trimmed);
                toast.success("Leave rejected");
            } else {
                await leaveService.approve(leave._id, trimmed || undefined);
                toast.success("Leave approved");
            }
            onDone();
            onClose();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={isReject ? "Reject leave request" : "Approve leave request"}
            description={`${employee}: ${LEAVE_TYPE_LABELS[leave.leaveType]} leave, ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)} (${leave.totalDays} day${leave.totalDays > 1 ? "s" : ""})`}
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant={isReject ? "danger" : "primary"} onClick={submit} loading={saving}>
                        {isReject ? "Reject" : "Approve"}
                    </Button>
                </>
            }
        >
            <Textarea
                label={isReject ? "Comment (required)" : "Comment (optional)"}
                placeholder={isReject ? "Tell the employee why this was rejected" : "Add a note for the employee"}
                value={comment}
                error={error}
                onChange={(event) => {
                    setComment(event.target.value);
                    setError(undefined);
                }}
            />
        </Modal>
    );
}