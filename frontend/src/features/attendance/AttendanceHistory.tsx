"use client";

import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Table, type Column } from "@/components/ui/Table";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatMinutes, formatTime } from "@/lib/utils";
import { attendanceService } from "@/services/attendance.service";
import type { Pagination as PaginationData } from "@/types/api";
import type { Attendance } from "@/types/attendance";

const LIMIT = 10;
const EMPTY_PAGINATION: PaginationData = { page: 1, limit: LIMIT, total: 0, totalPages: 0 };

interface AttendanceHistoryProps {
  isManager: boolean;
  employeeId: string;
  refreshKey: number;
}

interface HistoryResult {
  key: string;
  records: Attendance[];
  pagination: PaginationData;
  error?: string;
}

export function AttendanceHistory({ isManager, employeeId, refreshKey }: AttendanceHistoryProps) {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<HistoryResult | null>(null);

  const currentKey = `${page}|${from}|${to}|${employeeId}|${refreshKey}|${retryKey}`;
  const loading = result?.key !== currentKey;
  const showEmployee = isManager && !employeeId;
  const hasFilters = !!(from || to);

  useEffect(() => {
    let active = true;

    attendanceService
      .list({
        page,
        limit: LIMIT,
        from: from || undefined,
        to: to || undefined,
        userId: employeeId || undefined,
      })
      .then((data) => {
        if (active) setResult({ key: currentKey, ...data });
      })
      .catch((err) => {
        if (active) {
          setResult({
            key: currentKey,
            records: [],
            pagination: EMPTY_PAGINATION,
            error: getErrorMessage(err),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [currentKey, page, from, to, employeeId]);

  const columns: Column<Attendance>[] = [
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    ...(showEmployee
      ? [
          {
            key: "employee",
            header: "Employee",
            render: (row: Attendance) => {
              const user = typeof row.user === "string" ? null : row.user;
              return (
                <div>
                  <p className="font-medium text-slate-900">{user?.name ?? "Unknown"}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              );
            },
          },
        ]
      : []),
    { key: "checkIn", header: "Check in", render: (row) => formatTime(row.checkIn) },
    {
      key: "checkOut",
      header: "Check out",
      render: (row) =>
        row.checkOut ? formatTime(row.checkOut) : <Badge variant="warning">No check-out</Badge>,
    },
    {
      key: "worked",
      header: "Worked",
      render: (row) => (row.checkOut ? formatMinutes(row.workedMinutes) : "-"),
    },
  ];

  const pagination = result?.pagination ?? EMPTY_PAGINATION;

  return (
    <Card title="Attendance history" padded={false}>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-end">
        <div className="sm:w-48">
          <Input
            label="From"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="sm:w-48">
          <Input
            label="To"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setFrom("");
              setTo("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
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
            data={result?.records ?? []}
            rowKey={(row) => row._id}
            loading={loading}
            emptyState={
              <EmptyState
                icon={CalendarX}
                title="No attendance records"
                description={
                  hasFilters
                    ? "No records found for this date range."
                    : "Records will appear here after the first check-in."
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
  );
}