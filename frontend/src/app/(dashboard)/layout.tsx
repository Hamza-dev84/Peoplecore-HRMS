"use client";

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
// import { AppShell } from "@/components/layout/AppShell";
import { AppShell } from "@/components/layout/AppShell";
import { PageLoader } from "@/components/ui/Spinner";
// import { AccessDenied } from "@/features/auth/AccessDenied";
import { AccessDenied } from "@/features/auth/AccessDenied";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccess } from "@/lib/permissions";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hadUser = useRef(false);

  useEffect(() => {
    if (user) hadUser.current = true;
  }, [user]);

  useEffect(() => {
    if (loading || user) return;

    router.replace(
      hadUser.current ? "/login" : `/login?redirect=${encodeURIComponent(pathname)}`
    );
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <AppShell>{canAccess(pathname, user.role) ? children : <AccessDenied />}</AppShell>
  );
}