"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Table, type Column } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";

interface Row {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "active" | "inactive";
}

const ALL_ROWS: Row[] = Array.from({ length: 23 }, (_, index) => ({
  id: String(index + 1),
  name: `Employee ${index + 1}`,
  email: `employee${index + 1}@company.com`,
  department: ["IT", "HR", "Sales"][index % 3],
  status: index % 4 === 0 ? "inactive" : "active",
}));

const LIMIT = 5;

const columns: Column<Row>[] = [
  { key: "name", header: "Name", className: "font-medium text-slate-900" },
  { key: "email", header: "Email" },
  { key: "department", header: "Department" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={row.status === "active" ? "success" : "neutral"} dot>
        {row.status === "active" ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export default function ComponentsPreview() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalPages = Math.ceil(ALL_ROWS.length / LIMIT);
  const rows = ALL_ROWS.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold">Components Preview</h1>

      <Card title="Buttons" description="Variants, sizes and loading state">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Card>

      <Card title="Form fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" placeholder="you@company.com" />
          <Input label="Password" type="password" placeholder="Min 8 characters" />
          <Input label="Phone" error="Phone number is invalid" defaultValue="123" />
          <Select label="Department" defaultValue="">
            <option value="" disabled>
              Select department
            </option>
            <option>IT</option>
            <option>HR</option>
            <option>Sales</option>
          </Select>
          <div className="sm:col-span-2">
            <Textarea label="Reason" placeholder="Write your reason" />
          </div>
        </div>
      </Card>

      <Card title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Rejected</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="neutral" dot>
            Cancelled
          </Badge>
        </div>
      </Card>

      <Card
        title="Employees"
        description="Table with skeleton, badges and pagination"
        padded={false}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLoading((value) => !value)}>
              Toggle loading
            </Button>
            <Button size="sm">
              <Plus size={16} /> Add
            </Button>
          </div>
        }
      >
        <Table columns={columns} data={rows} rowKey={(row) => row.id} loading={loading} />
        <Pagination
          page={page}
          limit={LIMIT}
          total={ALL_ROWS.length}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>

      <Card title="Empty state" padded={false}>
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try changing your search or filters, or add a new employee."
          action={<Button size="sm">Add employee</Button>}
        />
      </Card>

      <Card title="Modal, dialog and toasts">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Open confirm dialog
          </Button>
          <Button variant="secondary" onClick={() => toast.success("Saved successfully")}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Something went wrong")}>
            Error toast
          </Button>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add employee"
        description="Fill in the details below"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" placeholder="Full name" />
          <Input label="Email" type="email" placeholder="name@company.com" />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate employee?"
        message="This employee will no longer be able to login. You can activate the account again later."
        confirmText="Deactivate"
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success("Employee deactivated");
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}