"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, type Column } from "@/components/ui/Table";
import { getErrorMessage } from "@/lib/errors";
import { formatMinutes } from "@/lib/utils";
import { attendanceService } from "@/services/attendance.service";
import { reportService, type ReportFormat } from "@/services/report.service";
import type { MonthlyReportRow } from "@/types/attendance";

interface MonthlySummaryProps {
  isManager: boolean;
  employeeId: string;
}

interface SummaryResult {
  key: string;
  rows: MonthlyReportRow[];
  error?: string;
}

const getCurrentMonth = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function MonthlySummary({ isManager, employeeId }: MonthlySummaryProps) {
  const [month, setMonth] = useState(getCurrentMonth);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);

  const currentKey = `${month}|${employeeId}`;
  const loading = result?.key !== currentKey;
  const single = !isManager || !!employeeId;

  useEffect(() => {
    let active = true;

    attendanceService
      .monthlyReport({ month, userId: employeeId || undefined })
      .then((data) => {
        if (active) setResult({ key: currentKey, rows: data.report });
      })
      .catch((err) => {
        if (active) setResult({ key: currentKey, rows: [], error: getErrorMessage(err) });
      });

    return () => {
      active = false;
    };
  }, [currentKey, month, employeeId]);

  const exportReport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      await reportService.download("attendance", format, {
        month,
        userId: employeeId || undefined,
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const columns: Column<MonthlyReportRow>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.user?.name ?? "Unknown"}</p>
          <p className="text-xs text-slate-500">{row.user?.email}</p>
        </div>
      ),
    },
    { key: "department", header: "Department", render: (row) => row.user?.department || "-" },
    { key: "presentDays", header: "Present days" },
    {
      key: "total",
      header: "Total worked",
      render: (row) => formatMinutes(row.totalWorkedMinutes),
    },
    {
      key: "average",
      header: "Average / day",
      render: (row) => formatMinutes(row.averageMinutesPerDay),
    },
  ];

  const row = result?.rows[0];

  return (
    <Card
      title="Monthly summary"
      description={single ? "Your attendance for the selected month" : "All employees for the selected month"}
      padded={false}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={exporting === "csv"}
            disabled={exporting !== null}
            onClick={() => exportReport("csv")}
          >
            <Download size={14} /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={exporting === "pdf"}
            disabled={exporting !== null}
            onClick={() => exportReport("pdf")}
          >
            <Download size={14} /> PDF
          </Button>
        </div>
      }
    >
      <div className="border-b border-slate-100 p-4">
        <div className="sm:w-56">
          <Input
            type="month"
            aria-label="Month"
            value={month}
            onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(event.target.value);
            }}
          />
        </div>
      </div>

      {result?.error && !loading ? (
        <div className="p-4">
          <Alert variant="error">{result.error}</Alert>
        </div>
      ) : single ? (
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)
          ) : (
            <>
              <Stat label="Present days" value={row?.presentDays ?? 0} />
              <Stat label="Total worked" value={formatMinutes(row?.totalWorkedMinutes ?? 0)} />
              <Stat label="Average per day" value={formatMinutes(row?.averageMinutesPerDay ?? 0)} />
            </>
          )}
        </div>
      ) : (
        <Table
          columns={columns}
          data={result?.rows ?? []}
          rowKey={(item) => item.user?._id ?? "unknown"}
          loading={loading}
          emptyState={
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No attendance recorded for this month.
            </p>
          }
        />
      )}
    </Card>
  );
}