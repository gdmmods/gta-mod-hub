/** Read only the provider's explicit listing-level five-star aggregate. */
export function parseGta5ModsRating(html) {
  let invalid = false;
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(script[1]); } catch { invalid = true; continue; }
    const rating = data?.aggregateRating;
    if (rating == null) continue;
    const raw = rating.ratingValue;
    const rawCount = rating.ratingCount ?? rating.reviewCount;
    const value = typeof raw === 'number' || typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
    const count = rawCount == null ? null : typeof rawCount === 'number' || typeof rawCount === 'string' && rawCount.trim() ? Number(rawCount) : NaN;
    if (rating['@type'] === 'AggregateRating' && Number(rating.bestRating) === 5 &&
        value > 0 && value <= 5 && (count === null || Number.isSafeInteger(count) && count > 0 && count <= 2147483647)) {
      return { status: 'success', value, count };
    }
    invalid = true;
  }
  return { status: invalid ? 'invalid' : 'unavailable' };
}
