// The listing renders these controls for signed-out visitors as well.
export function parseGtaInsideVotes(html) {
  const counts = new Map();
  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const [, attributes, content] = match;
    const classes = attributes.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1].split(/\s+/) ?? [];
    if (!classes.includes('ratingButton')) continue;
    const direction = attributes.match(/\bvalue\s*=\s*["'](-?1)["']/i)?.[1];
    const icon = direction === '1' ? 'fa-thumbs-up' : 'fa-thumbs-down';
    if (!direction || counts.has(direction)) return { status: 'invalid' };
    const counter = content.match(/^\s*<i\b([^>]*)>\s*<\/i>\s*(\d+)\s*$/i);
    const iconClasses = counter?.[1].match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1].split(/\s+/) ?? [];
    const count = Number(counter?.[2]);
    if (!iconClasses.includes(icon) || !Number.isSafeInteger(count) || count > 2147483647) return { status: 'invalid' };
    counts.set(direction, count);
  }
  if (counts.size === 0) return { status: 'unavailable' };
  if (counts.size !== 2) return { status: 'invalid' };
  return { status: 'success', positive: counts.get('1'), negative: counts.get('-1') };
}
