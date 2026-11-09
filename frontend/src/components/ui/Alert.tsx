import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  className?: string;
  children: ReactNode;
}

const styles: Record<AlertVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function Alert({ variant = "info", title, className, children }: AlertProps) {
  const Icon = icons[variant];

  return (
    <div role="alert" className={cn("flex gap-3 rounded-lg border p-3 text-sm", styles[variant], className)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}