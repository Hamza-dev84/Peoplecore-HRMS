"use client";

import type { ReactNode } from "react";
import type { Role } from "@/constants";
import { hasRole } from "@/lib/permissions";
import { useAuth } from "./AuthContext";

interface RoleGateProps {
  roles: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { user } = useAuth();

  return <>{hasRole(user?.role, roles) ? children : fallback}</>;
}