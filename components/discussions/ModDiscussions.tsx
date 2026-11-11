'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCreatorContext } from '@/app/contexts/CreatorContext';
import { discussionHref, type Discussion, type DiscussionResult } from '@/lib/discussions/types';
import { mergeDiscussionItems } from '@/lib/discussions/thread-state';
import type { RatingSummary } from '@/lib/ratings/types';
import ReferenceEditor from './ReferenceEditor';
import { toEditorReferences, toStoredReferences, type ReferenceSpan } from '@/lib/discussions/references';
import StarSelector from '@/components/ratings/StarSelector';
import RatingChannels, { refreshRatingChannels } from '@/components/ratings/RatingChannels';
import DiscussionCard from './DiscussionCard';
import DiscussionRecognition from './DiscussionRecognition';
import { supabase } from '@/lib/supabase/client';
import type { RecognitionState } from '@/lib/discussions/recognition';

const button = 'rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-purple-400 disabled:opacity-40';
type ReplyPage = DiscussionResult & { page: number };
const empty: DiscussionResult = { items: [], hasMore: false };

function postingWindow(seconds: number) {
  const now = Date.now();
  return { now, until: now + seconds * 1000 };
}

export default function ModDiscussions({ targetId }: { targetId: string }) {
  const { accountId, activeCreator, activeCreatorId, loading: identityLoading, selecting, error: identityError } = useCreatorContext();
  const [main, setMain] = useState<DiscussionResult>(empty);
  const [thread, setThread] = useState<DiscussionResult>(empty);
  const [replies, setReplies] = useState<Record<string, ReplyPage>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hidden, setHidden] = useState(false);
  const [body, setBody] = useState('');
  const [bodyRefs, setBodyRefs] = useState<ReferenceSpan[]>([]);
  const [replyRefs, setReplyRefs] = useState<ReferenceSpan[]>([]);
  const [editRefs, setEditRefs] = useState<ReferenceSpan[]>([]);
  const [cooldown, setCooldown] = useState({ scope: '', until: 0 });
  const [clock, setClock] = useState(() => Date.now());
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [replyLoading, setReplyLoading] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [rating, setRating] = useState<RatingSummary | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [attachRating, setAttachRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [moderationOpen, setModerationOpen] = useState(false);
  const [ratingPage, setRatingPage] = useState(1);
  const [reason, setReason] = useState('');
  const requestVersion = useRef(0);
  const requestScope = useRef(`${targetId}:${accountId}`);
  const result = focus ? thread : main;
  const identityBlocked = identityLoading || selecting || !!identityError;
  const [recognition, setRecognition] = useState<{ scope: string; items: Record<string, RecognitionState> }>({ scope: "", items: {} });
  const [recognitionVersion, setRecognitionVersion] = useState(0);
  const recognitionScope = targetId + ":" + accountId;
  const recognitionIds = [...result.items, ...Object.entries(replies).flatMap(([id, value]) => expanded[id] ? value.items : [])]
    .map(item => item.id).join(",");

  useEffect(() => {
    if (!recognitionIds) return;
    let current = true;
    const ids = recognitionIds.split(",");
    const requests = [];
    for (let i = 0; i < ids.length; i += 200) {
      requests.push(supabase.rpc("discussion_recognition_state", { p_mod: targetId, p_comments: ids.slice(i, i + 200) }));
    }
    void Promise.all(requests).then(responses => {
      if (current) setRecognition({ scope: recognitionScope, items: Object.assign({}, ...responses.map(response => response.data ?? {})) });
    });
    return () => { current = false; };
  }, [targetId, recognitionScope, recognitionIds, revision, recognitionVersion]);

  useEffect(() => {
    const sync = () => { setFocus(new URL(window.location.href).searchParams.get('comment')); setPage(1); setReplyTo(null); };
    const timer = window.setTimeout(sync, 0);
    window.addEventListener('popstate', sync);
    return () => { window.clearTimeout(timer); window.removeEventListener('popstate', sync); };
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    const version = ++requestVersion.current;
    const scope = `${accountId}:${targetId}`;
    const resetScope = requestScope.current !== scope;
    requestScope.current = scope;
    const q = new URLSearchParams({ mode: hidden ? 'moderation' : focus ? 'thread' : 'target', targetId, page: String(page) });
    if (focus) q.set('commentId', focus);
    const timer = window.setTimeout(async () => {
      setLoading(true);
      if (resetScope) { setMain(empty); setThread(empty); setReplies({}); setExpanded({}); setPage(1); setReplyTo(null); setBody(''); setBodyRefs([]); setReplyBody(''); setReplyRefs([]); }
      try {
        const response = await fetch(`/api/discussions?${q}`, { signal: abort.signal, cache: 'no-store' });
        const payload: DiscussionResult & { error?: string } = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Could not load comments.');
        if (abort.signal.aborted || version !== requestVersion.current) return;
        if (accountId && typeof payload.cooldownSeconds === 'number') {
          const { now, until } = postingWindow(payload.cooldownSeconds);
          setClock(now);
          setCooldown({ scope, until });
        }
        const update = (current: DiscussionResult) => ({ ...payload, items: mergeDiscussionItems(page === 1 && focus ? [] : current.items, payload.items, !!focus) });
        if (focus) {
          setThread(update);
          if (page === 1) setReplyTo(payload.items.find(item => !item.parent_comment_id && item.status === 'published')?.id ?? null);
        } else setMain(update);
        setError('');
        if (focus && page === 1) window.setTimeout(() => { if (version === requestVersion.current) document.getElementById(`comment-${focus}`)?.scrollIntoView({ block: 'center' }); }, 50);
      } catch (cause) { if (!abort.signal.aborted && version === requestVersion.current) setError(cause instanceof Error ? cause.message : 'Could not load comments.'); }
      finally { if (!abort.signal.aborted && version === requestVersion.current) setLoading(false); }
    }, 0);
    return () => { abort.abort(); window.clearTimeout(timer); };
  }, [targetId, page, focus, hidden, revision, accountId]);

  const loadRating = useCallback(async () => {
    const response = await fetch(`/api/mod-ratings?modId=${encodeURIComponent(targetId)}&page=${ratingPage}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'Could not load ratings.');
    setRating(payload);
    return payload as RatingSummary;
  }, [targetId, ratingPage]);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/mod-ratings?modId=${encodeURIComponent(targetId)}&page=${ratingPage}`, { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Could not load ratings.');
        if (!cancelled) { setRating(payload); setStars(payload.ownRating?.value ?? null); setAttachRating(false); setRatingError(''); }
      } catch (cause) { if (!cancelled) { setRating(null); setRatingError(cause instanceof Error ? cause.message : 'Could not load ratings.'); } }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [targetId, accountId, ratingPage]);

  async function loadReplies(parent: string, next = false) {
    setReplyLoading(parent);
    const nextPage = next ? (replies[parent]?.page ?? 1) + 1 : 1;
    try {
      const q = new URLSearchParams({ mode: 'replies', targetId, commentId: parent, page: String(nextPage) });
      const response = await fetch(`/api/discussions?${q}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error === 'Invalid discussion filters.' ? 'Inline replies are awaiting database setup.' : payload.error ?? 'Could not load replies.');
      setReplies(current => ({ ...current, [parent]: { ...payload, page: nextPage, items: mergeDiscussionItems(current[parent]?.items ?? [], payload.items, true) } }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load replies.'); }
    finally { setReplyLoading(null); }
  }
  function navigate(comment: Discussion | null) {
    const url = new URL(window.location.href);
    if (comment) { url.searchParams.set('comment', comment.id); url.hash = `comment-${comment.id}`; }
    else { url.searchParams.delete('comment'); url.hash = 'discussions'; }
    window.history.pushState(null, '', url);
    setThread(empty); setFocus(comment?.id ?? null); setPage(1); setReplyTo(null); setHidden(false);
  }
  function updateEverywhere(item: Discussion) {
    const update = (list: Discussion[]) => list.map(row => row.id === item.id ? item : row);
    setMain(current => ({ ...current, items: update(current.items) }));
    setThread(current => ({ ...current, items: update(current.items) }));
    setReplies(current => Object.fromEntries(Object.entries(current).map(([id, value]) => [id, { ...value, items: update(value.items) }])));
  }
  const cooldownScope = accountId + ':' + targetId;
  const remaining = cooldown.scope === cooldownScope ? Math.max(0, Math.ceil((cooldown.until - clock) / 1000)) : 0;
  useEffect(() => {
    if (!remaining) return;
    const timer = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(timer);
  }, [remaining]);

  async function mutate(action: string, item?: Discussion, parent?: string) {
    if (action === 'create' && remaining) return;
    const draft = action === 'edit' ? editBody : parent ? replyBody : body;
    const refs = action === 'edit' ? editRefs : parent ? replyRefs : bodyRefs;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/discussions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, commentId: item?.id, targetId, creatorId: activeCreatorId, parentId: parent ?? null,
          body: draft, references: refs.length && action === 'create' || action === 'edit' && (refs.length || item?.references?.length) ? toStoredReferences(draft, refs) : undefined, rating: action === 'create' && !parent && attachRating ? stars : null }) });
      const payload = await response.json();
      if (Number.isInteger(payload.cooldownSeconds) && payload.cooldownSeconds > 0) {
        const { now, until } = postingWindow(payload.cooldownSeconds);
        setClock(now);
        setCooldown({ scope: cooldownScope, until });
      }
      if (response.status === 429 && payload.cooldownSeconds > 0) return;
      if (!response.ok) throw new Error(payload.error ?? 'Your change could not be saved.');
      // Invalidate any pre-mutation list fetch so it cannot overwrite a saved item.
      requestVersion.current += 1; setLoading(false);
      if (action === 'create') {
        if (parent) {
          setReplyBody(''); setReplyRefs([]); setReplyTo(focus ? parent : null); setExpanded(current => ({ ...current, [parent]: true }));
          if (payload.item) setReplies(current => ({ ...current, [parent]: { ...(current[parent] ?? { hasMore: false, page: 1 }), items: mergeDiscussionItems(current[parent]?.items ?? [], [payload.item], true) } }));
          const bump = (current: DiscussionResult) => ({ ...current, items: current.items.map(row => row.id === parent ? { ...row, reply_count: row.reply_count + 1 } : row) });
          setMain(bump); setThread(current => ({ ...bump(current), items: payload.item ? mergeDiscussionItems(bump(current).items, [payload.item], true) : bump(current).items }));
        } else {
          setBody(''); setBodyRefs([]); setAttachRating(false);
          if (payload.item) setMain(current => ({ ...current, items: mergeDiscussionItems(current.items, [payload.item]) }));
        }
        if (payload.rating) { refreshRatingChannels(targetId); setRating(payload.rating); setStars(payload.rating.ownRating?.value ?? null); }
        setNotice(parent ? 'Reply posted.' : 'Comment posted.');
        if (!payload.item) setNotice('Saved. Reload comments to see the new entry.');
      } else if (item) {
        const changed = { ...item, body: action === 'delete' ? '' : action === 'edit' ? editBody.trim() : item.body,
          status: action === 'hide' ? 'hidden' as const : action === 'delete' ? 'deleted' as const : 'published' as const, updated_at: new Date().toISOString() };
        updateEverywhere(payload.item ?? changed);
        if (action === 'delete' && item.parent_comment_id) {
          const decrement = (current: DiscussionResult) => ({ ...current, items: current.items.filter(row => row.id !== item.id).map(row => row.id === item.parent_comment_id ? { ...row, reply_count: Math.max(0,row.reply_count - 1) } : row) });
          setMain(decrement); setThread(decrement);
          setReplies(current => Object.fromEntries(Object.entries(current).map(([id,value]) => [id,{ ...value,items:value.items.filter(row => row.id !== item.id) }])));
        }
        if (action === 'hide' || action === 'restore') {
          setMain(current => ({ ...current, items: current.items.filter(row => row.id !== item.id) }));
          if (action === 'hide' && item.parent_comment_id) {
            setThread(current => ({ ...current, items: current.items.filter(row => row.id !== item.id) }));
            setReplies(current => Object.fromEntries(Object.entries(current).map(([id, value]) => [id, { ...value, items: value.items.filter(row => row.id !== item.id) }])));
          }
          if (action === 'hide' && !item.parent_comment_id) { setThread(empty); setReplies(current => ({ ...current, [item.id]: { items: [], hasMore: false, page: 1 } })); }
        }
        setNotice('Comment updated.');
      }
      setEditing(null); setConfirmDelete(null);
      window.dispatchEvent(new Event('modvault:notifications-changed'));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your change could not be saved.'); }
    finally { setBusy(false); }
  }
  async function saveRating() {
    setBusy(true); setRatingError(''); setNotice('');
    try {
      const response = await fetch('/api/mod-ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rate', modId: targetId, creatorId: activeCreatorId, value: stars }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not save your rating.');
      setRating(payload.rating); refreshRatingChannels(targetId); setAttachRating(false); setNotice('Your rating was saved. No comment was added.');
    } catch (cause) { setRatingError(cause instanceof Error ? cause.message : 'Could not save your rating.'); }
    finally { setBusy(false); }
  }
  async function moderateRating(id: string, valid: boolean) {
    setBusy(true); setRatingError('');
    try {
      const response = await fetch('/api/mod-ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'moderate', ratingId: id, valid, reason }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not review this rating.');
      await loadRating(); refreshRatingChannels(targetId); setReason(''); setNotice('Rating moderation saved.');
      // Remove stale submission badges without replacing loaded comments.
      setMain(current => ({ ...current, items: current.items.map(item => ({ ...item, rating_at_submission: null })) }));
      setThread(current => ({ ...current, items: current.items.map(item => ({ ...item, rating_at_submission: null })) }));
      setReplies(current => Object.fromEntries(Object.entries(current).map(([id,value]) => [id,{...value,items:value.items.map(item=>({...item,rating_at_submission:null}))}])));
    } catch (cause) { setRatingError(cause instanceof Error ? cause.message : 'Could not review this rating.'); }
    finally { setBusy(false); }
  }
  function renderCard(item: Discussion) {
    const award = recognition.scope === recognitionScope ? recognition.items[item.id] : undefined;
    return <DiscussionCard key={item.id} item={item} context={false}>
      {award && (award.active || award.canAward || award.canRevoke) && <DiscussionRecognition key={recognitionScope}
        modId={targetId} commentId={item.id} state={award}
        onChange={state => {
          setRecognition(previous => previous.scope === recognitionScope
            ? { ...previous, items: { ...previous.items, [item.id]: state } } : previous);
          setRecognitionVersion(version => version + 1);
        }} />}
      {editing === item.id ? <form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); void mutate('edit', item); }}>
        <ReferenceEditor aria-label="Edit comment" value={editBody} references={editRefs} onDraft={(value, refs) => { setEditBody(value); setEditRefs(refs); }} rows={3} maxLength={4000} required className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-sm" />
        <button disabled={busy || !editBody.trim()} className={button}>Save edit</button> <button type="button" onClick={() => setEditing(null)} className={button}>Cancel</button>
      </form> : <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        {!hidden && <Link href={discussionHref(item)} onClick={e => { e.preventDefault(); navigate(item); }} className="text-purple-300">View thread{!item.parent_comment_id ? ` · ${item.reply_count} replies` : ''}</Link>}
        {accountId && !item.parent_comment_id && item.status === 'published' && !hidden && <button disabled={busy || identityBlocked} onClick={() => { setReplyTo(item.id); setExpanded(current => ({ ...current, [item.id]: true })); if (!focus && !replies[item.id]) void loadReplies(item.id); }} className="hover:text-purple-300">Reply</button>}
        {item.can_edit && item.status === 'published' && <><button disabled={busy} onClick={() => { setEditing(item.id); setEditBody(item.body); setEditRefs(toEditorReferences(item.body, item.references ?? [])); }}>Edit</button><button disabled={busy} onClick={() => setConfirmDelete(item.id)}>Delete</button></>}
        {item.can_moderate && item.status !== 'deleted' && <button disabled={busy} onClick={() => void mutate(item.status === 'hidden' ? 'restore' : 'hide', item)}>{item.status === 'hidden' ? 'Restore' : 'Hide'}</button>}
      </div>}
      {confirmDelete === item.id && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><span>Delete this comment? Your mod rating will be preserved.</span><button disabled={busy} className={button} onClick={() => void mutate('delete', item)}>Delete comment</button><button className={button} onClick={() => setConfirmDelete(null)}>Cancel</button></div>}
      {replyTo === item.id && <form className="mt-4 space-y-3 border-t border-zinc-800 pt-4" onSubmit={e => { e.preventDefault(); void mutate('create', undefined, item.id); }}>
        <p className="text-xs text-zinc-400">Replying as {activeCreator?.name ?? 'Personal identity'}</p>
        <ReferenceEditor autoFocus aria-label={`Reply to ${item.author_name}`} value={replyBody} references={replyRefs} onDraft={(value, refs) => { setReplyBody(value); setReplyRefs(refs); }} rows={3} maxLength={4000} required className="w-full rounded-xl border border-zinc-700 bg-black p-3 text-sm" />
        <button disabled={busy || identityBlocked || remaining > 0 || !replyBody.trim()} className={button}>Post reply</button> <button type="button" className={button} onClick={() => setReplyTo(null)}>Cancel reply</button>
      </form>}
    </DiscussionCard>;
  }

  return <section id="discussions" aria-label="Mod discussions" className="mt-6 space-y-5 rounded-[30px] border border-zinc-900 bg-zinc-950/75 p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Discussions</h2>{accountId && <Link href="/discussions" className="text-sm text-purple-300">My discussions →</Link>}</div>
    <RatingChannels modId={targetId} variant="summary" />
    <div className="flex flex-wrap gap-3">
      {focus && <Link href="#discussions" className={button} onClick={e => { e.preventDefault(); navigate(null); }}>Back to all comments</Link>}
      {(result.canModerate || hidden) && <button className={button} disabled={busy} onClick={() => { window.history.replaceState(null, '', window.location.pathname + '#discussions'); setHidden(!hidden); setMain(empty); setPage(1); setFocus(null); setReplyTo(null); }}>{hidden ? 'Published comments' : 'Hidden comments'}</button>}
    </div>
    {!hidden && !focus && (accountId ? <div className="space-y-4">
      <p className="text-sm text-zinc-400">Posting as <strong className="text-purple-300">{activeCreator?.name ?? 'Personal identity'}</strong>. Change identity in the navbar.</p>
      {rating?.canRate && <div className="space-y-3 rounded-2xl border border-zinc-800 p-4">
        <StarSelector channel={rating.ownRating?.channel} value={stars} onChange={value => { setStars(value); setAttachRating(true); }} disabled={busy || identityBlocked || rating.ownRating?.isValid === false} />
        {rating.ownRating && <p className="text-xs text-zinc-400">Your current rating: {rating.ownRating.value} / 5{rating.ownRating.isValid ? '' : ' · Invalidated; moderator review required'}</p>}
        <button type="button" className={button} onClick={() => void saveRating()} disabled={busy || identityBlocked || !stars || rating.ownRating?.isValid === false || (!attachRating && !!rating.ownRating)}>{rating.ownRating ? 'Update rating only' : 'Save rating only'}</button>
        {attachRating && <p className="text-xs text-zinc-400">The selected rating will also be submitted if you post a comment. <button className="underline" onClick={() => setAttachRating(false)}>Post without rating instead</button></p>}
      </div>}
      {rating && !rating.canRate && <p className="text-xs text-zinc-500">Mod owners cannot rate their own mods.</p>}
      <form onSubmit={e => { e.preventDefault(); void mutate('create'); }} className="space-y-3">
        <ReferenceEditor aria-label="Your comment" value={body} references={bodyRefs} onDraft={(value, refs) => { setBody(value); setBodyRefs(refs); }} maxLength={4000} rows={3} required className="w-full rounded-2xl border border-zinc-800 bg-black p-4 text-sm focus:border-purple-400 focus:outline-none" placeholder="Join the discussion…" />
        <div className="flex items-center gap-4"><button disabled={busy || loading || identityBlocked || remaining > 0 || !body.trim()} className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">{busy ? 'Saving…' : attachRating ? 'Post comment and rating' : 'Post comment'}</button><span className="text-xs text-zinc-500">{body.length}/4,000</span></div>
      </form>
    </div> : <p className="text-sm text-zinc-400"><Link href="/login" className="text-purple-300">Sign in</Link> to comment and rate this mod.</p>)}
    {remaining > 0 && <p role="timer" className="text-sm text-zinc-400">You can post again in {remaining} second{remaining === 1 ? '' : 's'}.</p>}
    {identityError && <p role="alert" className="text-sm text-red-300">{identityError}</p>}
    {ratingError && <p role="alert" className="text-sm text-red-300">{ratingError}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error} <button className="underline" onClick={() => { setMain(empty); setThread(empty); setPage(1); setRevision(n => n + 1); }}>Reload comments</button></p>}
    {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
    {loading && <p role="status" className="text-sm text-zinc-500">Loading comments…</p>}
    {!result.items.length && !loading && !error && <p className="py-5 text-sm text-zinc-500">{hidden ? 'No hidden comments.' : focus ? 'This comment is unavailable or has been removed.' : 'No comments yet. Start the discussion.'}</p>}
    <div className="grid gap-3">{result.items.map(item => <div key={item.id} className={item.parent_comment_id ? 'ml-4 sm:ml-8' : ''}>
      {renderCard(item)}
      {!focus && !hidden && !item.parent_comment_id && <div className="ml-4 mt-3 space-y-3 sm:ml-8">
        {item.reply_count > 0 && <button className="text-xs text-purple-300" aria-expanded={!!expanded[item.id]} disabled={replyLoading === item.id} onClick={() => { const open = !expanded[item.id]; setExpanded(current => ({ ...current, [item.id]: open })); if (open && !replies[item.id]) void loadReplies(item.id); }}>{expanded[item.id] ? 'Hide replies' : `Show ${item.reply_count} ${item.reply_count === 1 ? 'reply' : 'replies'}`}</button>}
        {expanded[item.id] && <>{replies[item.id]?.items.map(renderCard)}{replyLoading === item.id && <p className="text-xs text-zinc-500">Loading replies…</p>}{replies[item.id]?.hasMore && <button className={button} onClick={() => void loadReplies(item.id, true)} disabled={!!replyLoading}>Load more replies</button>}</>}
      </div>}
    </div>)}</div>
    {result.hasMore && <button className={button} disabled={loading || busy} onClick={() => setPage(n => n + 1)}>{loading ? 'Loading…' : focus ? 'Load more replies' : 'Load more comments'}</button>}
    {rating?.canModerate && <div className="space-y-3 border-t border-zinc-800 pt-4">
      <button className={button} onClick={() => setModerationOpen(!moderationOpen)}>Rating moderation</button>
      {moderationOpen && <><label className="block text-xs text-zinc-400">Moderation reason<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} className="mt-2 w-full rounded-xl border border-zinc-700 bg-black p-3 text-sm" /></label>
        {rating.moderation.map(entry => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 p-3 text-sm"><span>{entry.value} / 5 · {entry.is_valid ? 'Valid' : 'Invalidated'}{entry.moderation_reason ? ` · ${entry.moderation_reason}` : ''}</span><button className={button} disabled={busy || !reason.trim()} onClick={() => void moderateRating(entry.id, !entry.is_valid)}>{entry.is_valid ? 'Invalidate' : 'Restore'}</button></div>)}
        <div className="flex items-center gap-3"><button className={button} disabled={ratingPage === 1 || busy} onClick={() => setRatingPage(p => p - 1)}>Previous ratings</button><span className="text-xs text-zinc-500">Page {ratingPage}</span><button className={button} disabled={!rating.hasMore || busy} onClick={() => setRatingPage(p => p + 1)}>Next ratings</button></div>
      </>}
    </div>}
  </section>;
}
