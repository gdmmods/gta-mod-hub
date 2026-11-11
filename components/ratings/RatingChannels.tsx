"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ratingColors } from '@/lib/ratings/colors';
import ExternalRatingRefresh from './ExternalRatingRefresh';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase/client';

type Category = 'user' | 'creator' | 'legacy';
type Channels = {
  internal: Partial<Record<Category, { average: number; count: number }>>;
  externalPrimary?: { platform: string; url: string } | null;
  external: { type?: 'stars' | 'votes'; positive?: number; negative?: number; platform: string; url: string; value: number; scale: number; count: number | null; normalized: number | null; updatedAt: string }[];
};

const pending = new Map<string, ((value: Channels | null) => void)[]>();
let timer: ReturnType<typeof setTimeout> | undefined;

function loadChannels(id: string) {
  return new Promise<Channels | null>(resolve => {
    const listeners = pending.get(id) ?? [];
    listeners.push(resolve);
    pending.set(id, listeners);
    timer ??= setTimeout(() => {
      const batch = [...pending];
      pending.clear();
      timer = undefined;
      for (let start = 0; start < batch.length; start += 100) {
        const chunk = batch.slice(start, start + 100);
        void Promise.resolve(supabase.rpc('read_mod_rating_channels', {
          p_mod_ids: chunk.map(([modId]) => modId), p_include_external: true,
        })).then(({ data, error }) => {
          for (const [modId, callbacks] of chunk) {
            const result = error ? null : (data as Record<string, Channels> | null)?.[modId] ?? null;
            callbacks.forEach(callback => callback(result));
          }
        }).catch(() => chunk.forEach(([, callbacks]) => callbacks.forEach(callback => callback(null))));
      }
    }, 25);
  });
}

export function refreshRatingChannels(id: string) {
  window.dispatchEvent(new CustomEvent('mod-rating-changed', { detail: id }));
}

const categories = [
  ['external', 'External Rating'],
  ['creator', 'Creator Rating'],
  ['user', 'User Rating'],
  ['legacy', 'Legacy Rating'],
] as const;

const platformName = (platform: string) => platform === 'gta5mods' ? 'GTA5-Mods' : platform === 'gtainside' ? 'GTAInside' : platform;

const voteCount = (count: number) => `${count} ${count === 1 ? 'rating' : 'ratings'}`;
const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

