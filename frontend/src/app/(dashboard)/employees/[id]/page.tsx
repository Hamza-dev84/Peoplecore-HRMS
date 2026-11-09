"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/Spinner";
import { ROLE_LABELS, ROLE_VARIANT } from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { EmployeeFormModal } from "@/features/employees/EmployeeFormModal";
import { getErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/utils";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types/user";

interface DetailResult {
  key: string;
  employee: Employee | null;
  error?: string;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "-"}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<DetailResult | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const currentKey = `${id}|${refreshKey}`;
  const loading = result?.key !== currentKey;
  const employee = result?.employee ?? null;

  useEffect(() => {
    let active = true;

    employeeService
      .getById(id)
      .then((data) => {
        if (active) setResult({ key: currentKey, employee: data });
      })
      .catch((err) => {
        if (active) setResult({ key: currentKey, employee: null, error: getErrorMessage(err) });
      });

    return () => {
      active = false;
    };
  }, [id, currentKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const toggleActive = async () => {
    if (!employee) return;

    setActionLoading(true);
    try {
      if (employee.isActive) {
        await employeeService.deactivate(employee._id);
        toast.success(`${employee.name} deactivated`);
      } else {
        await employeeService.update(employee._id, { isActive: true });
        toast.success(`${employee.name} activated`);
      }
      setConfirmOpen(false);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!employee) {
    return (
      <>
        <Link
          href="/employees"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to employees
        </Link>
        <Alert variant="error">{result?.error ?? "Employee not found"}</Alert>
      </>
    );
  }

  const canEdit = !(user?.role === "hr" && employee.role === "super_admin");
  const isSelf = employee._id === user?.id;

  return (
    <>
      <Link
        href="/employees"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Back to employees
      </Link>

      <PageHeader
        title={employee.name}
        description={employee.email}
        actions={
          <>
            {canEdit && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil size={16} /> Edit
              </Button>
            )}
            {isSuperAdmin && !isSelf && (
              <Button
                variant={employee.isActive ? "danger" : "primary"}
                onClick={() => (employee.isActive ? setConfirmOpen(true) : toggleActive())}
              >
                {employee.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                {employee.isActive ? "Deactivate" : "Activate"}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={employee.name} src={employee.profileImage} size={96} />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{employee.name}</h2>
            <p className="text-sm text-slate-500">{employee.designation || "No designation"}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant={ROLE_VARIANT[employee.role]}>{ROLE_LABELS[employee.role]}</Badge>
              <Badge variant={employee.isActive ? "success" : "neutral"} dot>
                {employee.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card title="Employee details" className="lg:col-span-2">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Info label="Email" value={employee.email} />
            <Info label="Phone" value={employee.phone ?? ""} />
            <Info label="Department" value={employee.department ?? ""} />
            <Info label="Designation" value={employee.designation ?? ""} />
            <Info label="Joining date" value={formatDate(employee.joiningDate)} />
            <Info label="Email verified" value={employee.isEmailVerified ? "Yes" : "No"} />
            <Info label="Account created" value={formatDateTime(employee.createdAt)} />
            <Info label="Last updated" value={formatDateTime(employee.updatedAt)} />
          </dl>
        </Card>
      </div>

      {editing && (
        <EmployeeFormModal
          employee={employee}
          departments={[]}
          canSetRole={false}
          onClose={() => setEditing(false)}
          onSaved={refresh}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate employee?"
        message={`${employee.name} will no longer be able to login. Their history is kept and you can activate the account again later.`}
        confirmText="Deactivate"
        loading={actionLoading}
        onConfirm={toggleActive}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}