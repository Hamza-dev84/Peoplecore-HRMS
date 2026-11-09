import {
  CalendarDays,
  Clock,
  FileText,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Attendance", href: "/attendance", icon: Clock },
  { label: "Leaves", href: "/leaves", icon: CalendarDays },
  { label: "Reports", href: "/reports", icon: FileText },
];