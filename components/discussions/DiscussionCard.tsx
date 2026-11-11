'use client';

import Link from 'next/link';
import { discussionHref, type Discussion } from '@/lib/discussions/types';

export default function DiscussionCard({ item, children, context = true }: {
  item: Discussion; children?: React.ReactNode; context?: boolean;
}) {
  const chars = [...item.body];
  const references = item.references ?? [];
  const content = references.map((ref, index) => {
    const before = chars.slice(references[index - 1]?.end ?? 0, ref.start).join('');
    const label = chars.slice(ref.start, ref.end).join('');
    return <span key={ref.kind + ref.id}>{before}{ref.href
      ? <Link href={ref.href} className="break-words text-purple-300 underline decoration-purple-600 hover:text-purple-200">{label}</Link>
      : <span className="text-zinc-400">{ref.kind === 'mod' ? 'Referenced mod unavailable' : 'Referenced identity unavailable'}</span>}</span>;
  });
  return <article id={`comment-${item.id}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 target:border-purple-400">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <Link href={item.author_href} className="font-semibold text-zinc-100 hover:text-purple-300">{item.author_name}</Link>
      <span className="text-xs text-purple-300">{item.author_creator_id ? 'Creator' : 'Personal'}</span>
      <time dateTime={item.created_at} className="text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</time>
      {item.updated_at !== item.created_at && item.status === 'published' && <span className="text-xs text-zinc-500">Edited</span>}
    </div>
    {item.status === 'published' && item.rating_at_submission != null && <p className="mt-2 text-xs text-zinc-300" title="Rating at the time this comment was submitted">{'★'.repeat(item.rating_at_submission)}{'☆'.repeat(5 - item.rating_at_submission)} · Rated {item.rating_at_submission}/5 when posted</p>}
    {context && <p className="mt-2 text-xs text-zinc-500">{item.parent_comment_id ? 'Reply' : 'Comment'} · Mods · {item.target_title}</p>}
    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">{item.status === 'deleted' ? 'This comment was deleted.' : <>{content}{chars.slice(references.at(-1)?.end ?? 0).join('')}</>}</p>
    {context && <Link href={discussionHref(item)} className="mt-3 inline-block text-sm text-purple-300 hover:text-purple-200">View context →</Link>}
    {children}
  </article>;
}
