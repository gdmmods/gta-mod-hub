"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const labels: Record<string, string> = {
  emerging: 'Emerging Creator',
  established: 'Established Creator',
  trusted: 'Trusted Creator',
  distinguished: 'Distinguished Creator',
  legacy: 'Legacy Creator',
};

export default function CreatorTier({ creatorId }: { creatorId?: string }) {
  const [assessment, setAssessment] = useState<{ id: string; tier: string | null; unavailable: boolean }>();
  useEffect(() => {
    if (!creatorId) return;
    let active = true;
    void supabase.rpc('read_creator_tier', { p_creator_id: creatorId }).then(({ data, error }) => {
      if (active) setAssessment({ id: creatorId, tier: typeof data === 'string' ? data : null, unavailable: Boolean(error) });
    });
    return () => { active = false; };
  }, [creatorId]);
  const current = assessment?.id === creatorId ? assessment : undefined;
  return <p className="text-sm text-zinc-400">Creator Tier: <span className="font-medium text-purple-300">
    {current?.unavailable ? 'Unavailable' : current?.tier ? labels[current.tier] ?? 'Not yet assessed' : 'Not yet assessed'}
  </span></p>;
}
