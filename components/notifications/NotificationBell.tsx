"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import NotificationDropdown from "./NotificationDropdown";
import { supabase } from "@/lib/supabase/client";

interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
}

export default function NotificationBell({
  unreadCount: initialUnreadCount = 0,
  onClick,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("is_read", false)
      .is("archived_at", null);

    if (error) {
      console.error("Could not load notification count:", error);
      return;
    }

    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUnreadCount();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUnreadCount]);

  const handleNotificationChange = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
    void loadUnreadCount();
  }, [loadUnreadCount]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);
          onClick?.();
        }}
        className="
          group relative flex h-11 w-11 items-center justify-center
          rounded-xl border border-zinc-800 bg-zinc-900/60
          transition-colors hover:bg-zinc-800
        "
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
      >
        <Image
          src="/images/icons/notifications.png"
          alt=""
          width={250}
          height={250}
          priority
          className={`     h-8 w-8 object-contain
              transition-all duration-200
              group-hover:scale-110
              ${
                unreadCount > 0
                  ? "opacity-100 drop-shadow-[0_0_5px_rgba(168,85,247,0.65)]"
                  : "grayscale brightness-75 opacity-50"
              }
            `}
          />


        {unreadCount > 0 && (
          <span
            className="
              absolute -right-1 -top-1 flex h-5 min-w-5
              items-center justify-center rounded-full
              bg-purple-600 px-1 text-[11px] font-bold text-white
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        open={open}
        onClose={() => setOpen(false)}
        refreshKey={refreshKey}
        onNotificationsChanged={handleNotificationChange}
      />
    </div>
  );
}