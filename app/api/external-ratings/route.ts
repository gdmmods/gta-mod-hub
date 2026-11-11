import { createSupabaseServerClient } from '@/lib/supabase/server';

export const maxDuration = 45;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });

async function handle(request: Request, manual: boolean) {
  const url = new URL(request.url);
  const id = url.searchParams.get('modId');
  if (!id || !uuid.test(id)) return reply({ error: 'Invalid mod.' }, 400);
  if (manual && request.headers.get('origin') !== url.origin) return reply({ error: 'Invalid request origin.' }, 403);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return reply({ error: 'Sign in to refresh ratings.' }, 401);
  try {
    if (!manual) {
      const { data, error } = await supabase.rpc('read_external_rating_sync', { p_mod: id });
      if (error) throw error;
      return data ? reply(data) : reply({ error: 'Refresh is unavailable for this account.' }, 403);
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return reply({ error: 'Sign in to refresh ratings.' }, 401);
    const endpoint = new URL('/functions/v1/external-rating-sync', process.env.NEXT_PUBLIC_SUPABASE_URL);
    endpoint.searchParams.set('modId', id);
    const result = await fetch(endpoint, {
      method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token }, signal: AbortSignal.timeout(40_000),
    });
    return reply(await result.json(), result.status);
  } catch (error) {
    console.error('External rating request failed', error);
    return reply({ error: 'External rating synchronization is temporarily unavailable.' }, 503);
  }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
