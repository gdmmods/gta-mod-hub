"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bell,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { getNotifications } from "@/lib/notifications/getNotifications";

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
  refreshKey?: number;
  onNotificationsChanged?: () => void;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  title: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  recorded_at: string;
}

interface Notification {
  id: string;
  profile_id: string;
  activity_event_id: string;
  is_read: boolean;
  created_at: string;
  archived_at: string | null;
  activity_events: ActivityEvent | ActivityEvent[] | null;
}

type CategoryId =
  | "all"
  | "projects"
  | "assets"
  | "knowledge"
  | "showcases"
  | "teams"
  | "creators";

interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  {
    id: "all",
    label: "All Activity",
    icon: "/images/icons/allactivity.png",
  },
  {
    id: "projects",
    label: "Projects",
    icon: "/images/icons/projects.png",
  },
  {
    id: "assets",
    label: "Assets",
    icon: "/images/icons/assets.png",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    icon: "/images/icons/knowledge.png",
  },
  {
    id: "showcases",
    label: "Showcases",
    icon: "/images/icons/showcases.png",
  },
  {
    id: "teams",
    label: "Teams",
    icon: "/images/icons/teams.png",
  },
  {
    id: "creators",
    label: "Creators",
    icon: "/images/icons/creators.png",
  },
];

function getEvent(
  event: Notification["activity_events"]
): ActivityEvent | null {
  return Array.isArray(event) ? event[0] ?? null : event;
}

function getCategory(event: ActivityEvent | null): CategoryId {
  const type = event?.event_type ?? "";

  if (
    type.startsWith("team_") ||
    type.startsWith("invitation_") ||
    type.startsWith("team_member_")
  ) {
    return "teams";
  }

  if (
    type.includes("comment") ||
    type.includes("review") ||
    type.includes("mod_") ||
    type.includes("project_") ||
    type.includes("release")
  ) {
    return "projects";
  }

  if (type.includes("asset")) return "assets";

  if (
    type.includes("tutorial") ||
    type.includes("knowledge") ||
    type.includes("article")
  ) {
    return "knowledge";
  }

  if (type.includes("showcase")) return "showcases";

  if (
    type.startsWith("creator_") ||
    type.includes("profile_")
  ) {
    return "creators";
  }

  return "all";
}

function getTitle(event: ActivityEvent | null): string {
  if (event?.title) return event.title;

  switch (event?.event_type) {
    case "team_member_invited":
      return "Team invitation";

    case "team_member_joined":
      return "New team member";

    case "team_member_invitation_declined":
      return "Invitation declined";

    case "comment_created":
      return "New comment";

    case "comment_reply_created":
      return "New reply";

    case "mod_published":
      return "New release";

    default:
      return "New activity";
  }
}

function getDescription(event: ActivityEvent | null): string {
  if (event?.summary) return event.summary;

  switch (event?.event_type) {
    case "team_member_invited":
      return "You've received a team invitation.";

    case "team_member_joined":
      return "A creator joined a team.";

    case "comment_created":
      return "Someone commented on a project.";

    case "comment_reply_created":
      return "Someone replied to a discussion.";

    case "mod_published":
      return "A new release has been published.";

    default:
      return "There's new activity on ModVault.";
  }
}

function getCategoryLabel(category: CategoryId): string {
  return CATEGORIES.find((item) => item.id === category)?.label
    ?? "Activity";
}

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString();
}