function RatingIndicator({ label, color, badge, score, children, actions, icon, scoreLabel }: {
  label: string;
  color: string;
  badge?: string;
  score: string | null;
  icon?: ReactNode;
  scoreLabel?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number; width: number } | null>(null);
  const pinned = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function show() {
    clearTimeout(closeTimer.current);
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(280, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - 8));
    setPosition(rect.top > window.innerHeight / 2
      ? { left, bottom: window.innerHeight - rect.top, width }
      : { left, top: rect.bottom, width });
  }

  function dismiss() {
    clearTimeout(closeTimer.current);
    pinned.current = false;
    setPosition(null);
  }

  function leave() {
    if (!pinned.current && document.activeElement !== trigger.current && !tooltip.current?.contains(document.activeElement)) {
      closeTimer.current = setTimeout(dismiss, 120);
    }
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!position) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !tooltip.current?.contains(event.target)) dismiss();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') {
      if (actions && tooltip.current?.contains(document.activeElement)) trigger.current?.focus();
      dismiss();
    } };
    const scroll = (event: Event) => { if (event.target !== tooltip.current) dismiss(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [position, actions]);

  return <>
    <button ref={trigger} type="button" aria-label={`${label}: ${scoreLabel ?? score ?? 'Unavailable'}`} aria-describedby={id} aria-haspopup={actions ? 'dialog' : undefined} aria-expanded={actions ? Boolean(position) : undefined}
      className={`pointer-events-auto relative z-20 inline-flex shrink-0 cursor-pointer items-baseline gap-1 whitespace-nowrap rounded-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 ${badge ? `rounded-full bg-black/40 px-2 py-1 shadow-[0_2px_8px_#0008] ring-1 ring-white/15 ring-inset backdrop-blur-sm sm:px-3 ${badge}` : color}`}
      onPointerEnter={event => { if (event.pointerType === 'mouse' || event.pointerType === 'pen') show(); }}
      onPointerLeave={leave} onFocus={show}
      onBlur={event => { if (!tooltip.current?.contains(event.relatedTarget)) dismiss(); }}
      onKeyDown={event => {
        const refresh = tooltip.current?.querySelector<HTMLButtonElement>('[data-rating-refresh]:not(:disabled)');
        if (event.key === 'Tab' && !event.shiftKey && refresh) { event.preventDefault(); refresh.focus(); }
      }}
      onClick={() => { if (pinned.current) dismiss(); else { pinned.current = true; show(); } }}>
      <span aria-hidden="true">{icon ?? (score === null ? '☆' : '★')}</span>
      <span aria-hidden="true">{score ?? '–'}</span>
    </button>
    {!position && <span id={id} hidden>{children}</span>}
    {position && createPortal(
      <div ref={tooltip} id={id} role={actions ? 'dialog' : 'tooltip'} aria-label={actions ? label : undefined} style={position}
        onPointerEnter={show} onPointerLeave={leave}
        onFocus={() => clearTimeout(closeTimer.current)}
        onBlur={event => { if (actions && event.relatedTarget !== trigger.current && !tooltip.current?.contains(event.relatedTarget)) dismiss(); }}
        onKeyDown={event => {
          if (actions && event.key === 'Tab' && event.shiftKey) { event.preventDefault(); trigger.current?.focus(); }
        }}
        className="pointer-events-auto fixed z-[110] max-h-[45dvh] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-left text-xs leading-relaxed text-zinc-200 shadow-lg">
        <p className={`mb-1 font-semibold ${color}`}>{label}</p>
        {children}
        {actions}
      </div>, document.body)}
  </>;
}

export default function RatingChannels({ modId, variant = 'card', canRefresh = false, primaryUrl }: {
  modId: string;
  variant?: 'card' | 'gallery' | 'summary';
  canRefresh?: boolean;
  primaryUrl?: string | null;
}) {
  const [result, setResult] = useState<{ id: string; value: Channels | null }>();
  useEffect(() => {
    let active = true;
    let request = 0;
    const load = () => {
      const current = ++request;
      void loadChannels(modId).then(value => {
        if (active && current === request) setResult({ id: modId, value });
      });
    };
    const refresh = (event: Event) => {
      if ((event as CustomEvent<string>).detail === modId) load();
    };
    load();
    window.addEventListener('mod-rating-changed', refresh);
    return () => { active = false; window.removeEventListener('mod-rating-changed', refresh); };
  }, [modId]);

  if (result?.id !== modId) return null;
  const channels = result.value;
  const gallery = variant === 'gallery';
  if (!channels) return gallery ? <p className="text-xs text-zinc-300">Ratings unavailable</p> : null;
  const external = variant === 'summary' ? [] : channels.external;
  if (!gallery && !external.length && !Object.values(channels.internal).some(Boolean)) return null;

  return <div role="group" aria-label="Mod ratings" className={gallery
    ? 'flex flex-wrap justify-end gap-1.5 text-sm sm:gap-2 sm:text-lg xl:text-xl'
    : 'flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs'}>
    {categories.map(([key, label]) => {
      const color = ratingColors[key];
      if (key === 'external') {
        const primary = channels.externalPrimary;
        const first = external.find(source => primary === undefined
          ? Boolean(primaryUrl && source.url === primaryUrl)
          : source.platform === primary?.platform && source.url === primary.url);
        if (!first && !gallery && !external.length) return null;
        if (variant === 'summary') return null;
        const votes = first?.type === 'votes';
        const score = !first ? null : votes ? String(first.positive) : `${first.value.toFixed(1)}${first.scale === 5 ? '' : `/${first.scale}`}`;
        return <RatingIndicator key={key} label={label} color={color} badge={gallery ? color : undefined} score={score}
          icon={votes ? <svg className="relative top-0.5 size-[0.9em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v11H3V10h4Zm0 10h11a2 2 0 0 0 2-1.6l1.4-7A2 2 0 0 0 19.4 9H15l.7-4a2 2 0 0 0-3.7-1.3L7 10"/></svg> : !first && gallery && primary?.platform === 'gtainside' ? '' : undefined}
          scoreLabel={votes ? `${score} positive votes` : undefined}
          actions={gallery && canRefresh ? <ExternalRatingRefresh modId={modId} onRefresh={() => refreshRatingChannels(modId)} /> : undefined}>
          {!first && <span className="block">{primary ? platformName(primary.platform) + ' · No external rating available' : external.length ? 'No primary external source is recorded' : 'No external rating available'}</span>}
          {external.map(source =>
            <span key={`${source.platform}:${source.url}`} className="mb-2 block last:mb-0">
              <span className="font-medium">{platformName(source.platform)}</span>
              {source === first && external.length > 1 && ' (primary)'}
              <span className="block">{source.type === 'votes'
                ? `👍 ${source.positive} positive · 👎 ${source.negative} negative`
                : `★ ${source.value} / ${source.scale}${source.count == null ? '' : ` · ${voteCount(source.count)}`}`}</span>
              <span className="block text-zinc-400">Last updated: {date.format(new Date(source.updatedAt))}</span>
            </span>)}
        </RatingIndicator>;
      }
      const rating = channels.internal[key];
      if (!rating && (!gallery || key === 'legacy')) return null;
      return <RatingIndicator key={key} label={label} color={color} badge={gallery ? color : undefined} score={rating ? rating.average.toFixed(1) : null}>
        <span className="block">{rating ? `${rating.average.toFixed(1)} / 5 · ${voteCount(rating.count)}` : 'Not yet rated'}</span>
        {key === 'creator' && <span>From eligible, experienced mod creators.</span>}
        {key === 'legacy' && <span>These ratings predate User and Creator classification.</span>}
      </RatingIndicator>;
    })}
  </div>;
}
