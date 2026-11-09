"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";
import { PageLoader } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/AuthContext";
import { getSafeRedirect } from "@/lib/redirect";

const FEATURES = [
  "Attendance tracking with check-in and check-out",
  "Leave requests with approval workflow",
  "Role-based dashboards for HR and employees",
  "CSV and PDF reports in one click",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const target = new URLSearchParams(window.location.search).get("redirect");
      router.replace(getSafeRedirect(target));
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return <PageLoader />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Building2 size={20} />
          </span>
          HRMS Enterprise
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Manage your people,
            <br />
            all in one place.
          </h1>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-brand-100">
                <CheckCircle2 size={18} className="shrink-0 text-brand-300" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-brand-200">© {new Date().getFullYear()} HRMS Enterprise</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 text-lg font-semibold text-slate-900 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Building2 size={20} />
            </span>
            HRMS Enterprise
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}