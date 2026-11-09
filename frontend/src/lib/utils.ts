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