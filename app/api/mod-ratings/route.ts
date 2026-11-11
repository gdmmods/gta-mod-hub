import { createSupabaseServerClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reply(payload: unknown, status = 200) { return Response.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } }); }
function failure(error: { code?: string; message: string }) {
  const setup = ['PGRST202','42P01','42883'].includes(error.code ?? '');
  return reply({ error: setup ? 'Ratings are awaiting database setup.' : error.message }, setup ? 503 : error.code === '42501' ? 403 : error.code === 'P0001' ? 429 : 400);
}
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const modId = q.get('modId');
  const page = Number(q.get('page') ?? 1);
  if (!modId || !uuid.test(modId) || !Number.isInteger(page) || page < 1 || page > 100000) return reply({ error: 'Invalid rating request.' }, 400);
  const client = await createSupabaseServerClient();
  const { data, error } = await client.rpc('read_mod_rating', { p_mod_id: modId, p_page: page });
  return error ? failure(error) : reply(data);
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Request origin could not be verified.' }, 403);
  const client = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return reply({ error: 'Sign in to rate this mod.' }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 4000) return reply({ error: 'Request is too large.' }, 413);
    const body = JSON.parse(raw);
    if (body?.action === 'moderate') {
      if (typeof body.ratingId !== 'string' || !uuid.test(body.ratingId) || typeof body.valid !== 'boolean' || typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 1000) return reply({ error: 'Provide a rating, validity decision and moderation reason.' }, 400);
      const { error } = await client.rpc('moderate_mod_rating', { p_rating_id: body.ratingId, p_valid: body.valid, p_reason: body.reason });
      return error ? failure(error) : reply({ saved: true });
    }
    if (body?.action !== 'rate' || typeof body.modId !== 'string' || !uuid.test(body.modId) || !Number.isInteger(body.value) || body.value < 1 || body.value > 5 || (body.creatorId != null && (typeof body.creatorId !== 'string' || !uuid.test(body.creatorId)))) return reply({ error: 'Choose a mod and a rating between one and five stars.' }, 400);
    const { data, error } = await client.rpc('submit_mod_feedback', { p_mod_id: body.modId, p_creator_id: body.creatorId ?? null, p_body: null, p_rating: body.value });
    return error ? failure(error) : reply(data);
  } catch { return reply({ error: 'Invalid rating request.' }, 400); }
}
