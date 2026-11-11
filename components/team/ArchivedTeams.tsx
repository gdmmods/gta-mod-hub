"use client";

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useCreatorContext } from '@/app/contexts/CreatorContext';

type Team = { id: string; name: string; creator_id: string; archived_at: string };
export default function ArchivedTeams({ refreshKey, onRestored }: { refreshKey: number; onRestored: () => void }) {
  const { refresh } = useCreatorContext();
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/team-lifecycle', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load archived teams.');
      setTeams(payload.teams ?? []);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load archived teams.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load, refreshKey]);
  async function restore(team: Team) {
    if (!window.confirm(`Restore "${team.name}"?\n\nThe team and its retained memberships will become active after validation. Old invitations will remain expired.`)) return;
    setBusy(team.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/team-lifecycle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore', teamId: team.id }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Team could not be restored.');
      setNotice(`${team.name} was restored. Select it from Active Creator when you are ready.`);
      await refresh();
      await load();
      onRestored();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Team could not be restored.'); }
    finally { setBusy(null); }
  }
  return <section className="my-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6 md:p-8" aria-labelledby="archived-teams-heading">
    <h2 id="archived-teams-heading" className="text-2xl font-bold">Archived Teams</h2>
    <p className="mt-2 text-sm text-zinc-400">Teams you own that are inactive. Their identities and contributions are preserved.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></p>}
    {notice && <p role="status" className="mt-4 text-sm text-emerald-400">{notice}</p>}
    {loading ? <p className="mt-4 text-sm text-zinc-500">Loading archived teams…</p> : !error && teams.length === 0 ? <p className="mt-4 text-sm text-zinc-500">No archived teams.</p> : <ul className="mt-5 space-y-3">{teams.map(team => <li key={team.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 p-4">
      <div><p className="font-medium">{team.name}</p><Link href={`/creator/${team.creator_id}`} className="text-sm text-purple-300 hover:underline">View historical profile</Link></div>
      <button type="button" disabled={busy !== null} onClick={() => void restore(team)} className="rounded-xl border border-purple-500/40 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/10 disabled:opacity-50">{busy === team.id ? 'Restoring…' : 'Restore Team'}</button>
    </li>)}</ul>}
  </section>;
}
