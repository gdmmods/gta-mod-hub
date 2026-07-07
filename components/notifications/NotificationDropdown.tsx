"use client";

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({
  open,
  onClose,
}: NotificationDropdownProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div
        className="
          absolute
          right-0
          top-14
          z-50
          w-[380px]
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900
          shadow-2xl
          overflow-hidden
        "
      >
        <div
          className="
            px-5
            py-4
            border-b
            border-zinc-800
          "
        >
          <h3 className="text-lg font-semibold">
            Notifications
          </h3>

          <p className="text-sm text-zinc-400 mt-1">
            You're all caught up.
          </p>
        </div>

        <div
          className="
            flex
            items-center
            justify-center
            py-12
            text-zinc-500
          "
        >
          No notifications yet.
        </div>

        <div
          className="
            border-t
            border-zinc-800
            p-4
          "
        >
          <button
            className="
              w-full
              rounded-xl
              border
              border-zinc-700
              py-2.5
              hover:bg-zinc-800
              transition
            "
          >
            View Notification Center
          </button>
        </div>
      </div>
    </>
  );
}