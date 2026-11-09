"use client";

import { useEffect, useState } from "react";
import { CalendarOff, Check, Eye, X } from "lucide-react";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import {
  LEAVE_STATUSES,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_VARIANT,
  LEAVE_TYPE_LABELS,
  type LeaveStatus,
} from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { getErrorMessage } from "@/lib/errors";
import { cn, formatDate } from "@/lib/utils";
import { leaveService } from "@/services/leave.service";
import type { Pagination as PaginationData } from "@/types/api";
import type { Leave } from "@/types/leave";
import { LeaveDetailsModal } from "./LeaveDetailsModal";
import { ReviewLeaveModal } from "./ReviewLeaveModal";

const LIMIT = 10;
const EMPTY_PAGINATION: PaginationData = { page: 1, limit: LIMIT, total: 0, totalPages: 0 };

interface LeaveListProps {
  mode: "mine" | "manage";
  refreshKey: number;
  onChanged: () => void;
}

interface ListResult {
  key: string;
  leaves: Leave[];
  pagination: PaginationData;
  error?: string;
}

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";

const todayLocal = (): string => new Date().toLocaleDateString("en-CA");

const ownerId = (leave: Leave): string =>
  typeof leave.user === "string" ? leave.user : leave.user._id;

const canCancel = (leave: Leave): boolean =>
  leave.status === "pending" || (leave.status === "approved" && leave.startDate > todayLocal());

export function LeaveList({ mode, refreshKey, onChanged }: LeaveListProps) {
  const { user } = useAuth();
  const isManage = mode === "manage";

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeaveStatus | "">(isManage ? "pending" : "");
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<ListResult | null>(null);

  const [detailsTarget, setDetailsTarget] = useState<Leave | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Leave | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ leave: Leave; action: "approve" | "reject" } | null>(null);

  const currentKey = `${mode}|${page}|${status}|${refreshKey}|${retryKey}`;
  const loading = result?.key !== currentKey;

  useEffect(() => {
    let active = true;
    const params = { page, limit: LIMIT, status: status || undefined };

    (isManage ? leaveService.list(params) : leaveService.myLeaves(params))
      .then((data) => {
        if (active) setResult({ key: currentKey, ...data });
      })
      .catch((err) => {
        if (active) {
          setResult({
            key: currentKey,
            leaves: [],
            pagination: EMPTY_PAGINATION,
            error: getErrorMessage(err),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [currentKey, page, status, isManage]);

  const handleCancel = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      await leaveService.cancel(cancelTarget._id);
      toast.success("Leave request cancelled");
      setCancelTarget(null);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const columns: Column<Leave>[] = [
    ...(isManage
      ? [
          {
            key: "employee",
            header: "Employee",
            render: (row: Leave) => {
              const employee = typeof row.user === "string" ? null : row.user;
              return (
                <div>
                  <p className="font-medium text-slate-900">{employee?.name ?? "Unknown"}</p>
                  <p className="text-xs text-slate-500">{employee?.department || employee?.email}</p>
                </div>
              );
            },
          },
        ]
      : []),
    { key: "type", header: "Type", render: (row) => LEAVE_TYPE_LABELS[row.leaveType] },
    {
      key: "period",
      header: "Period",
      render: (row) =>
        row.startDate === row.endDate
          ? formatDate(row.startDate)
          : `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
    },
    { key: "totalDays", header: "Days" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={LEAVE_STATUS_VARIANT[row.status]} dot>
          {LEAVE_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (row) => (
        <span className="block max-w-56 truncate" title={row.reason}>
          {row.reason}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={iconButton}
            title="View details"
            aria-label="View details"
            onClick={() => setDetailsTarget(row)}
          >
            <Eye size={16} />
          </button>

          {!isManage && canCancel(row) && (
            <button
              type="button"
              className={cn(iconButton, "hover:bg-red-50 hover:text-red-600")}
              title="Cancel request"
              aria-label="Cancel request"
              onClick={() => setCancelTarget(row)}
            >
              <X size={16} />
            </button>
          )}

          {isManage && row.status === "pending" && ownerId(row) !== user?.id && (
            <>
              <button
                type="button"
                className={cn(iconButton, "hover:bg-emerald-50 hover:text-emerald-600")}
                title="Approve"
                aria-label="Approve"
                onClick={() => setReviewTarget({ leave: row, action: "approve" })}
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                className={cn(iconButton, "hover:bg-red-50 hover:text-red-600")}
                title="Reject"
                aria-label="Reject"
                onClick={() => setReviewTarget({ leave: row, action: "reject" })}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const pagination = result?.pagination ?? EMPTY_PAGINATION;

  return (
    <>
      <Card padded={false}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="w-full sm:w-52">
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as LeaveStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {LEAVE_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {LEAVE_STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {result?.error && !loading ? (
          <div className="space-y-3 p-4">
            <Alert variant="error">{result.error}</Alert>
            <Button variant="outline" size="sm" onClick={() => setRetryKey((value) => value + 1)}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={result?.leaves ?? []}
              rowKey={(row) => row._id}
              loading={loading}
              emptyState={
                <EmptyState
                  icon={CalendarOff}
                  title={status ? "No leave requests found" : isManage ? "No leave requests yet" : "No leave requests yet"}
                  description={
                    status
                      ? "Try a different status filter."
                      : isManage
                        ? "Requests from your team will appear here."
                        : "Use the Apply for leave button to submit your first request."
                  }
                />
              }
            />
            {!loading && (
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {detailsTarget && (
        <LeaveDetailsModal leave={detailsTarget} onClose={() => setDetailsTarget(null)} />
      )}

      {reviewTarget && (
        <ReviewLeaveModal
          leave={reviewTarget.leave}
          action={reviewTarget.action}
          onClose={() => setReviewTarget(null)}
          onDone={onChanged}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel leave request?"
        message="This leave request will be cancelled. You can apply again later if needed."
        confirmText="Cancel request"
        cancelText="Keep it"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}