"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/features/auth/AuthContext";
import {
    AttendanceReportCard,
    EmployeesReportCard,
    LeavesReportCard,
} from "@/features/reports/ReportCards";
import { hasRole } from "@/lib/permissions";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types/user";

export default function ReportsPage() {
    const { user } = useAuth();
    const isManager = hasRole(user?.role, ["super_admin", "hr"]);

    const [departments, setDepartments] = useState<string[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (!isManager) return;

        let active = true;

        Promise.all([employeeService.getDepartments(), employeeService.list({ limit: 100 })])
            .then(([departmentList, employeeList]) => {
                if (!active) return;
                setDepartments(departmentList);
                setEmployees(employeeList.employees);
            })
            .catch(() => {
                // filters just stay empty
            });

        return () => {
            active = false;
        };
    }, [isManager]);

    return (
        <>
            <PageHeader title="Reports" description="Export your data as CSV or PDF" />

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {isManager && <EmployeesReportCard departments={departments} />}
                <AttendanceReportCard isManager={isManager} employees={employees} />
                <LeavesReportCard isManager={isManager} employees={employees} />
            </div>
        </>
    );
}