"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/features/auth/AuthContext";
import { AttendanceHistory } from "@/features/attendance/AttendanceHistory";
import { MonthlySummary } from "@/features/attendance/MonthlySummary";
import { TodayAttendanceCard } from "@/features/attendance/TodayAttendanceCard";
import { hasRole } from "@/lib/permissions";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types/user";

export default function AttendancePage() {
  const { user } = useAuth();
  const isManager = hasRole(user?.role, ["super_admin", "hr"]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (!isManager) return;

    let active = true;

    employeeService
      .list({ limit: 100 })
      .then((data) => {
        if (active) setEmployees(data.employees);
      })
      .catch(() => {
        // the employee filter just stays empty
      });

    return () => {
      active = false;
    };
  }, [isManager]);

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Check in, check out and review attendance history"
        actions={
          isManager ? (
            <div className="w-full sm:w-64">
              <Select
                aria-label="Filter by employee"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                <option value="">All employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TodayAttendanceCard onChange={() => setRefreshKey((value) => value + 1)} />
        </div>
        <div className="lg:col-span-2">
          <MonthlySummary isManager={isManager} employeeId={employeeId} />
        </div>
      </div>

      <div className="mt-6">
        <AttendanceHistory
          key={employeeId}
          isManager={isManager}
          employeeId={employeeId}
          refreshKey={refreshKey}
        />
      </div>
    </>
  );
}