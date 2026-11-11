export type ReferenceKind = 'user' | 'creator' | 'team' | 'mod';
export type ReferenceSpan = { kind: ReferenceKind; id: string; start: number; end: number };
export type DiscussionReference = ReferenceSpan & { label: string; href: string | null };
export type ReferenceOption = { kind: ReferenceKind; id: string; label: string; avatar: string | null; context: string | null };

export function shiftReferences(previous: string, next: string, references: ReferenceSpan[]) {
  if (previous === next) return references;
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
  let oldEnd = previous.length;
  let newEnd = next.length;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd--; }
  const delta = newEnd - oldEnd;
  return references.flatMap(reference => reference.end <= start ? [reference] : reference.start >= oldEnd
    ? [{ ...reference, start: reference.start + delta, end: reference.end + delta }] : []);
}

export function toStoredReferences(body: string, references: ReferenceSpan[]) {
  const leading = body.length - body.trimStart().length;
  return references.map(({ kind, id, start, end }) => ({
    kind, id, start: [...body.slice(leading, start)].length, end: [...body.slice(leading, end)].length,
  }));
}

export function toEditorReferences(body: string, references: DiscussionReference[]) {
  const chars = [...body];
  return references.map(({ kind, id, start, end }) => ({
    kind, id, start: chars.slice(0,start).join('').length, end: chars.slice(0,end).join('').length,
  }));
}
