import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const styles: Record<BadgeVariant, { badge: string; dot: string }> = {
  success: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  warning: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  danger: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  info: { badge: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-500" },
  neutral: { badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
};

export function Badge({ variant = "neutral", dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[variant].badge,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", styles[variant].dot)} />}
      {children}
    </span>
  );
}