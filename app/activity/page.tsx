"use client";

import { discussionPresentation } from "@/lib/notifications/discussionPresentation";
import { discussionEventHref } from "@/lib/discussions/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase/client";
import { getNotifications } from "@/lib/notifications/getNotifications";

type ActivityEvent = {
  id: string;
  event_type: string;
  title: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  recorded_at: string;
};
type Notification = {
  id: string;
  profile_id: string;
  activity_event_id: string;
  is_read: boolean;
  created_at: string;
  archived_at: string | null;
  activity_events: ActivityEvent | ActivityEvent[] | null;
};

function eventOf(notification: Notification): ActivityEvent | null {
  const event = notification.activity_events;
  return Array.isArray(event) ? event[0] ?? null : event;
}

function titleOf(event: ActivityEvent | null, accountId: string | null, pendingInvitationIds: Set<string>): string {
  const discussion = discussionPresentation(event);
  if (discussion) return discussion.title;
  if (event?.event_type === "team_member_invited") {
    if (event.metadata?.senderProfileId !== accountId) return "Team invitation";
    const invitationId = event.metadata?.invitationId;

    return typeof invitationId === "string" && pendingInvitationIds.has(invitationId) ? "Pending team invitation" : "Team invitation sent";
  }
  if (event?.title) return event.title;
  if (event?.event_type === "team_member_joined") return "Team invitation accepted";
  if (event?.event_type === "team_member_left") return event?.title ?? "Team member left";
  return "New activity";
}

function summaryOf(event: ActivityEvent | null, accountId: string | null, pendingInvitationIds: Set<string>): string {
  const discussion = discussionPresentation(event);
  if (discussion) return discussion.summary;
  if (event?.event_type === "team_member_invited") {
    const metadata = event.metadata ?? {};
    const teamName = typeof metadata.teamName === "string" ? metadata.teamName : "the team";
    if (metadata.senderProfileId === accountId) {
      const recipientName = typeof metadata.recipientCreatorName === "string" ? metadata.recipientCreatorName : "A creator";
      const invitationId = metadata.invitationId;
      const pending = typeof invitationId === "string" && pendingInvitationIds.has(invitationId);
      return "You invited " + recipientName + " to join " + teamName + (pending ? ". Waiting for their response." : ".");
    }
    return "You've been invited to join " + teamName + ".";
  }
  return event?.summary ?? "There's new activity on ModVault.";
}

