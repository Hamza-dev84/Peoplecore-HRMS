"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { ROLES, ROLE_LABELS, type Role } from "@/constants";
import { getErrorMessage } from "@/lib/errors";
import { employeeService } from "@/services/employee.service";
import type { Employee } from "@/types/user";

interface ChangeRoleModalProps {
  employee: Employee;
  onClose: () => void;
  onSaved: () => void;
}

export function ChangeRoleModal({ employee, onClose, onSaved }: ChangeRoleModalProps) {
  const [role, setRole] = useState<Role>(employee.role);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await employeeService.changeRole(employee._id, role);
      toast.success(`${employee.name} is now ${ROLE_LABELS[role]}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Change role"
      description={employee.name}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={role === employee.role}>
            Save role
          </Button>
        </>
      }
    >
      <Select label="Role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
        {ROLES.map((item) => (
          <option key={item} value={item}>
            {ROLE_LABELS[item]}
          </option>
        ))}
      </Select>
    </Modal>
  );
}