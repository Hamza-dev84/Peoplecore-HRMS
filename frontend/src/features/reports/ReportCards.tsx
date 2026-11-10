"use client";

import { useState } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
    LEAVE_STATUSES,
    LEAVE_STATUS_LABELS,
    type LeaveStatus,
} from "@/constants";
import { currentMonth } from "@/lib/utils";
import { reportService, type ReportFormat } from "@/services/report.service";
import type { Employee } from "@/types/user";
import { ReportCard } from "./ReportCard";

function EmployeeSelect({
    employees,
    value,
    onChange,
}: {
    employees: Employee[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <Select
            label="Employee"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        >
            <option value="">All employees</option>
            {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                    {employee.name}
                </option>
            ))}
        </Select>
    );
}

export function EmployeesReportCard({ departments }: { departments: string[] }) {
    const [department, setDepartment] = useState("");

    return (
        <ReportCard
            title="Employees report"
            description="All employees with role, department and status"
            icon={Users}
            onDownload={(format: ReportFormat) =>
                reportService.download("employees", format, { department: department || undefined })
            }
        >
            <Select
                label="Department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
            >
                <option value="">All departments</option>
                {departments.map((item) => (
                    <option key={item} value={item}>
                        {item}
                    </option>
                ))}
            </Select>
        </ReportCard>
    );
}

interface ScopedCardProps {
    isManager: boolean;
    employees: Employee[];
}

export function AttendanceReportCard({ isManager, employees }: ScopedCardProps) {
    const [month, setMonth] = useState(currentMonth);
    const [employeeId, setEmployeeId] = useState("");

    return (
        <ReportCard
            title="Attendance report"
            description={isManager ? "Daily attendance for a month" : "Your daily attendance for a month"}
            icon={Clock}
            onDownload={(format: ReportFormat) =>
                reportService.download("attendance", format, {
                    month,
                    userId: employeeId || undefined,
                })
            }
        >
            <Input
                label="Month"
                type="month"
                value={month}
                onChange={(event) => {
                    if (/^\d{4}-\d{2}$/.test(event.target.value)) setMonth(event.target.value);
                }}
            />
            {isManager && (
                <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />
            )}
        </ReportCard>
    );
}

export function LeavesReportCard({ isManager, employees }: ScopedCardProps) {
    const [status, setStatus] = useState<LeaveStatus | "">("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [employeeId, setEmployeeId] = useState("");

    return (
        <ReportCard
            title="Leave report"
            description={isManager ? "Leave requests with review details" : "Your leave requests"}
            icon={CalendarDays}
            onDownload={(format: ReportFormat) =>
                reportService.download("leaves", format, {
                    status: status || undefined,
                    from: from || undefined,
                    to: to || undefined,
                    userId: employeeId || undefined,
                })
            }
        >
            <Select
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as LeaveStatus | "")}
            >
                <option value="">All statuses</option>
                {LEAVE_STATUSES.map((item) => (
                    <option key={item} value={item}>
                        {LEAVE_STATUS_LABELS[item]}
                    </option>
                ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
                <Input
                    label="From"
                    type="date"
                    value={from}
                    max={to || undefined}
                    onChange={(event) => setFrom(event.target.value)}
                />
                <Input
                    label="To"
                    type="date"
                    value={to}
                    min={from || undefined}
                    onChange={(event) => setTo(event.target.value)}
                />
            </div>

            {isManager && (
                <EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} />
            )}
        </ReportCard>
    );
}