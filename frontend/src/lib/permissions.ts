import { ROLES, type Role } from "@/constants";

const ALL_ROLES: Role[] = [...ROLES];
const MANAGERS: Role[] = ["super_admin", "hr"];

// Naya page banao to yahan uska rule zaroor add karo (rule na ho to access deny hota hai)
export const ROUTE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ALL_ROLES },
  { prefix: "/attendance", roles: ALL_ROLES },
  { prefix: "/leaves", roles: ALL_ROLES },
  { prefix: "/notifications", roles: ALL_ROLES },
  { prefix: "/profile", roles: ALL_ROLES },
  { prefix: "/reports", roles: ALL_ROLES },
  { prefix: "/employees", roles: MANAGERS },
];

export const canAccess = (pathname: string, role: Role): boolean => {
  const rule = ROUTE_ACCESS.filter(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return rule ? rule.roles.includes(role) : false;
};

export const hasRole = (role: Role | undefined, roles: Role[]): boolean =>
  !!role && roles.includes(role);