function destinationOf(event: ActivityEvent | null): string {
  const commentHref = discussionEventHref(event);
  if (commentHref) return commentHref;
  if (event?.event_type === "team_member_invited") return "/activity";
  if (event?.event_type === "team_member_joined" || event?.event_type === "team_member_left") {
    const creatorId = event.metadata?.teamCreatorId;
    if (typeof creatorId === "string" && creatorId) return "/creator/" + encodeURIComponent(creatorId);
  }
  return "/activity";
}

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountConnected, setAccountConnected] = useState<boolean | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingInvitationIds, setPendingInvitationIds] = useState<Set<string>>(new Set());
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setAccountConnected(false);
        setAccountId(null);
        setNotifications([]);
        setPendingInvitationIds(new Set());
        return;
      }
      setAccountConnected(true);
      setAccountId(user.id);
      const result = (await getNotifications(user.id) as Notification[]).filter((item) => !item.archived_at);
      setNotifications(result);
      const pendingIds = new Set<string>();
      const incomingResponse = await fetch("/api/team-invitations", { cache: "no-store" }).catch(() => null);
      if (incomingResponse?.ok) {
        const payload = await incomingResponse.json();
        for (const invitation of payload.invitations ?? []) {
          if (invitation.status === "pending" && typeof invitation.invitation_id === "string") pendingIds.add(invitation.invitation_id);
        }
      }
      const outgoingTeamIds = [...new Set(result.flatMap((notification) => {
        const event = eventOf(notification);
        const metadata = event?.metadata ?? {};
        return event?.event_type === "team_member_invited" && metadata.senderProfileId === user.id && typeof metadata.teamId === "string" ? [metadata.teamId] : [];
      }))];
      const outgoingResults = await Promise.all(outgoingTeamIds.map(async (teamId) => {
        const response = await fetch("/api/team-invitations?teamId=" + encodeURIComponent(teamId), { cache: "no-store" }).catch(() => null);
        if (!response?.ok) return [];
        const payload = await response.json();
        return payload.invitations ?? [];
      }));
      for (const invitations of outgoingResults) {
        for (const invitation of invitations) {
          if (invitation.status === "pending" && typeof invitation.invitation_id === "string") pendingIds.add(invitation.invitation_id);
        }
      }
      setPendingInvitationIds(pendingIds);
    } catch (cause) {
      console.error("Could not load activity:", cause);
      setError("Activity could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function markRead(notification: Notification) {
    if (notification.is_read) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== notification.profile_id) throw new Error("Notification recipient could not be verified.");
      const { error: updateError } = await supabase.from("notifications").update({
        is_read: true,
        read_at: new Date().toISOString(),
      }).eq("id", notification.id).eq("profile_id", user.id).eq("is_read", false);
      if (updateError) throw updateError;
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      window.dispatchEvent(new Event("modvault:notifications-changed"));
    } catch (cause) {
      console.error("Could not mark activity as read:", cause);
      setError("This activity could not be marked as read.");
    }
  }

  async function respondToInvitation(notification: Notification, event: ActivityEvent, accept: boolean) {
    const invitationId = event.metadata?.invitationId;
    if (typeof invitationId !== "string" || !invitationId) {
      setError("This invitation cannot be responded to from the Activity Hub.");
      return;
    }
    setRespondingId(invitationId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/team-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", invitationId, accept }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Invitation response failed.");
      const status = payload.result?.status;
      const message = status === "team_unavailable"
        ? "This team is no longer available."
        : status === "expired"
          ? "This invitation has expired."
          : status === "already_member"
            ? "This creator already belongs to the team."
            : accept
              ? "Invitation accepted."
              : "Invitation declined.";
      setNotice(message);
      setPendingInvitationIds((ids) => {
        const next = new Set(ids);
        next.delete(invitationId);
        return next;
      });
      await markRead(notification);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation response failed.");
    } finally {
      setRespondingId(null);
    }
  }



  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (accountConnected === false) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-16 text-center">
            <h1 className="text-3xl font-bold">Activity Hub</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">Sign in or create an account to create a creator profile and view your notifications.</p>
            <Link href="/login" className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500">Create profile</Link>
          </div>
        </section>
      </main>
    );
  }
  if (accountConnected !== true) {
    return <main className="min-h-screen bg-black text-white"><Navbar /><p className="mx-auto max-w-3xl px-6 py-20 text-zinc-400">Checking your account…</p></main>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-purple-400">Your account</p>
          <h1 className="text-3xl font-bold">Activity Hub</h1>
          <p className="mt-2 text-sm text-zinc-400">Account notifications stay visible here regardless of your Active Creator selection.</p>
          <p className="mt-3 text-xs text-zinc-500">{unreadCount} unread</p>
        </div>

        {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-sm text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">{error}</p>}
        {loading ? <p className="py-16 text-center text-sm text-zinc-500">Loading activity…</p> : notifications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-16 text-center">
            <h2 className="font-semibold text-zinc-200">No activity yet</h2>
            <p className="mt-2 text-sm text-zinc-500">New account notifications will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-950">
            {notifications.map((notification) => {
              const event = eventOf(notification);
              return (
                <li key={notification.id}>
                  <article className={notification.is_read ? "px-5 py-5 sm:px-6" : "bg-purple-500/[0.035] px-5 py-5 sm:px-6"}>
                    <Link
                      href={destinationOf(event)}
                      onClick={() => { void markRead(notification); }}
                      className="block rounded-lg transition hover:bg-zinc-900/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className={notification.is_read ? "text-sm font-medium text-zinc-300" : "text-sm font-semibold text-white"}>{titleOf(event, accountId, pendingInvitationIds)}</h2>
                        <time className="text-xs text-zinc-500" dateTime={event?.occurred_at ?? notification.created_at}>{new Date(event?.occurred_at ?? notification.created_at).toLocaleString()}</time>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{summaryOf(event, accountId, pendingInvitationIds)}</p>
                      {!notification.is_read && <span className="mt-3 inline-block rounded-full bg-purple-500/15 px-2.5 py-1 text-[10px] font-semibold text-purple-300">Unread</span>}
                    </Link>
                    {event?.event_type === "team_member_invited" && event.metadata?.senderProfileId === accountId && typeof event.metadata.invitationId === "string" && pendingInvitationIds.has(event.metadata.invitationId) && <span className="mt-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">Pending</span>}
                    {event?.event_type === "team_member_invited" && event.metadata?.recipientProfileId === accountId && typeof event.metadata.invitationId === "string" && pendingInvitationIds.has(event.metadata.invitationId) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={respondingId !== null} onClick={() => void respondToInvitation(notification, event, true)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                          {respondingId === event.metadata.invitationId ? "Saving…" : "Accept invitation"}
                        </button>
                        <button type="button" disabled={respondingId !== null} onClick={() => void respondToInvitation(notification, event, false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50">
                          Decline
                        </button>
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}


