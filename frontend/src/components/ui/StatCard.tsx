import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "green" | "amber" | "red" | "slate";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  href?: string;
}

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({ label, value, icon: Icon, tone = "brand", hint, href }: StatCardProps) {
  const card = (
    <div className="flex h-full items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <span
        className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}
      >
        <Icon size={22} />
      </span>
    </div>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block rounded-xl transition-shadow hover:shadow-md">
      {card}
    </Link>
  );
}