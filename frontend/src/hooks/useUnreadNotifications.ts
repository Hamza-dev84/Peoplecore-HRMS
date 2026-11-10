"use client";

import { useEffect, useState } from "react";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/constants";
import { notificationService } from "@/services/notification.service";

const POLL_INTERVAL_MS = 60000;

export const useUnreadNotifications = (): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const value = await notificationService.getUnreadCount();
        if (active) setCount(value);
      } catch {
        // bell silently keeps the old count if the request fails
      }
    };

    load();
    const intervalId = window.setInterval(load, POLL_INTERVAL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, []);

  return count;
};