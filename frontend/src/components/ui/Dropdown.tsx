"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: ReactNode;
  label?: string;
  align?: "left" | "right";
  className?: string;
  children: ReactNode;
}

export function Dropdown({
  trigger,
  label = "Open menu",
  align = "right",
  className,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute z-50 mt-2 min-w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownHeader({ children }: { children: ReactNode }) {
  return <div className="mb-1 border-b border-slate-100 px-4 py-3">{children}</div>;
}

interface DropdownItemProps {
  icon?: LucideIcon;
  href?: string;
  danger?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function DropdownItem({ icon: Icon, href, danger = false, onClick, children }: DropdownItemProps) {
  const classes = cn(
    "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors",
    danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
  );

  const content = (
    <>
      {Icon && <Icon size={16} />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} role="menuitem" className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}