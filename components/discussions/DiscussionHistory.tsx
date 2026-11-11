'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCreatorContext } from '@/app/contexts/CreatorContext';
import type { DiscussionResult, PublicIdentity } from '@/lib/discussions/types';
import DiscussionCard from './DiscussionCard';

export default function DiscussionHistory({ identity, recent = false, historyHref, className = '' }: {
  identity?: PublicIdentity; recent?: boolean; historyHref?: string; className?: string;
}) {
  const { creators, accountId } = useCreatorContext();
  const [result, setResult] = useState<DiscussionResult>({ items: [], hasMore: false });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [ownedIdentity, setOwnedIdentity] = useState('all');
  const [direction, setDirection] = useState('written');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const identityId = identity?.id;
  const identityType = identity?.type;

  useEffect(() => {
    const abort = new AbortController();
    const q = new URLSearchParams({ mode: identityId ? 'identity' : 'account', page: String(page), limit: recent ? '10' : '20', direction, category });
    if (identityId && identityType) { q.set('identityType', identityType); q.set('identityId', identityId); }
    else if (ownedIdentity !== 'all') {
      q.set('identityType', ownedIdentity === 'user' ? 'user' : 'creator');
      q.set('identityId', ownedIdentity === 'user' ? accountId ?? '' : ownedIdentity);
    }
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(''); setResult({ items: [], hasMore: false });
      try {
        const response = await fetch(`/api/discussions?${q}`, { signal: abort.signal, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Could not load discussions.');
        if (!abort.signal.aborted) setResult(payload);
      } catch (cause) {
        if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not load discussions.');
      } finally { if (!abort.signal.aborted) setLoading(false); }
    }, 0);
    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [identityId, identityType, page, recent, ownedIdentity, direction, category, accountId, retry]);

  if (recent && !loading && !error && !result.items.length) return null;
  // An unapplied migration should not replace established profiles with errors.
  if (recent && error === 'Discussions are awaiting database setup.') return null;
  const selectClass = 'rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300';
  return <section aria-label={recent ? 'Recent Discussions' : 'Discussion history'} className={`space-y-5 ${className}`}>
    {recent && <h2 className="text-2xl font-semibold">Recent Discussions</h2>}
    {!recent && <div className="flex flex-wrap gap-3">
      {!identity && <label className="grid gap-1 text-xs text-zinc-500">Identity<select aria-label="Identity" className={selectClass} value={ownedIdentity} onChange={e => { setOwnedIdentity(e.target.value); setPage(1); }}>
        <option value="all">All my identities</option><option value="user">Personal identity</option>
        {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>}
      {!identity && <label className="grid gap-1 text-xs text-zinc-500">Conversations<select aria-label="Conversations" className={selectClass} value={direction} onChange={e => { setDirection(e.target.value); setPage(1); }}>
        <option value="written">Written by me</option><option value="received">Replies received</option>
      </select></label>}
      <label className="grid gap-1 text-xs text-zinc-500">Category<select aria-label="Category" className={selectClass} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
        <option value="">All categories</option><option value="mod">Mods</option>
      </select></label>
    </div>}
    {loading ? <p role="status" className="text-sm text-zinc-500">Loading discussions…</p> : error ? <div role="alert" className="text-sm text-red-300">{error} <button onClick={() => setRetry(n => n + 1)} className="underline">Try again</button></div> : <>
      {!result.items.length && <p className="rounded-2xl border border-zinc-800 p-8 text-sm text-zinc-400">No discussions here yet.</p>}
      <div className="grid gap-3">{result.items.slice(0, recent && !expanded ? 3 : undefined).map(item => <DiscussionCard key={item.id} item={item} />)}</div>
      {recent ? <div className="flex flex-wrap gap-5 text-sm text-purple-300">
        {result.items.length > 3 && <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Show latest 3' : 'Show up to 10'}</button>}
        {historyHref && <Link href={historyHref}>Full discussion history →</Link>}
      </div> : <nav aria-label="Discussion pages" className="flex items-center gap-5 text-sm">
        <button disabled={page === 1} onClick={() => setPage(n => n - 1)} className="text-purple-300 disabled:text-zinc-600">Previous</button>
        <span className="text-zinc-500">Page {page}</span>
        <button disabled={!result.hasMore} onClick={() => setPage(n => n + 1)} className="text-purple-300 disabled:text-zinc-600">Next</button>
      </nav>}
    </>}
  </section>;
}
