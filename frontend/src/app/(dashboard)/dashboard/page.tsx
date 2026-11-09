"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { AdminDashboardView } from "@/features/dashboard/AdminDashboardView";
import { EmployeeDashboardView } from "@/features/dashboard/EmployeeDashboardView";
import { getErrorMessage } from "@/lib/errors";
import { dashboardService, isAdminDashboard } from "@/services/dashboard.service";
import type { DashboardData } from "@/types/dashboard";

interface DashboardResult {
  key: string;
  data?: DashboardData;
  error?: string;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full lg:col-span-2" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<DashboardResult | null>(null);

  const currentKey = String(refreshKey);
  const loading = result?.key !== currentKey;

  useEffect(() => {
    let active = true;

    dashboardService
      .get()
      .then((data) => {
        if (active) setResult({ key: currentKey, data });
      })
      .catch((err) => {
        if (active) setResult({ key: currentKey, error: getErrorMessage(err) });
      });

    return () => {
      active = false;
    };
  }, [currentKey]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name}`}
        actions={
          <Button
            variant="outline"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : undefined} /> Refresh
          </Button>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : result?.error ? (
        <div className="space-y-3">
          <Alert variant="error">{result.error}</Alert>
          <Button variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>
            Try again
          </Button>
        </div>
      ) : result?.data ? (
        isAdminDashboard(result.data) ? (
          <AdminDashboardView data={result.data} />
        ) : (
          <EmployeeDashboardView data={result.data} />
        )
      ) : null}
    </>
  );
}