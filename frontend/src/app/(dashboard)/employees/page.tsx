"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Search, UserCheck, UserCog, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { ROLE_LABELS, ROLE_VARIANT } from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { ChangeRoleModal } from "@/features/employees/ChangeRoleModal";
import { EmployeeFormModal } from "@/features/employees/EmployeeFormModal";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/errors";
import { cn, formatDate } from "@/lib/utils";
import { employeeService } from "@/services/employee.service";
import type { Pagination as PaginationData } from "@/types/api";
import type { Employee } from "@/types/user";

const LIMIT = 10;
const EMPTY_PAGINATION: PaginationData = { page: 1, limit: LIMIT, total: 0, totalPages: 0 };

interface ListResult {
  key: string;
  employees: Employee[];
  pagination: PaginationData;
  error?: string;
}

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";

export default function EmployeesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [searchInput, setSearchInput] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [result, setResult] = useState<ListResult | null>(null);

  const [formTarget, setFormTarget] = useState<Employee | null | undefined>(undefined);
  const [roleTarget, setRoleTarget] = useState<Employee | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);
  const currentKey = `${page}|${debouncedSearch}|${department}|${refreshKey}`;
  const loading = result?.key !== currentKey;

  const loadDepartments = useCallback(async () => {
    try {
      setDepartments(await employeeService.getDepartments());
    } catch {
      // filter dropdown just stays empty
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    let active = true;

    employeeService
      .list({
        page,
        limit: LIMIT,
        search: debouncedSearch.trim() || undefined,
        department: department || undefined,
      })
      .then((data) => {
        if (active) setResult({ key: currentKey, ...data });
      })
      .catch((err) => {
        if (active) {
          setResult({
            key: currentKey,
            employees: [],
            pagination: EMPTY_PAGINATION,
            error: getErrorMessage(err),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [currentKey, page, debouncedSearch, department]);

  const refresh = () => {
    setRefreshKey((value) => value + 1);
    loadDepartments();
  };

  const clearFilters = () => {
    setSearchInput("");
    setDepartment("");
    setPage(1);
  };

  const canManage = (row: Employee) => !(user?.role === "hr" && row.role === "super_admin");

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;

    setActionLoading(true);
    try {
      await employeeService.deactivate(deactivateTarget._id);
      toast.success(`${deactivateTarget.name} deactivated`);
      setDeactivateTarget(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (row: Employee) => {
    try {
      await employeeService.update(row._id, { isActive: true });
      toast.success(`${row.name} activated`);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.profileImage} size={36} />
          <div>
            <Link
              href={`/employees/${row._id}`}
              className="font-medium text-slate-900 hover:text-brand-600"
            >
              {row.name}
            </Link>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "department", header: "Department", render: (row) => row.department || "-" },
    { key: "designation", header: "Designation", render: (row) => row.designation || "-" },
    {
      key: "role",
      header: "Role",
      render: (row) => <Badge variant={ROLE_VARIANT[row.role]}>{ROLE_LABELS[row.role]}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"} dot>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { key: "joiningDate", header: "Joined", render: (row) => formatDate(row.joiningDate) },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-0.5">
          <Link href={`/employees/${row._id}`} className={iconButton} title="View" aria-label="View">
            <Eye size={16} />
          </Link>

          {canManage(row) && (
            <button
              type="button"
              className={iconButton}
              title="Edit"
              aria-label="Edit"
              onClick={() => setFormTarget(row)}
            >
              <Pencil size={16} />
            </button>
          )}

          {isSuperAdmin && row._id !== user?.id && (
            <>
              <button
                type="button"
                className={iconButton}
                title="Change role"
                aria-label="Change role"
                onClick={() => setRoleTarget(row)}
              >
                <UserCog size={16} />
              </button>

              {row.isActive ? (
                <button
                  type="button"
                  className={cn(iconButton, "hover:bg-red-50 hover:text-red-600")}
                  title="Deactivate"
                  aria-label="Deactivate"
                  onClick={() => setDeactivateTarget(row)}
                >
                  <UserX size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={cn(iconButton, "hover:bg-emerald-50 hover:text-emerald-600")}
                  title="Activate"
                  aria-label="Activate"
                  onClick={() => handleActivate(row)}
                >
                  <UserCheck size={16} />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const hasFilters = !!(debouncedSearch.trim() || department);
  const pagination = result?.pagination ?? EMPTY_PAGINATION;

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your team members"
        actions={
          <Button onClick={() => setFormTarget(null)}>
            <Plus size={16} /> Add employee
          </Button>
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              className="pl-9"
              placeholder="Search by name or email"
              aria-label="Search employees"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="sm:w-56">
            <Select
              aria-label="Filter by department"
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All departments</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {result?.error && !loading ? (
          <div className="space-y-3 p-4">
            <Alert variant="error">{result.error}</Alert>
            <Button variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={result?.employees ?? []}
              rowKey={(row) => row._id}
              loading={loading}
              emptyState={
                <EmptyState
                  title={hasFilters ? "No employees match your filters" : "No employees yet"}
                  description={
                    hasFilters
                      ? "Try a different search or clear the filters."
                      : "Add your first employee to get started."
                  }
                  action={
                    hasFilters ? (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setFormTarget(null)}>
                        <Plus size={16} /> Add employee
                      </Button>
                    )
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

      {formTarget !== undefined && (
        <EmployeeFormModal
          key={formTarget?._id ?? "new"}
          employee={formTarget}
          departments={departments}
          canSetRole={isSuperAdmin}
          onClose={() => setFormTarget(undefined)}
          onSaved={refresh}
        />
      )}

      {roleTarget && (
        <ChangeRoleModal
          employee={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSaved={refresh}
        />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate employee?"
        message={`${deactivateTarget?.name ?? "This employee"} will no longer be able to login. Their attendance and leave history is kept, and you can activate the account again later.`}
        confirmText="Deactivate"
        loading={actionLoading}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </>
  );
}