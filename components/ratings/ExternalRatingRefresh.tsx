'use client';

import { useEffect, useState } from 'react';

type SyncState = {
  lastChecked: string | null;
  nextCheck: string | null;
  automaticEnded: boolean;
  pausedUntil: string | null;
  manualAvailable: string | null;
  status: string | null;
  sources: string[];
  results: { platform: string; status: string }[];
};

const messages: Record<string, string> = {
  updated: 'External ratings updated.',
  unchanged: 'Checked. The rating is unchanged.',
  unavailable: 'The source has no rating available.',
  unsupported: 'No connected source offers a supported rating.',
  failed: 'Retrieval failed. Any previous score was kept.',
  partial: 'Some sources could not be checked. Previous scores were kept where available.',
  denied: 'The provider denied access. Refresh is temporarily paused.',
  paused: 'The provider is temporarily paused.',
  rate_limited: 'The source is rate limiting requests. Try again later.',
  busy: 'A refresh is already running. Try again shortly.',
  running: 'A refresh is running.',
  cooldown: 'This mod has already used its manual refresh.',
  expired: 'The refresh timed out. Any previous score was kept.',
  idle: 'This mod is not available for refresh.',
  success: 'Rating retrieved.',
  invalid: 'The source returned invalid rating data.',
};

const stamp = (value: string) => new Date(value).toLocaleString();
const platformName = (value: string) => value === 'gta5mods' ? 'GTA5-Mods' : value === 'gtainside' ? 'GTAInside' : value;

export default function ExternalRatingRefresh({ modId, onRefresh }: { modId: string; onRefresh: () => void }) {
  const url = `/api/external-ratings?modId=${encodeURIComponent(modId)}`;
  const [state, setState] = useState<SyncState | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const abort = new AbortController();
    fetch(url, { signal: abort.signal, cache: 'no-store' }).then(async response => {
      if (response.ok) setState(await response.json());
    }).catch(() => {});
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => { abort.abort(); window.clearInterval(timer); };
  }, [url]);

  async function refresh() {
    if (busy || remaining > 0 || paused) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch(url, { method: 'POST' });
      const result = await response.json();
      setNotice(messages[result.status] ?? result.error ?? 'External rating refresh is unavailable.');
      if (Array.isArray(result.results)) onRefresh();
      const status = await fetch(url, { cache: 'no-store' });
      if (status.ok) setState(await status.json());
    } catch {
      setNotice('Refresh could not be confirmed. Any previous score remains visible.');
    } finally {
      setClock(Date.now());
      setBusy(false);
    }
  }

  if (!state) return null;
  const remaining = state.manualAvailable ? Math.max(0, Math.ceil((new Date(state.manualAvailable).getTime() - clock) / 60000)) : 0;
  const paused = Boolean(state.pausedUntil && new Date(state.pausedUntil).getTime() > clock);
  return <div className="mt-2 space-y-1 border-t border-zinc-700 pt-2">
    {state.sources.length > 0 && <p>Sources: {state.sources.map(platformName).join(', ')}</p>}
    <p>Last checked: {state.lastChecked ? stamp(state.lastChecked) : 'Never checked'}</p>
    {state.automaticEnded && <p>Automatic updates have ended for this mod.</p>}
    {!state.automaticEnded && state.nextCheck && <p>Next automatic check: {stamp(state.nextCheck)}</p>}
    {state.status && <p>{messages[state.status] ?? state.status}</p>}
    {state.results.length > 1 && <ul className="space-y-1">{state.results.map((item, index) =>
      <li key={index}>{platformName(item.platform)} · {messages[item.status] ?? item.status}</li>)}</ul>}
    {paused && state.pausedUntil && <p>Provider paused until {stamp(state.pausedUntil)}.</p>}
    <p>Manual refresh available once every 24 hours.</p>
    {remaining > 0 && <p>Manual refresh available in {Math.floor(remaining / 60)}h {remaining % 60}m.</p>}
    <button type="button" data-rating-refresh aria-disabled={busy || remaining > 0 || paused}
      className="rounded border border-zinc-600 px-2 py-1 focus-visible:outline-2 aria-disabled:opacity-50"
      onClick={() => void refresh()}>{busy ? 'Checking…' : 'Refresh ratings'}</button>
    <p role="status">{notice}</p>
  </div>;
}
