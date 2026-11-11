"use client";

import { useState } from 'react';
import { useCreatorContext } from '@/app/contexts/CreatorContext';

type Props = { creator: { id: string; name: string; team_id: string }; onTeamArchived: () => void };

export default function TeamDangerZone({ creator, onTeamArchived }: Props) {
  const { refresh } = useCreatorContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function archive() {
    if (!window.confirm(`Archive "${creator.name}"?\n\nIts profile, contributions, comments and membership history will be preserved. Publishing and team management will stop. Pending invitations will expire. You can restore the team from Archived Teams.`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/team-lifecycle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive', teamId: creator.team_id }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Team could not be archived.');
      await refresh();
      onTeamArchived();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Team could not be archived.');
    } finally { setBusy(false); }
  }
  return <section className="mt-8 rounded-3xl border border-zinc-700 bg-zinc-900/50 p-6">
    <h3 className="mb-3 text-xl font-semibold">Archive Team</h3>
    <p className="mb-5 text-sm text-zinc-400">Make this team inactive while preserving its identity and history. You can restore it from Archived Teams.</p>
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    <button type="button" disabled={busy} onClick={() => void archive()} className="rounded-xl border border-amber-500/40 px-5 py-3 font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-50">{busy ? 'Archiving…' : 'Archive Team'}</button>
  </section>;
}
