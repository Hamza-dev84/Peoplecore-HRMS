"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Megaphone,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/constants";
import { RoleGate } from "@/features/auth/RoleGate";
import { AnnouncementModal } from "@/features/notifications/AnnouncementModal";
import { getErrorMessage } from "@/lib/errors";
import { getSafeRedirect } from "@/lib/redirect";
import { cn, formatRelativeTime } from "@/lib/utils";
import { notificationService } from "@/services/notification.service";
import type { Pagination as PaginationData } from "@/types/api";
import type { Notification as AppNotification, NotificationType } from "@/types/notification";

const LIMIT = 10;
const EMPTY_PAGINATION: PaginationData = { page: 1, limit: LIMIT, total: 0, totalPages: 0 };

const TYPE_STYLES: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  leave_request: { icon: CalendarClock, tone: "bg-amber-50 text-amber-600" },
  leave_approved: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
  leave_rejected: { icon: XCircle, tone: "bg-red-50 text-red-600" },
  announcement: { icon: Megaphone, tone: "bg-brand-50 text-brand-600" },
};

interface ListResult {
  key: string;
  notifications: AppNotification[];
  unreadCount: number;
  pagination: PaginationData;
  error?: string;
}

type Filter = "all" | "unread";

const notifyChanged = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

export default function NotificationsPage() {
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<ListResult | null>(null);
  const [marking, setMarking] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  const currentKey = `${filter}|${page}|${refreshKey}`;
  const loading = result?.key !== currentKey;
  const unreadCount = result?.unreadCount ?? 0;

  useEffect(() => {
    let active = true;

    notificationService
      .list({ page, limit: LIMIT, unread: filter === "unread" ? true : undefined })
      .then((data) => {
        if (active) setResult({ key: currentKey, ...data });
      })
      .catch((err) => {
        if (active) {
          setResult({
            key: currentKey,
            notifications: [],
            unreadCount: 0,
            pagination: EMPTY_PAGINATION,
            error: getErrorMessage(err),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [currentKey, page, filter]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const handleOpen = async (item: AppNotification) => {
    if (!item.isRead) {
      try {
        await notificationService.markRead(item._id);
        setResult((previous) =>
          previous
            ? {
                ...previous,
                notifications: previous.notifications.map((entry) =>
                  entry._id === item._id ? { ...entry, isRead: true } : entry
                ),
                unreadCount: Math.max(previous.unreadCount - 1, 0),
              }
            : previous
        );
        notifyChanged();
      } catch (err) {
        toast.error(getErrorMessage(err));
        return;
      }
    }

    if (item.link) router.push(getSafeRedirect(item.link));
  };

  const handleDelete = async (item: AppNotification) => {
    try {
      await notificationService.remove(item._id);
      toast.success("Notification deleted");
      notifyChanged();

      if (result && result.notifications.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        refresh();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      const { updated } = await notificationService.markAllRead();
      toast.success(updated > 0 ? `${updated} marked as read` : "Everything is already read");
      notifyChanged();
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMarking(false);
    }
  };

  const pagination = result?.pagination ?? EMPTY_PAGINATION;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Leave updates and announcements"
        actions={
          <>
            <Button variant="outline" onClick={handleMarkAll} loading={marking} disabled={unreadCount === 0}>
              <CheckCheck size={16} /> Mark all as read
            </Button>
            <RoleGate roles={["super_admin", "hr"]}>
              <Button onClick={() => setAnnouncementOpen(true)}>
                <Megaphone size={16} /> Send announcement
              </Button>
            </RoleGate>
          </>
        }
      />

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
        ]}
        active={filter}
        onChange={(id: Filter) => {
          setFilter(id);
          setPage(1);
        }}
      />

      <Card padded={false}>
        {loading ? (
          <ul className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="flex gap-3 px-5 py-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : result?.error ? (
          <div className="space-y-3 p-4">
            <Alert variant="error">{result.error}</Alert>
            <Button variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : result && result.notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === "unread" ? "You are all caught up" : "No notifications yet"}
            description={
              filter === "unread"
                ? "There are no unread notifications."
                : "Leave updates and announcements will appear here."
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {result?.notifications.map((item) => {
                const { icon: Icon, tone } = TYPE_STYLES[item.type];

                return (
                  <li
                    key={item._id}
                    className={cn("flex items-start gap-2 px-4 py-4 sm:px-5", !item.isRead && "bg-brand-50/40")}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpen(item)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span
                        className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm text-slate-900",
                              item.isRead ? "font-medium" : "font-semibold"
                            )}
                          >
                            {item.title}
                          </span>
                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-slate-600">{item.message}</span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                      aria-label="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {announcementOpen && <AnnouncementModal onClose={() => setAnnouncementOpen(false)} />}
    </>
  );
}