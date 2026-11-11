import type { Discussion } from './types';

export function mergeDiscussionItems(current: Discussion[], incoming: Discussion[], replies = false): Discussion[] {
  const items = new Map(current.map(item => [item.id, item]));
  for (const item of incoming) items.set(item.id, item);
  return [...items.values()].sort((a, b) => {
    if (replies && !a.parent_comment_id !== !b.parent_comment_id) return a.parent_comment_id ? 1 : -1;
    const order = a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
    return replies ? order : -order;
  });
}
