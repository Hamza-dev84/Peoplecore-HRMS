"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { LEAVE_STATUSES, LEAVE_STATUS_LABELS, type LeaveStatus } from "@/constants";

const BRAND_COLOR = "#4f46e5";

const STATUS_COLORS: Record<LeaveStatus, string> = {
    pending: "#f59e0b",
    approved: "#10b981",
    rejected: "#ef4444",
    cancelled: "#94a3b8",
};

const tooltipStyle = { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 };

const shortDate = (value: string): string =>
    new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });

function ChartEmpty({ text }: { text: string }) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-400">{text}</div>;
}

export function AttendanceBarChart({ data }: { data: { date: string; present: number }[] }) {
    if (data.every((item) => item.present === 0)) {
        return <ChartEmpty text="No attendance recorded in the last 7 days" />;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={tooltipStyle}
                        labelFormatter={(label) => shortDate(String(label))}
                    />
                    <Bar dataKey="present" name="Present" fill={BRAND_COLOR} radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DepartmentBarChart({ data }: { data: { department: string; count: number }[] }) {
    if (data.length === 0) {
        return <ChartEmpty text="No employees yet" />;
    }

    return (
        <div className="w-full" style={{ height: Math.max(220, data.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                        type="category"
                        dataKey="department"
                        width={90}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                    />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Employees" fill={BRAND_COLOR} radius={[0, 6, 6, 0]} maxBarSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function LeaveStatusDonut({ counts }: { counts: Record<LeaveStatus, number> }) {
    const items = LEAVE_STATUSES.filter((status) => counts[status] > 0).map((status) => ({
        status,
        name: LEAVE_STATUS_LABELS[status],
        value: counts[status],
    }));
    const total = items.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return <ChartEmpty text="No leave requests yet" />;
    }

    return (
        <div>
            <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={items}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {items.map((item) => (
                                <Cell key={item.status} fill={STATUS_COLORS[item.status]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900">{total}</span>
                    <span className="text-xs text-slate-500">Total</span>
                </div>
            </div>

            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {LEAVE_STATUSES.map((status) => (
                    <li key={status} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-slate-600">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: STATUS_COLORS[status] }}
                            />
                            {LEAVE_STATUS_LABELS[status]}
                        </span>
                        <span className="font-medium text-slate-900">{counts[status]}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}