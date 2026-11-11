import type { RatingSummary } from '@/lib/ratings/types';

export default function ModRatingSummary({ rating }: { rating: RatingSummary | null }) {
  return <p aria-live="polite" className="text-sm text-zinc-300">{rating && rating.count > 0
    ? <><span className="font-semibold text-zinc-300">{rating.average?.toFixed(1)} / 5 ★</span> · {rating.count} {rating.count === 1 ? 'rating' : 'ratings'}</>
    : rating ? 'Not rated yet' : 'Rating unavailable'}</p>;
}
