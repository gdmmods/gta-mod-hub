import { createSupabaseServerClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reply(payload: unknown, status = 200) {
  return Response.json(payload, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
function failure(error: { code?: string; message: string }) {
  const setup = ['PGRST202', '42883', '42P01'].includes(error.code ?? '');
  return reply({ error: setup ? 'Team archiving is awaiting database setup.' : error.message },
    setup ? 503 : error.code === '42501' ? 403 : error.code === '55000' ? 409 : 400);
}
export async function GET() {
  const client = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return reply({ error: 'Sign in to manage archived teams.' }, 401);
  const { data, error } = await client.rpc('get_archived_teams');
  return error ? failure(error) : reply({ teams: data ?? [] });
}
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Request origin could not be verified.' }, 403);
  const client = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return reply({ error: 'Sign in to manage teams.' }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 2000) return reply({ error: 'Request is too large.' }, 413);
    const body = JSON.parse(raw);
    if (!body || !['archive', 'restore'].includes(body.action) || typeof body.teamId !== 'string' || !uuid.test(body.teamId)) {
      return reply({ error: 'Choose a valid team and action.' }, 400);
    }
    const { data, error } = await client.rpc('set_team_archived', { p_team_id: body.teamId, p_archived: body.action === 'archive' });
    return error ? failure(error) : reply({ result: data });
  } catch {
    return reply({ error: 'Invalid team lifecycle request.' }, 400);
  }
}
