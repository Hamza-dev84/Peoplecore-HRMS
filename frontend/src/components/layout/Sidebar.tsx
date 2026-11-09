"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { canAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => user && canAccess(item.href, user.role));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5 text-lg font-semibold text-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Building2 size={20} />
        </span>
        HRMS
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon size={18} className={active ? "text-brand-600" : "text-slate-400"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
        HRMS Enterprise
      </div>
    </div>
  );
}