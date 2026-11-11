import type { SupabaseClient } from '@supabase/supabase-js';

type Identity = { id: string; owner_type: string | null; team_id: string | null };

// Membership grants identity access; team lifecycle independently gates operation.
export async function filterOperationalCreators<T extends Identity>(client: SupabaseClient, creators: T[]): Promise<T[]> {
  const teamIds = [...new Set(creators.filter(c => c.owner_type === 'team' && c.team_id).map(c => c.team_id!))];
  if (!teamIds.length) return creators.filter(c => c.owner_type !== 'team');
  const { data, error } = await client.from('teams').select('id,creator_id').in('id', teamIds).eq('status', 'active');
  if (error) throw new Error('Could not verify active teams. Please try again.');
  const active = new Map((data ?? []).map(t => [t.id, t.creator_id]));
  return creators.filter(c => c.owner_type !== 'team' || (c.team_id !== null && active.get(c.team_id) === c.id));
}
