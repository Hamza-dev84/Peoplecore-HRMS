import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 20, className }: LoadingSpinnerProps) {
  return <Loader2 size={size} className={cn("animate-spin", className)} aria-label="Loading" />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size={32} className="text-brand-600" />
    </div>
  );
}