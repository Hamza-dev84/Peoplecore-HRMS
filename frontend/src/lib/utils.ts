import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { config } from "./config";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const getImageUrl = (path?: string): string => (path ? `${config.apiOrigin}${path}` : "");

export const formatMinutes = (minutes: number): string =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export const formatDate = (value?: string): string =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    : "-";

export const formatDateTime = (value?: string): string =>
  value
    ? new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "-";

export const formatTime = (value?: string): string =>
  value
    ? new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "-";

export const formatPeriod = (start: string, end: string): string =>
  start === end ? formatDate(start) : `${formatDate(start)} - ${formatDate(end)}`;

export const currentMonth = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const formatRelativeTime = (value: string): string => {
  const diffSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const absolute = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absolute < 60) return "just now";
  if (absolute < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absolute < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (absolute < 604800) return formatter.format(Math.round(diffSeconds / 86400), "day");

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};