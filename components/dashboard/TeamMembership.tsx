"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Team = { id: string; name: string; slug: string; publicCreatorId: string | null; isOwner: boolean; isMember: boolean; isLegacyOwnerRow: boolean };
type Invitation = { recipient_creator_id: string; recipient_creator_name: string; invitation_id: string; team_id: string; team_name: string; team_creator_id: string | null; sender_name: string | null; message: string | null; status: string; expires_at: string | null };

export default function TeamMembership({ creatorId }: { creatorId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoadError, setTeamsLoadError] = useState("");
  const [invitationsLoadError, setInvitationsLoadError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setTeamsLoadError("");
    setInvitationsLoadError("");

    const loadJson = async (url: string, fallback: string) => {
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || fallback);
      return payload;
    };

    const [teamsResult, invitationsResult] = await Promise.allSettled([
      loadJson(`/api/team-memberships?creatorId=${encodeURIComponent(creatorId)}`, "Could not load team membership."),
      loadJson(`/api/team-invitations?creatorId=${encodeURIComponent(creatorId)}`, "Could not load invitations."),
    ]);

    if (teamsResult.status === "fulfilled") {
      setTeams(teamsResult.value.teams ?? []);
    } else {
      setTeams([]);
      setTeamsLoadError(teamsResult.reason instanceof Error ? teamsResult.reason.message : "Could not load team membership.");
    }

    if (invitationsResult.status === "fulfilled") {
      setInvitations(invitationsResult.value.invitations ?? []);
    } else {
      setInvitations([]);
      setInvitationsLoadError(invitationsResult.reason instanceof Error ? invitationsResult.reason.message : "Could not load invitations.");
    }
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function changeMembership(team: Team) {
    if (team.isOwner) return;
    const action = team.isMember ? "leave" : "join";
    setBusyId(team.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/team-memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, teamId: team.id, creatorId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Membership could not be changed.");
      const resultStatus = payload.result?.status;
      setNotice(resultStatus === "already_member" ? `You are already a member of ${team.name}.` : action === "join" ? `You joined ${team.name}.` : `You left ${team.name}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Membership could not be changed.");
    } finally {
      setBusyId(null);
    }
  }

  async function respond(invitation: Invitation, accept: boolean) {
    setRespondingId(invitation.invitation_id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/team-invitations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", invitationId: invitation.invitation_id, recipientCreatorId: invitation.recipient_creator_id, accept }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Invitation response failed.");
      const state = payload.result?.status;
      setNotice(state === "team_unavailable" ? `The ${invitation.team_name} invitation cannot be accepted because the team is unavailable.` : state === "expired" ? `The ${invitation.team_name} invitation has expired.` : state === "already_member" ? `${invitation.recipient_creator_name} already belongs to ${invitation.team_name}.` : state === "accepted" ? `${invitation.recipient_creator_name} joined ${invitation.team_name}.` : state === "declined" ? `${invitation.recipient_creator_name} declined the ${invitation.team_name} invitation.` : `This invitation is ${String(state ?? "unavailable").replaceAll("_", " ")}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation response failed.");
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8" aria-labelledby="team-membership-heading">
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-purple-400">Membership</p>
      <h2 id="team-membership-heading" className="mb-5 text-2xl font-bold">Team Membership</h2>
      {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-emerald-400">{notice}</p>}
      {loading ? <p className="text-sm text-zinc-500">Loading teams…</p> : teamsLoadError ? <p role="alert" className="text-sm text-red-400">Could not load teams: {teamsLoadError}</p> : teams.length === 0 ? <p className="text-sm text-zinc-500">This creator does not currently belong to a team.</p> : (
        <ul className="space-y-3">
          {teams.map((team) => (
            <li key={team.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-white">{team.name}</span>
                <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">{team.isOwner ? "Owner" : team.isLegacyOwnerRow ? "Owner link needs repair" : team.isMember ? "Member" : "Not a member"}</span>
                {team.publicCreatorId ? <Link href={`/creator/${team.publicCreatorId}`} className="text-sm text-purple-300 hover:text-purple-200">Public team page →</Link> : <span className="text-xs text-zinc-500">Public team page not linked yet</span>}
              </div>
              {team.isOwner ? <span className="text-sm text-zinc-500">Owners are not listed as members.</span> : team.isLegacyOwnerRow ? <span className="text-sm text-amber-300">Membership is paused until this owner record is reconciled.</span> : (
                <button type="button" disabled={busyId !== null} onClick={() => void changeMembership(team)} className="rounded-xl border border-purple-500/50 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50">
                  {busyId === team.id ? (team.isMember ? "Leaving…" : "Joining…") : team.isMember ? "Leave" : "Join"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h3 className="mb-4 text-lg font-semibold">Invitations</h3>
        {loading ? <p className="text-sm text-zinc-500">Loading invitations…</p> : invitationsLoadError ? <p role="alert" className="text-sm text-red-400">Could not load invitations: {invitationsLoadError}</p> : invitations.length === 0 ? <p className="text-sm text-zinc-500">No team invitations.</p> : <ul className="space-y-3">
          {invitations.map((invitation) => {
            const pending = invitation.status === "pending";
            return <li key={invitation.invitation_id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-medium">{invitation.team_name}</p><p className="text-xs text-zinc-500">For {invitation.recipient_creator_name} / Invited by {invitation.sender_name || "the team owner"}</p></div>
                <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs capitalize text-zinc-300">{invitation.status.replaceAll("_", " ")}</span>
              </div>
              {invitation.message && <p className="mt-3 text-sm text-zinc-300">{invitation.message}</p>}
              {invitation.team_creator_id && <Link href={`/creator/${invitation.team_creator_id}`} className="mt-3 inline-block text-sm text-purple-300 hover:text-purple-200">View team page →</Link>}
              {pending && <div className="mt-4 flex gap-2">
                <button type="button" disabled={respondingId !== null} onClick={() => void respond(invitation, true)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">{respondingId === invitation.invitation_id ? "Saving…" : `Accept as ${invitation.recipient_creator_name}`}</button>
                <button type="button" disabled={respondingId !== null} onClick={() => void respond(invitation, false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm disabled:opacity-50">Decline</button>
              </div>}
            </li>;
          })}
        </ul>}
      </div>
    </section>
  );
}
