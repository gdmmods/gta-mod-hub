"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import NotificationDropdown from "./NotificationDropdown";

interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
}

export default function NotificationBell({
  unreadCount = 0,
  onClick,
}: NotificationBellProps) {

    const [open, setOpen] = useState(false);

  return (
  <div className="relative">
    <button
      onClick={() => {
        setOpen((prev) => !prev);
        onClick?.();
        }}
      className="
        relative
        flex
        items-center
        justify-center
        h-11
        w-11
        rounded-xl
        border
        border-zinc-800
        bg-zinc-900/60
        hover:bg-zinc-800
        transition-colors
      "
      aria-label="Notifications"
    >
      <Bell
        size={20}
        className="text-zinc-200"
      />

      {unreadCount > 0 && (
        <span
          className="
            absolute
            -top-1
            -right-1
            min-w-[20px]
            h-5
            px-1
            flex
            items-center
            justify-center
            rounded-full
            bg-purple-600
            text-[11px]
            font-bold
            text-white
          "
        >
          {unreadCount > 99
            ? "99+"
            : unreadCount}
        </span>
      )}
    </button>

    <NotificationDropdown
  open={open}
  onClose={() => setOpen(false)}
/>

 </div>
  );
}