"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { ROLES, ROLE_LABELS, type Role } from "@/constants";
import { getErrorMessage } from "@/lib/errors";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types/user";

interface FormValues {
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  joiningDate: string;
  role: Role;
}

interface EmployeeFormModalProps {
  employee?: Employee | null;
  departments: string[];
  canSetRole: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EmployeeFormModal({
  employee,
  departments,
  canSetRole,
  onClose,
  onSaved,
}: EmployeeFormModalProps) {
  const isEdit = !!employee;
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: employee?.name ?? "",
      email: employee?.email ?? "",
      department: employee?.department ?? "",
      designation: employee?.designation ?? "",
      phone: employee?.phone ?? "",
      joiningDate: employee?.joiningDate?.slice(0, 10) ?? "",
      role: "employee",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);

    try {
      if (employee) {
        await employeeService.update(employee._id, {
          name: values.name,
          department: values.department,
          designation: values.designation,
          phone: values.phone,
          ...(values.joiningDate && { joiningDate: values.joiningDate }),
        });
        toast.success("Employee updated");
        onSaved();
        onClose();
        return;
      }

      const result = await employeeService.create({
        name: values.name,
        email: values.email,
        ...(values.department && { department: values.department }),
        ...(values.designation && { designation: values.designation }),
        ...(values.phone && { phone: values.phone }),
        ...(values.joiningDate && { joiningDate: values.joiningDate }),
        ...(canSetRole && values.role !== "employee" && { role: values.role }),
      });

      onSaved();

      if (result.temporaryPassword) {
        setTemporaryPassword(result.temporaryPassword);
      } else {
        toast.success(result.message);
        onClose();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (temporaryPassword) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Employee created"
        size="sm"
        footer={<Button onClick={onClose}>Done</Button>}
      >
        <Alert variant="info" title="Email could not be sent">
          Share this temporary password with the employee manually:{" "}
          <span className="font-mono font-semibold">{temporaryPassword}</span>
        </Alert>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit employee" : "Add employee"}
      description={
        isEdit
          ? "Update the employee details"
          : "A temporary password will be emailed to the employee"
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" loading={isSubmitting}>
            {isEdit ? "Save changes" : "Add employee"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
              maxLength: { value: 50, message: "Name cannot exceed 50 characters" },
            })}
          />

          <Input
            label="Email"
            type="email"
            placeholder="name@company.com"
            disabled={isEdit}
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
            })}
          />

          <Input
            label="Department"
            placeholder="e.g. IT"
            list="department-options"
            error={errors.department?.message}
            {...register("department")}
          />
          <datalist id="department-options">
            {departments.map((department) => (
              <option key={department} value={department} />
            ))}
          </datalist>

          <Input
            label="Designation"
            placeholder="e.g. Software Engineer"
            error={errors.designation?.message}
            {...register("designation")}
          />

          <Input
            label="Phone"
            placeholder="03001234567"
            error={errors.phone?.message}
            {...register("phone", {
              pattern: {
                value: /^[0-9+\-\s()]{7,20}$/,
                message: "Enter a valid phone number",
              },
            })}
          />

          <Input
            label="Joining date"
            type="date"
            error={errors.joiningDate?.message}
            {...register("joiningDate")}
          />

          {canSetRole && !isEdit && (
            <Select label="Role" {...register("role")}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          )}
        </div>
      </form>
    </Modal>
  );
}