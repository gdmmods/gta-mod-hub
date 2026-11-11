type Event = { event_type: string; metadata: Record<string, unknown> | null };

export function discussionPresentation(event: Event | null): { title: string; summary: string } | null {
  if (!event || !['comment_created', 'comment_reply_created'].includes(event.event_type)) return null;
  const m = event.metadata ?? {};
  const author = typeof m.publishingName === 'string' && m.publishingName.trim() ? m.publishingName : 'A discussion participant';
  const mod = typeof m.modTitle === 'string' && m.modTitle.trim() ? m.modTitle : 'an unavailable mod';
  const references = m.contentAvailable !== false && Array.isArray(m.referenceLabels)
    ? m.referenceLabels.filter((label): label is string => typeof label === 'string') : [];
  const linked = references.length ? ` References: ${references.slice(0, 3).join(', ')}${references.length > 3 ? ` and ${references.length - 3} more` : ''}.` : '';
  if (m.recipientReason === 'reference') return {
    title: 'New discussion reference',
    summary: m.contentAvailable === false ? 'This discussion is no longer available.' : `${author} referenced you or your work in a discussion on ${mod}.${linked}`,
  };
  const reply = event.event_type === 'comment_reply_created';
  const toAuthor = reply && m.recipientReason !== 'mod_owner';
  return {
    title: toAuthor ? 'New reply to your comment' : reply ? 'New reply on your mod' : 'New comment on your mod',
    summary: `${author} ${toAuthor ? 'replied to you' : reply ? 'replied' : 'commented'} on ${mod}.${m.contentAvailable === false ? ' This comment is no longer available.' : linked}`,
  };
}
