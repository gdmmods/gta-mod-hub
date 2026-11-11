import type { DiscussionReference } from './references';

export type Discussion = {
  id: string;
  target_type: 'mod' | 'asset' | 'knowledge' | 'showcase';
  target_id: string;
  target_title: string;
  parent_comment_id: string | null;
  body: string;
  references?: DiscussionReference[];
  status: 'published' | 'hidden' | 'deleted';
  created_at: string;
  updated_at: string;
  author_name: string;
  author_href: string;
  author_creator_id: string | null;
  can_edit: boolean;
  can_moderate: boolean;
  reply_count: number;
  rating_at_submission?: number | null;
};
export type DiscussionResult = { items: Discussion[]; hasMore: boolean; rootId?: string | null; canModerate?: boolean; cooldownSeconds?: number };
export type PublicIdentity = { type: 'user' | 'creator'; id: string };

export function discussionHref(comment: Pick<Discussion, 'target_id' | 'id'>) {
  return `/mods/${encodeURIComponent(comment.target_id)}?comment=${encodeURIComponent(comment.id)}#comment-${encodeURIComponent(comment.id)}`;
}

export function discussionEventHref(event: { event_type: string; metadata: Record<string, unknown> | null } | null): string | null {
  if (!event || !['comment_created', 'comment_reply_created'].includes(event.event_type)) return null;
  const { modId, discussionCommentId } = event.metadata ?? {};
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof modId === 'string' && typeof discussionCommentId === 'string' && uuid.test(modId) && uuid.test(discussionCommentId)
    ? discussionHref({ target_id: modId, id: discussionCommentId }) : null;
}
