"use client";

import { useState, type ReactNode } from "react";
import { Download, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/errors";
import type { ReportFormat } from "@/services/report.service";

interface ReportCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onDownload: (format: ReportFormat) => Promise<void>;
    children?: ReactNode;
}

export function ReportCard({ title, description, icon: Icon, onDownload, children }: ReportCardProps) {
    const [busy, setBusy] = useState<ReportFormat | null>(null);

    const download = async (format: ReportFormat) => {
        setBusy(format);
        try {
            await onDownload(format);
            toast.success(`${format.toUpperCase()} downloaded`);
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={22} />
                </span>
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                </div>
            </div>

            <div className="mt-5 flex-1 space-y-4">{children}</div>

            <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                <Button
                    variant="outline"
                    loading={busy === "csv"}
                    disabled={busy !== null}
                    onClick={() => download("csv")}
                >
                    <Download size={16} /> CSV
                </Button>
                <Button
                    variant="outline"
                    loading={busy === "pdf"}
                    disabled={busy !== null}
                    onClick={() => download("pdf")}
                >
                    <Download size={16} /> PDF
                </Button>
            </div>
        </div>
    );
}