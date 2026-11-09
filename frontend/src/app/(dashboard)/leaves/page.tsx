"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/features/auth/AuthContext";
import { ApplyLeaveModal } from "@/features/leaves/ApplyLeaveModal";
import { LeaveList } from "@/features/leaves/LeaveList";
import { hasRole } from "@/lib/permissions";

type Tab = "mine" | "manage";

export default function LeavesPage() {
  const { user } = useAuth();
  const isManager = hasRole(user?.role, ["super_admin", "hr"]);

  const [tab, setTab] = useState<Tab>("mine");
  const [applyOpen, setApplyOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <>
      <PageHeader
        title="Leaves"
        description="Apply for leave and track your requests"
        actions={
          <Button onClick={() => setApplyOpen(true)}>
            <Plus size={16} /> Apply for leave
          </Button>
        }
      />

      {isManager && (
        <Tabs
          tabs={[
            { id: "mine", label: "My leaves" },
            { id: "manage", label: "Leave requests" },
          ]}
          active={tab}
          onChange={setTab}
        />
      )}

      <LeaveList
        key={isManager ? tab : "mine"}
        mode={isManager ? tab : "mine"}
        refreshKey={refreshKey}
        onChanged={refresh}
      />

      {applyOpen && <ApplyLeaveModal onClose={() => setApplyOpen(false)} onSaved={refresh} />}
    </>
  );
}