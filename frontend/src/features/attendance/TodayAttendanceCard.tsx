"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { getErrorMessage } from "@/lib/errors";
import { formatMinutes, formatTime } from "@/lib/utils";
import { attendanceService } from "@/services/attendance.service";
import type { Attendance } from "@/types/attendance";

interface TodayAttendanceCardProps {
  onChange: () => void;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function TodayAttendanceCard({ onChange }: TodayAttendanceCardProps) {
  const [attendance, setAttendance] = useState<Attendance | null | undefined>(undefined);
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState<"in" | "out" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;

    attendanceService
      .getToday()
      .then((data) => {
        if (active) setAttendance(data);
      })
      .catch((err) => {
        if (active) {
          setAttendance(null);
          setError(getErrorMessage(err));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const run = async (kind: "in" | "out", action: () => Promise<Attendance>) => {
    setBusy(kind);
    try {
      const result = await action();
      setAttendance(result);
      toast.success(kind === "in" ? "Checked in successfully" : "Check-out recorded");
      onChange();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const checkedIn = !!attendance;
  const checkedOut = !!attendance?.checkOut;

  return (
    <Card title="Today" description="Record your attendance for today">
      <div className="text-center">
        <p className="text-4xl font-bold tabular-nums text-slate-900">
          {now.toLocaleTimeString("en-GB")}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {now.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      {attendance === undefined ? (
        <Skeleton className="mt-5 h-16 w-full" />
      ) : (
        <>
          <div className="mt-5 flex justify-center">
            {!checkedIn ? (
              <Badge variant="neutral" dot>Not checked in</Badge>
            ) : checkedOut ? (
              <Badge variant="info" dot>Checked out</Badge>
            ) : (
              <Badge variant="success" dot>Checked in</Badge>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Detail label="Check in" value={formatTime(attendance?.checkIn)} />
            <Detail label="Last check out" value={formatTime(attendance?.checkOut)} />
            <Detail
              label="Worked"
              value={attendance?.checkOut ? formatMinutes(attendance.workedMinutes) : "-"}
            />
          </div>
        </>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          size="lg"
          loading={busy === "in"}
          disabled={attendance === undefined || checkedIn || busy !== null}
          onClick={() => run("in", attendanceService.checkIn)}
        >
          <LogIn size={18} /> Check in
        </Button>
        <Button
          size="lg"
          variant="outline"
          loading={busy === "out"}
          disabled={attendance === undefined || !checkedIn || busy !== null}
          onClick={() => run("out", attendanceService.checkOut)}
        >
          <LogOut size={18} /> {checkedOut ? "Update check out" : "Check out"}
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        You can check out more than once. The last check-out is kept.
      </p>
    </Card>
  );
}