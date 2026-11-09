import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, description, action, padded = true, className, children }: CardProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </div>
  );
}