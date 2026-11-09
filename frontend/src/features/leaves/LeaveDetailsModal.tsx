"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_VARIANT,
  LEAVE_TYPE_LABELS,
} from "@/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Leave } from "@/types/leave";

interface LeaveDetailsModalProps {
  leave: Leave;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 text-slate-900">{children}</dd>
    </div>
  );
}

export function LeaveDetailsModal({ leave, onClose }: LeaveDetailsModalProps) {
  const employee = typeof leave.user === "string" ? null : leave.user;
  const reviewer = typeof leave.reviewedBy === "string" ? null : leave.reviewedBy;

  return (
    <Modal
      open
      onClose={onClose}
      title="Leave details"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <dl className="divide-y divide-slate-100">
        {employee && (
          <Row label="Employee">
            {employee.name}
            <span className="block text-xs text-slate-500">{employee.email}</span>
          </Row>
        )}
        <Row label="Type">{LEAVE_TYPE_LABELS[leave.leaveType]}</Row>
        <Row label="Period">
          {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.totalDays} day
          {leave.totalDays > 1 ? "s" : ""})
        </Row>
        <Row label="Status">
          <Badge variant={LEAVE_STATUS_VARIANT[leave.status]} dot>
            {LEAVE_STATUS_LABELS[leave.status]}
          </Badge>
        </Row>
        <Row label="Reason">
          <span className="whitespace-pre-wrap break-words">{leave.reason}</span>
        </Row>
        <Row label="Applied on">{formatDateTime(leave.createdAt)}</Row>
        {leave.reviewedAt && (
          <Row label="Reviewed">
            {reviewer?.name ?? "-"} on {formatDateTime(leave.reviewedAt)}
          </Row>
        )}
        {leave.reviewComment && (
          <Row label="Comment">
            <span className="whitespace-pre-wrap break-words">{leave.reviewComment}</span>
          </Row>
        )}
      </dl>
    </Modal>
  );
}