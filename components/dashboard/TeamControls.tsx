"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import TeamDangerZone from "@/components/team/TeamDangerZone";

type Props = { creator: { id: string; name: string; team_id: string }; onTeamDeleted: () => void };
type Member = { creator_id: string; creator_name: string; creator_avatar: string | null; joined_at: string };
type Candidate = { creator_id: string; creator_name: string; creator_avatar: string | null; verified: boolean | null };
type Invitation = { invitation_id: string; recipient_creator_id: string; recipient_name: string | null; status: string; message: string | null; expires_at: string | null; created_at: string };

export default function TeamControls({ creator, onTeamDeleted }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        fetch(`/api/team-memberships?teamId=${encodeURIComponent(creator.team_id)}`, { cache: "no-store" }),
        fetch(`/api/team-invitations?teamId=${encodeURIComponent(creator.team_id)}`, { cache: "no-store" }),
      ]);
      const [payload, invitationPayload] = await Promise.all([
        membersResponse.json().catch(() => ({})), invitationsResponse.json().catch(() => ({})),
      ]);
      if (!membersResponse.ok) throw new Error(payload.error || "Only the team owner can manage members.");
      if (!invitationsResponse.ok) throw new Error(invitationPayload.error || "Could not load team invitations.");
      setOwnerVerified(true);
      setError("");
      setMembers(payload.members ?? []);
      setInvitations(invitationPayload.invitations ?? []);
    } catch (cause) {
      setOwnerVerified(false);
      setError(cause instanceof Error ? cause.message : "Only the team owner can manage members.");
      setMembers([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [creator.team_id]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (search.trim().length < 2) {
        setCandidates([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const response = await fetch(`/api/team-invitations?teamId=${encodeURIComponent(creator.team_id)}&q=${encodeURIComponent(search.trim())}`, { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Creator search failed.");
        setCandidates(payload.candidates ?? []);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Creator search failed.");
        setCandidates([]);
      } finally {
        setSearching(false);
      }
    }, search.trim().length < 2 ? 0 : 250);
    return () => window.clearTimeout(timer);
  }, [creator.team_id, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadMembers(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadMembers]);

  async function removeMember(member: Member) {
    if (!window.confirm(`Remove ${member.creator_name} from this team?`)) return;
    setBusyId(member.creator_id);
    setError("");
    try {
      const response = await fetch("/api/team-memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", teamId: creator.team_id, creatorId: member.creator_id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Member could not be removed.");
      await loadMembers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Member could not be removed.");
    } finally {
      setBusyId(null);
    }
  }

  async function inviteCreator(candidate: Candidate) {
    setBusyId(candidate.creator_id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/team-invitations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", teamId: creator.team_id, creatorId: candidate.creator_id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Invitation could not be sent.");
      setNotice(`Invitation sent to ${candidate.creator_name}.`);
      setSearch("");
      setCandidates([]);
      await loadMembers();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation could not be sent.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8" aria-labelledby="team-controls-heading">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-purple-400">Team Management</p>
      <h2 id="team-controls-heading" className="mb-2 text-3xl font-bold">Team Controls</h2>
      <p className="mb-6 text-zinc-400">Manage your team profile and members.</p>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href={`/dashboard/creator/${creator.id}/settings`} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500">Edit Team Profile</Link>
        <Link href={`/creator/${creator.id}`} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-purple-500">View Public Team Page</Link>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="mb-4 text-sm text-emerald-400">{notice}</p>}
      {loading ? <p className="text-zinc-500">Loading members…</p> : members.length === 0 ? <p className="text-zinc-500">No other creator members yet.</p> : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.creator_id} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                {member.creator_avatar ? <Image src={member.creator_avatar} alt="" width={44} height={44} unoptimized className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">{member.creator_name.slice(0, 1).toUpperCase()}</span>}
                <span className="min-w-0"><span className="block truncate font-medium">{member.creator_name}</span><span className="text-xs text-zinc-500">Joined {new Date(member.joined_at).toLocaleDateString()}</span></span>
              </div>
              <button type="button" disabled={busyId !== null} onClick={() => void removeMember(member)} className="shrink-0 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50">{busyId === member.creator_id ? "Removing…" : "Remove"}</button>
            </li>
          ))}
        </ul>
      )}
      {ownerVerified && <div className="mt-8 border-t border-zinc-800 pt-6">
        <h3 className="mb-3 text-lg font-semibold">Invite a creator</h3>
        <label htmlFor="team-creator-search" className="sr-only">Search creator profiles</label>
        <input id="team-creator-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search creator profiles…" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm outline-none focus:border-purple-500" />
        {searching && <p className="mt-2 text-sm text-zinc-500">Searching…</p>}
        {!searching && search.trim().length >= 2 && candidates.length === 0 && <p className="mt-2 text-sm text-zinc-500">No eligible creators found.</p>}
        {candidates.length > 0 && <ul className="mt-3 space-y-2">
          {candidates.map((candidate) => <li key={candidate.creator_id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              {candidate.creator_avatar ? <Image src={candidate.creator_avatar} alt="" width={36} height={36} unoptimized className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800">{candidate.creator_name.slice(0,1).toUpperCase()}</span>}
              <span className="truncate text-sm font-medium">{candidate.creator_name}</span>
            </div>
            <button type="button" disabled={busyId !== null} onClick={() => void inviteCreator(candidate)} className="shrink-0 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold disabled:opacity-50">{busyId === candidate.creator_id ? "Sending…" : "Invite"}</button>
          </li>)}
        </ul>}
      </div>}
      {ownerVerified && <div className="mt-8 border-t border-zinc-800 pt-6">
        <h3 className="mb-4 text-lg font-semibold">Invitations</h3>
        {invitations.length === 0 ? <p className="text-sm text-zinc-500">No invitations sent.</p> : <ul className="space-y-2">
          {invitations.map((invitation) => <li key={invitation.invitation_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div><span className="font-medium">{invitation.recipient_name || "Creator profile"}</span>{invitation.message && <p className="mt-1 text-xs text-zinc-500">{invitation.message}</p>}</div>
            <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs capitalize text-zinc-300">{invitation.status.replaceAll("_", " ")}</span>
          </li>)}
        </ul>}
      </div>}
      {ownerVerified && <TeamDangerZone creator={creator} onTeamDeleted={onTeamDeleted} />}
    </section>
  );
}