export default function NotificationDropdown({
  open,
  onClose,
  refreshKey = 0,
  onNotificationsChanged,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<CategoryId>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setNotifications([]);
        return;
      }

      const result = await getNotifications(user.id);

      setNotifications(
        (result as Notification[])
          .filter((notification) => !notification.archived_at)
          .slice(0, 50)
      );
    } catch (cause) {
      console.error("Could not load notifications:", cause);
      setLoadError("Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, refreshKey, load]);

  async function markAsRead(notification: Notification) {
    if (notification.is_read || busyId) return;

    setBusyId(notification.id);
    setLoadError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== notification.profile_id) {
        throw new Error("Notification recipient could not be verified.");
      }

      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notification.id)
        .eq("profile_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      onNotificationsChanged?.();
    } catch (cause) {
      console.error("Could not mark notification as read:", cause);
      setLoadError("The notification could not be marked as read.");
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeCategory === "all") return true;

    return getCategory(getEvent(notification.activity_events))
      === activeCategory;
  });

  const categoryCounts = CATEGORIES.reduce(
    (counts, category) => {
      counts[category.id] = notifications.filter((notification) => {
        if (notification.is_read) return false;

        if (category.id === "all") return true;

        return (
          getCategory(getEvent(notification.activity_events))
          === category.id
        );
      }).length;

      return counts;
    },
    {} as Record<CategoryId, number>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Activity Hub Preview */}
      <section
        role="dialog"
        aria-label="Activity Hub"
        className="
          absolute right-0 top-14 z-50
          w-[min(780px,calc(100vw-24px))]
          overflow-hidden rounded-2xl
          border border-zinc-800
          bg-zinc-950 shadow-2xl
        "
      >
        {/* Header */}
        <header className="
          flex items-center justify-between gap-4
          border-b border-zinc-800 px-5 py-4
        ">
          <div>
            <div className="flex items-center gap-2">
              <Activity
                size={18}
                className="text-purple-400"
              />

              <h3 className="text-base font-bold text-white">
                Activity Hub
              </h3>

              {unreadCount > 0 && (
                <span className="
                  rounded-full bg-purple-500/15
                  px-2 py-0.5 text-xs font-semibold
                  text-purple-300
                ">
                  {unreadCount} new
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Recent activity across ModVault
            </p>
          </div>

          <Link
            href="/activity"
            onClick={onClose}
            className="
              flex shrink-0 items-center gap-1
              text-xs font-medium text-purple-300
              transition hover:text-purple-200
            "
          >
            View all
            <ArrowUpRight size={14} />
          </Link>
        </header>

        {/* Sidebar + Feed */}
        <div className="grid grid-cols-[150px_minmax(0,1fr)] sm:grid-cols-[175px_minmax(0,1fr)]">

          {/* Category Sidebar */}
          <aside className="
            border-r border-zinc-800
            bg-zinc-950 p-2 sm:p-3
          ">
            <p className="
              mb-3 px-2 pt-1 text-[10px]
              font-semibold uppercase tracking-[0.18em]
              text-zinc-600
            ">
              Categories
            </p>

            <nav aria-label="Activity categories" className="space-y-1">
              {CATEGORIES.map((category) => {
  const active = activeCategory === category.id;
  const count = categoryCounts[category.id];

  const hasActivity = notifications.some((notification) => {
    if (category.id === "all") return true;

    return (
      getCategory(getEvent(notification.activity_events)) ===
      category.id
    );
  });

  return (
    <button
      key={category.id}
      type="button"
      onClick={() => setActiveCategory(category.id)}
      aria-pressed={active}
      className={`
        flex w-full items-center gap-2
        rounded-lg px-2 py-2.5 text-left
        transition-colors duration-200
        ${
          active
            ? "bg-purple-500/15 text-purple-200"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
        }
      `}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        <img
          src={category.icon}
          alt=""
          aria-hidden="true"
          className={`
            h-7 w-7 object-contain
            transition-all duration-200
            ${
              hasActivity
                ? "opacity-100"
                : "grayscale brightness-75 opacity-55"
            }
          `}
        />
      </span>

      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {category.label}
      </span>

      {count > 0 && (
        <span
          className="
            flex h-5 min-w-5 items-center justify-center
            rounded-full bg-zinc-800 px-1
            text-[10px] font-semibold text-zinc-300
          "
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
})}
            </nav>
          </aside>

          {/* Activity Feed */}
          <div className="min-w-0">
            <div className="
              flex items-center justify-between
              border-b border-zinc-800/80
              px-4 py-3 sm:px-5
            ">
              <h4 className="text-sm font-semibold text-zinc-200">
                {getCategoryLabel(activeCategory)}
              </h4>

              <span className="text-[11px] text-zinc-500">
                {filteredNotifications.length}{" "}
                {filteredNotifications.length === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            <div className="max-h-[460px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="
                  flex min-h-[240px] items-center
                  justify-center text-sm text-zinc-500
                ">
                  Loading activity…
                </div>
              ) : loadError ? (
                <div className="
                  flex min-h-[240px] flex-col
                  items-center justify-center gap-3
                  px-5 text-center
                ">
                  <p role="alert" className="text-sm text-red-400">
                    {loadError}
                  </p>

                  <button
                    type="button"
                    onClick={() => void load()}
                    className="text-sm text-purple-300 hover:text-purple-200"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="
                  flex min-h-[240px] flex-col
                  items-center justify-center px-5
                  text-center
                ">
                  <div className="
                    mb-3 flex h-12 w-12 items-center
                    justify-center rounded-2xl
                    border border-zinc-800 bg-zinc-900
                  ">
                    <img
                    src={
                    CATEGORIES.find((category) => category.id === activeCategory)?.icon ??
                    "/images/icons/allactivity.png"
                    }
                    alt=""
                    aria-hidden="true"
                    className="h-8 w-8 object-contain grayscale opacity-50"
                    />

                  </div>

                  <p className="text-sm font-medium text-zinc-300">
                    No activity yet
                  </p>

                  <p className="mt-1 max-w-[220px] text-xs leading-5 text-zinc-500">
                    New activity in this category will appear here.
                  </p>
                </div>
              ) : (
                <ul>
                  {filteredNotifications.slice(0, 12).map((notification) => {
                    const event = getEvent(notification.activity_events);
                    const category = getCategory(event);

                    const CategoryIcon =
                      CATEGORIES.find(
                        (item) => item.id === category
                      )?.icon ?? Activity;

                    const metadata = event?.metadata ?? {};

                    const creatorProfileId =
                      typeof metadata.creatorProfileId === "string"
                        ? metadata.creatorProfileId
                        : typeof metadata.recipientCreatorId === "string"
                          ? metadata.recipientCreatorId
                          : null;

                    return (
                      <li key={notification.id}>
                        <button
                          type="button"
                          disabled={
                            notification.is_read ||
                            busyId === notification.id
                          }
                          onClick={() => void markAsRead(notification)}
                          className={`
                            flex w-full items-start gap-3
                            border-b border-zinc-800/70
                            px-4 py-4 text-left transition
                            hover:bg-zinc-900/80 sm:px-5
                            ${notification.is_read
                              ? ""
                              : "bg-purple-500/[0.035]"
                            }
                          `}
                        >
                          {/* Event Icon */} <span className="
                            flex h-12 w-12 shrink-0
                            items-center justify-center
                            rounded-xl border border-zinc-800
                            bg-zinc-900/70
                            ">
                            <img
                            src={
                            CATEGORIES.find((item) => item.id === category)?.icon ??
                            "/images/icons/allactivity.png"
                            }
                            alt=""
                            aria-hidden="true"
                            className="h-10 w-10 object-contain"
                            /> </span>


                          {/* Event Content */}
                          <span className="min-w-0 flex-1">
                            <span className="
                              flex flex-wrap items-center
                              justify-between gap-x-3 gap-y-1
                            ">
                              <span className={`
                                text-sm
                                ${notification.is_read
                                  ? "font-medium text-zinc-300"
                                  : "font-semibold text-white"
                                }
                              `}>
                                {getTitle(event)}
                              </span>

                              <span className="
                                shrink-0 text-[10px]
                                text-zinc-500
                              ">
                                {formatRelativeTime(
                                  event?.occurred_at ??
                                  event?.recorded_at ??
                                  notification.created_at
                                )}
                              </span>
                            </span>

                            <span className="
                              mt-1 block text-xs
                              leading-5 text-zinc-400
                            ">
                              {getDescription(event)}
                            </span>

                            <span className="
                              mt-2 flex flex-wrap
                              items-center gap-2
                            ">
                              <span className="
                                rounded-md border
                                border-purple-500/20
                                bg-purple-500/10
                                px-2 py-0.5 text-[10px]
                                font-medium text-purple-300
                              ">
                                {getCategoryLabel(category)}
                              </span>

                              {creatorProfileId && (
                                <span className="
                                  flex items-center gap-1
                                  text-[10px] text-zinc-500
                                ">
                                  <UserRound size={11} />
                                  Creator activity
                                </span>
                              )}

                              {!notification.is_read && (
                                <span className="
                                  ml-auto h-1.5 w-1.5
                                  rounded-full bg-purple-400
                                " />
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="
          flex items-center justify-between gap-3
          border-t border-zinc-800 bg-zinc-950
          p-3 sm:p-4
        ">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Bell size={13} />
            <span>Stay up to date with ModVault</span>
          </div>

          <Link
            href="/activity"
            onClick={onClose}
            className="
              inline-flex shrink-0 items-center gap-2
              rounded-xl border border-zinc-700
              px-4 py-2.5 text-xs font-semibold
              text-zinc-200 transition
              hover:border-purple-500/40
              hover:bg-purple-500/10
              hover:text-white
            "
          >
            Open Activity Hub
            <ArrowUpRight size={14} />
          </Link>
        </footer>
      </section>
    </>
  );
}