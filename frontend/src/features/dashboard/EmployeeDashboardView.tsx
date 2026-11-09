import Link from "next/link";
import { CalendarCheck, CalendarClock, Clock, Timer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_VARIANT, LEAVE_TYPE_LABELS } from "@/constants";
import { formatDate, formatMinutes, formatPeriod, formatTime } from "@/lib/utils";
import type { EmployeeDashboard } from "@/types/dashboard";
import { LeaveStatusDonut } from "./charts";

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

export function EmployeeDashboardView({ data }: { data: EmployeeDashboard }) {
    const attendance = data.today.attendance;
    const { byStatus } = data.leaves;

    const todayLabel = !attendance ? "Not checked in" : attendance.checkOut ? "Checked out" : "Checked in";

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Today"
                    value={todayLabel}
                    icon={Clock}
                    tone={!attendance ? "slate" : attendance.checkOut ? "brand" : "green"}
                    hint={attendance ? `Checked in at ${formatTime(attendance.checkIn)}` : "Go to attendance to check in"}
                    href="/attendance"
                />
                <StatCard
                    label="Present this month"
                    value={data.month.presentDays}
                    icon={CalendarCheck}
                    tone="green"
                    hint={data.month.month}
                />
                <StatCard
                    label="Hours this month"
                    value={formatMinutes(data.month.totalWorkedMinutes)}
                    icon={Timer}
                    tone="brand"
                />
                <StatCard
                    label="Pending leave requests"
                    value={byStatus.pending}
                    icon={CalendarClock}
                    tone="amber"
                    hint={`${byStatus.approved} approved in ${data.leaves.year}`}
                    href="/leaves"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card title="Leaves this year" description={`Requests made in ${data.leaves.year}`}>
                    <LeaveStatusDonut counts={byStatus} />
                </Card>

                <Card title="Upcoming leaves" description="Approved leaves that have not ended" className="lg:col-span-2">
                    {data.leaves.upcoming.length === 0 ? (
                        <Empty text="No upcoming approved leaves" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {data.leaves.upcoming.map((leave) => (
                                <li key={leave._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-slate-900">{LEAVE_TYPE_LABELS[leave.leaveType]} leave</p>
                                        <p className="text-xs text-slate-500">{formatPeriod(leave.startDate, leave.endDate)}</p>
                                    </div>
                                    <Badge variant="info">
                                        {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Recent attendance" action={<ViewAll href="/attendance" />}>
                    {data.recentAttendance.length === 0 ? (
                        <Empty text="No attendance recorded yet" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {data.recentAttendance.map((record) => (
                                <li key={record._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-slate-900">{formatDate(record.date)}</p>
                                        <p className="text-xs text-slate-500">
                                            {formatTime(record.checkIn)} - {record.checkOut ? formatTime(record.checkOut) : "No check-out"}
                                        </p>
                                    </div>
                                    <span className="text-slate-600">
                                        {record.checkOut ? formatMinutes(record.workedMinutes) : "-"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Recent leave requests" action={<ViewAll href="/leaves" />}>
                    {data.recentLeaves.length === 0 ? (
                        <Empty text="You have not applied for any leave yet" />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {data.recentLeaves.map((leave) => (
                                <li key={leave._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-slate-900">{LEAVE_TYPE_LABELS[leave.leaveType]} leave</p>
                                        <p className="text-xs text-slate-500">{formatPeriod(leave.startDate, leave.endDate)}</p>
                                    </div>
                                    <Badge variant={LEAVE_STATUS_VARIANT[leave.status]} dot>
                                        {LEAVE_STATUS_LABELS[leave.status]}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}