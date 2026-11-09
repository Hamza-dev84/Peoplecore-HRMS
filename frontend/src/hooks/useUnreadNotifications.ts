"use client";

import { useEffect, useState } from "react";
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

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return count;
};