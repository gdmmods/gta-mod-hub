'use client';

import { ratingColors } from '@/lib/ratings/colors';
import { useState } from 'react';

export default function StarSelector({ value, onChange, disabled = false, channel }: { value: number | null; onChange: (value: number) => void; disabled?: boolean; channel?: "user" | "creator" | "legacy" }) {
  const [hover, setHover] = useState<number | null>(null);
  return <fieldset disabled={disabled} className="space-y-2">
    <legend className="text-sm text-zinc-300">Your rating <span className="text-zinc-500">(optional)</span></legend>
    <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map(star => <label key={star} className={`relative flex h-11 w-11 items-center justify-center rounded-lg text-3xl ${disabled ? 'opacity-40' : 'cursor-pointer hover:bg-zinc-800'}`} onMouseEnter={() => setHover(star)}>
        <input type="radio" name="mod-rating" value={star} checked={value === star} onChange={() => onChange(star)} className="peer sr-only" aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`} />
        <span aria-hidden className={`rounded px-1 peer-focus-visible:outline-2 peer-focus-visible:outline-current ${ratingColors[channel ?? "legacy"]}`}>{star <= (hover ?? value ?? 0) ? '★' : '☆'}</span>
      </label>)}
    </div>
    <p className="text-xs text-zinc-500">{value ? `${value} / 5 stars` : 'No rating selected'}</p>
  </fieldset>;
}
