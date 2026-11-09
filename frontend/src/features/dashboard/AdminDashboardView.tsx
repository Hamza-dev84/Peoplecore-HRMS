import Link from "next/link";
import { CalendarOff, Hourglass, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_VARIANT,
  LEAVE_TYPE_LABELS,
  ROLE_LABELS,
  ROLE_VARIANT,
} from "@/constants";
import { formatPeriod, formatTime } from "@/lib/utils";
import type { AdminDashboard } from "@/types/dashboard";
import { AttendanceBarChart, DepartmentBarChart, LeaveStatusDonut } from "./charts";

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-brand-600 hover:text-brand-700">
      View all
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-slate-400">{text}</p>;
}

export function AdminDashboardView({ data }: { data: AdminDashboard }) {
  const { employees, attendanceToday, leaves } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total employees"
          value={employees.total}
          icon={Users}
          tone="brand"
          hint={`${employees.active} active, ${employees.inactive} inactive`}
          href="/employees"
        />
        <StatCard
          label="Present today"
          value={attendanceToday.present}
          icon={UserCheck}
          tone="green"
          hint={`${attendanceToday.checkedOut} checked out`}
          href="/attendance"
        />
        <StatCard label="On leave today" value={attendanceToday.onLeave} icon={CalendarOff} tone="amber" />
        <StatCard label="Absent today" value={attendanceToday.absent} icon={UserX} tone="red" />
        <StatCard
          label="Pending leave requests"
          value={leaves.pending}
          icon={Hourglass}
          tone="amber"
          hint="Waiting for review"
          href="/leaves"
        />
        <StatCard label="New this month" value={employees.newThisMonth} icon={UserPlus} tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Attendance, last 7 days"
          description="Employees who checked in each day"
          className="lg:col-span-2"
        >
          <AttendanceBarChart data={data.attendanceLast7Days} />
        </Card>

        <Card title="Leaves this month" description="By status">
          <LeaveStatusDonut counts={leaves.thisMonth} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Employees by department" description="Active employees">
          <DepartmentBarChart
            data={employees.byDepartment.map((item) => ({
              department: item.department,
              count: item.count,
            }))}
          />
        </Card>

        <Card title="Recent leave requests" action={<ViewAll href="/leaves" />}>
          {data.recentLeaves.length === 0 ? (
            <Empty text="No leave requests yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentLeaves.map((leave) => {
                const employee = typeof leave.user === "string" ? null : leave.user;

                return (
                  <li key={leave._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{employee?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">
                        {LEAVE_TYPE_LABELS[leave.leaveType]}, {formatPeriod(leave.startDate, leave.endDate)}
                      </p>
                    </div>
                    <Badge variant={LEAVE_STATUS_VARIANT[leave.status]} dot>
                      {LEAVE_STATUS_LABELS[leave.status]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Checked in today"
          action={<ViewAll href="/attendance" />}
          className={employees.byRole ? undefined : "lg:col-span-2"}
        >
          {data.recentCheckIns.length === 0 ? (
            <Empty text="Nobody has checked in yet today" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentCheckIns.map((record) => {
                const employee = typeof record.user === "string" ? null : record.user;

                return (
                  <li key={record._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{employee?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">{employee?.department || employee?.email}</p>
                    </div>
                    <span className="text-slate-600">{formatTime(record.checkIn)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {employees.byRole && (
          <Card title="Users by role" description="Visible to Super Admin only">
            <ul className="divide-y divide-slate-100">
              {employees.byRole.map((item) => (
                <li key={item.role} className="flex items-center justify-between py-3 text-sm">
                  <Badge variant={ROLE_VARIANT[item.role]}>{ROLE_LABELS[item.role]}</Badge>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}